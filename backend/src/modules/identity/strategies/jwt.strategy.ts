import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AccessTokenDenyService } from '../../../common/auth/services/access-token-deny.service';
import { AuthUserCacheService } from '../../../common/auth/services/auth-user-cache.service';
import { TokenExtractorService } from '../../../common/auth/services/token-extractor.service';
import {
  AuthenticatedUser,
  JwtPayload,
} from '../../../common/auth/interfaces/authenticated-user.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    tokenExtractor: TokenExtractorService,
    private readonly accessTokenDeny: AccessTokenDenyService,
    private readonly authUserCache: AuthUserCacheService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => tokenExtractor.extractAccessToken(request),
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    if (payload.type !== 'access') {
      throw new UnauthorizedException('Неверный тип access-токена');
    }

    await this.accessTokenDeny.assertNotRevoked(payload);

    const user = await this.authUserCache.getActiveUser(payload.sub);

    if (!user) {
      throw new UnauthorizedException('Пользователь не найден');
    }

    return user;
  }
}
