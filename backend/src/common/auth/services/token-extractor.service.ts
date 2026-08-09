import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { JwtPayload } from '../interfaces/authenticated-user.interface';
import { AccessTokenDenyService } from './access-token-deny.service';

export const ACCESS_TOKEN_COOKIE = 'access_token';

@Injectable()
export class TokenExtractorService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly accessTokenDeny: AccessTokenDenyService,
  ) {}

  extractAccessToken(request: Request): string | null {
    const cookieToken = request.cookies?.[ACCESS_TOKEN_COOKIE] as string | undefined;
    return cookieToken || null;
  }

  verifyAccessToken(token: string): JwtPayload {
    try {
      const payload = this.jwtService.verify<JwtPayload>(token, {
        secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
      });

      if (payload.type !== 'access') {
        throw new UnauthorizedException('Неверный тип access-токена');
      }

      return payload;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Недействительный или истёкший access-токен');
    }
  }

  async verifyAccessTokenAsync(token: string): Promise<JwtPayload> {
    const payload = this.verifyAccessToken(token);
    await this.accessTokenDeny.assertNotRevoked(payload);
    return payload;
  }
}
