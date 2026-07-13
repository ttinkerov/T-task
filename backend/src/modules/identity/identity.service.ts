import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { WorkspaceRole, Prisma } from '@prisma/client';
import * as argon2 from 'argon2';
import { randomUUID } from 'crypto';
import { Request, Response } from 'express';
import { JwtPayload } from '../../common/auth/interfaces/authenticated-user.interface';
import {
  generateRefreshToken,
  hashToken,
  parseDurationToSeconds,
} from '../../common/auth/utils/token.util';
import { ACCESS_TOKEN_COOKIE } from '../../common/auth/services/token-extractor.service';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

export const REFRESH_TOKEN_COOKIE = 'refresh_token';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUserView {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
}

export interface WorkspaceView {
  id: string;
  name: string;
  slug: string;
  role: WorkspaceRole;
}

@Injectable()
export class IdentityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly workspacesService: WorkspacesService,
  ) {}

  async register(dto: RegisterDto, request: Request, response: Response) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('Email is already registered');
    }

    const passwordHash = await argon2.hash(dto.password);

    const result = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const user = await tx.user.create({
        data: {
          email: dto.email.toLowerCase(),
          passwordHash,
          name: dto.name.trim(),
        },
      });

      return { user };
    });

    const tokens = await this.issueTokens(result.user.id, result.user.email, request);
    this.setAuthCookies(response, tokens);

    return {
      user: this.toUserView(result.user),
    };
  }

  async login(dto: LoginDto, request: Request, response: Response) {
    const user = await this.prisma.user.findFirst({
      where: {
        email: dto.email.toLowerCase(),
        deletedAt: null,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordValid = await argon2.verify(user.passwordHash, dto.password);

    if (!passwordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const tokens = await this.issueTokens(user.id, user.email, request);
    this.setAuthCookies(response, tokens);

    const workspaces = await this.workspacesService.listForUser(user.id);

    return {
      user: this.toUserView(user),
      workspaces,
    };
  }

  async refresh(request: Request, response: Response) {
    const refreshToken = request.cookies?.[REFRESH_TOKEN_COOKIE] as string | undefined;

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is missing');
    }

    const tokenHash = hashToken(refreshToken);
    const session = await this.prisma.refreshSession.findUnique({
      where: { tokenHash },
      include: {
        user: true,
      },
    });

    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token is invalid or expired');
    }

    if (session.user.deletedAt) {
      throw new UnauthorizedException('User is not available');
    }

    await this.prisma.refreshSession.update({
      where: { id: session.id },
      data: {
        revokedAt: new Date(),
      },
    });

    const tokens = await this.issueTokens(
      session.user.id,
      session.user.email,
      request,
      session.familyId,
    );
    this.setAuthCookies(response, tokens);

    const workspaces = await this.workspacesService.listForUser(session.user.id);

    return {
      user: this.toUserView(session.user),
      workspaces,
    };
  }

  async logout(request: Request, response: Response) {
    const refreshToken = request.cookies?.[REFRESH_TOKEN_COOKIE] as string | undefined;

    if (refreshToken) {
      const tokenHash = hashToken(refreshToken);
      await this.prisma.refreshSession.updateMany({
        where: {
          tokenHash,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      });
    }

    this.clearAuthCookies(response);

    return { success: true };
  }

  async logoutAll(userId: string, response: Response) {
    await this.prisma.refreshSession.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    this.clearAuthCookies(response);

    return { success: true };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        deletedAt: null,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const workspaces = await this.workspacesService.listForUser(userId);

    return {
      user: this.toUserView(user),
      workspaces,
    };
  }

  private async issueTokens(
    userId: string,
    email: string,
    request: Request,
    familyId?: string,
  ): Promise<AuthTokens> {
    const accessPayload: JwtPayload = {
      sub: userId,
      email,
      type: 'access',
    };

    const accessTtl = this.configService.getOrThrow<string>('JWT_ACCESS_TTL');
    const refreshTtl = this.configService.getOrThrow<string>('JWT_REFRESH_TTL');

    const accessToken = await this.jwtService.signAsync(accessPayload, {
      secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
      expiresIn: accessTtl as `${number}${'s' | 'm' | 'h' | 'd'}`,
    });

    const refreshToken = generateRefreshToken();
    const refreshTokenHash = hashToken(refreshToken);
    const refreshExpiresAt = new Date(Date.now() + parseDurationToSeconds(refreshTtl) * 1000);

    await this.prisma.refreshSession.create({
      data: {
        userId,
        tokenHash: refreshTokenHash,
        familyId: familyId ?? randomUUID(),
        ipAddress: request.ip,
        deviceInfo: {
          userAgent: request.headers['user-agent'] ?? null,
        },
        expiresAt: refreshExpiresAt,
      },
    });

    return { accessToken, refreshToken };
  }

  private setAuthCookies(response: Response, tokens: AuthTokens): void {
    const accessTtlSeconds = parseDurationToSeconds(
      this.configService.getOrThrow<string>('JWT_ACCESS_TTL'),
    );
    const refreshTtlSeconds = parseDurationToSeconds(
      this.configService.getOrThrow<string>('JWT_REFRESH_TTL'),
    );
    const isProduction = this.configService.get<string>('NODE_ENV') === 'production';

    response.cookie(ACCESS_TOKEN_COOKIE, tokens.accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: accessTtlSeconds * 1000,
    });

    response.cookie(REFRESH_TOKEN_COOKIE, tokens.refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: refreshTtlSeconds * 1000,
    });
  }

  private clearAuthCookies(response: Response): void {
    response.clearCookie(ACCESS_TOKEN_COOKIE, { path: '/' });
    response.clearCookie(REFRESH_TOKEN_COOKIE, { path: '/' });
  }

  private toUserView(user: {
    id: string;
    email: string;
    name: string;
    avatarUrl: string | null;
  }): AuthUserView {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
    };
  }
}
