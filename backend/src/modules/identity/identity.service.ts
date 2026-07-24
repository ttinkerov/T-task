import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
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
import { AccessTokenDenyService } from '../../common/auth/services/access-token-deny.service';
import { ACCESS_TOKEN_COOKIE } from '../../common/auth/services/token-extractor.service';
import { DomainEvents } from '../../common/events/domain-events';
import {
  buildAccessCookieClearOptions,
  buildAccessCookieOptions,
  buildRefreshCookieClearOptions,
  buildRefreshCookieOptions,
} from '../../common/security/cookie-options.util';
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
    private readonly accessTokenDeny: AccessTokenDenyService,
    private readonly eventEmitter: EventEmitter2,
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

    if (!session) {
      throw new UnauthorizedException('Refresh token is invalid or expired');
    }

    if (session.revokedAt) {
      await this.revokeRefreshFamily(session.familyId);
      throw new UnauthorizedException('Refresh token is invalid or expired');
    }

    if (session.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token is invalid or expired');
    }

    if (session.user.deletedAt) {
      throw new UnauthorizedException('User is not available');
    }

    const revoked = await this.prisma.refreshSession.updateMany({
      where: {
        id: session.id,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    if (revoked.count === 0) {
      await this.revokeRefreshFamily(session.familyId);
      throw new UnauthorizedException('Refresh token is invalid or expired');
    }

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

    await this.revokeCurrentAccessToken(request);
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

    await this.accessTokenDeny.revokeAllForUser(userId);
    this.eventEmitter.emit(DomainEvents.USER_ACCESS_REVOKED, { userId });
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
    const accessJti = randomUUID();

    const accessToken = await this.jwtService.signAsync(accessPayload, {
      secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
      expiresIn: accessTtl as `${number}${'s' | 'm' | 'h' | 'd'}`,
      jwtid: accessJti,
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

    response.cookie(
      ACCESS_TOKEN_COOKIE,
      tokens.accessToken,
      buildAccessCookieOptions(accessTtlSeconds * 1000, isProduction),
    );

    response.cookie(
      REFRESH_TOKEN_COOKIE,
      tokens.refreshToken,
      buildRefreshCookieOptions(refreshTtlSeconds * 1000, isProduction),
    );
  }

  private clearAuthCookies(response: Response): void {
    const isProduction = this.configService.get<string>('NODE_ENV') === 'production';
    response.clearCookie(ACCESS_TOKEN_COOKIE, buildAccessCookieClearOptions(isProduction));
    response.clearCookie(REFRESH_TOKEN_COOKIE, buildRefreshCookieClearOptions(isProduction));
    // Clear legacy path=/ refresh cookies from older deploys.
    response.clearCookie(REFRESH_TOKEN_COOKIE, buildAccessCookieClearOptions(isProduction));
  }

  private async revokeCurrentAccessToken(request: Request): Promise<void> {
    const accessToken = request.cookies?.[ACCESS_TOKEN_COOKIE] as string | undefined;
    if (!accessToken) return;

    try {
      const payload = this.jwtService.verify<JwtPayload>(accessToken, {
        secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
      });
      if (payload.type !== 'access' || !payload.jti) return;

      const now = Math.floor(Date.now() / 1000);
      const ttl = typeof payload.exp === 'number' ? Math.max(1, payload.exp - now) : 900;
      await this.accessTokenDeny.revokeJti(payload.jti, ttl);
      if (payload.sub) {
        this.eventEmitter.emit(DomainEvents.USER_ACCESS_REVOKED, { userId: payload.sub });
      }
    } catch {
      // Expired/invalid access cookie — nothing to denylist.
    }
  }

  private async revokeRefreshFamily(familyId: string): Promise<void> {
    await this.prisma.refreshSession.updateMany({
      where: {
        familyId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
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
