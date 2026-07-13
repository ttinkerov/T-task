import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { JwtPayload } from '../interfaces/authenticated-user.interface';

export const ACCESS_TOKEN_COOKIE = 'access_token';

@Injectable()
export class TokenExtractorService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  extractAccessToken(request: Request): string | null {
    const cookieToken = request.cookies?.[ACCESS_TOKEN_COOKIE] as string | undefined;

    if (cookieToken) {
      return cookieToken;
    }

    const authorization = request.headers.authorization;

    if (authorization?.startsWith('Bearer ')) {
      return authorization.slice(7);
    }

    return null;
  }

  verifyAccessToken(token: string): JwtPayload {
    try {
      const payload = this.jwtService.verify<JwtPayload>(token, {
        secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
      });

      if (payload.type !== 'access') {
        throw new UnauthorizedException('Invalid access token type');
      }

      return payload;
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }
  }
}
