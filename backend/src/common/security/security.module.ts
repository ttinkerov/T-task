import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { RedisModule } from '../../infrastructure/redis/redis.module';
import { AccessTokenDenyService } from '../auth/services/access-token-deny.service';
import { AuthRateLimitGuard } from './auth-rate-limit.guard';
import { OriginGuard } from './origin.guard';
import { RateLimitService } from './rate-limit.service';

@Global()
@Module({
  imports: [RedisModule],
  providers: [
    RateLimitService,
    AccessTokenDenyService,
    AuthRateLimitGuard,
    OriginGuard,
    {
      provide: APP_GUARD,
      useClass: OriginGuard,
    },
  ],
  exports: [RateLimitService, AccessTokenDenyService, AuthRateLimitGuard, OriginGuard],
})
export class SecurityModule {}
