import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { RedisModule } from '../../infrastructure/redis/redis.module';
import { AccessTokenDenyService } from '../auth/services/access-token-deny.service';
import { AuthUserCacheService } from '../auth/services/auth-user-cache.service';
import { AuthRateLimitGuard } from './auth-rate-limit.guard';
import { OriginGuard } from './origin.guard';
import { RateLimitService } from './rate-limit.service';

@Global()
@Module({
  imports: [RedisModule, PrismaModule],
  providers: [
    RateLimitService,
    AccessTokenDenyService,
    AuthUserCacheService,
    AuthRateLimitGuard,
    OriginGuard,
    {
      provide: APP_GUARD,
      useClass: OriginGuard,
    },
  ],
  exports: [
    RateLimitService,
    AccessTokenDenyService,
    AuthUserCacheService,
    AuthRateLimitGuard,
    OriginGuard,
  ],
})
export class SecurityModule {}
