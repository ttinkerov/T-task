import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { RedisModule } from '../../infrastructure/redis/redis.module';
import { AuthRateLimitGuard } from './auth-rate-limit.guard';
import { OriginGuard } from './origin.guard';
import { RateLimitService } from './rate-limit.service';

@Global()
@Module({
  imports: [RedisModule],
  providers: [
    RateLimitService,
    AuthRateLimitGuard,
    OriginGuard,
    {
      provide: APP_GUARD,
      useClass: OriginGuard,
    },
  ],
  exports: [RateLimitService, AuthRateLimitGuard, OriginGuard],
})
export class SecurityModule {}
