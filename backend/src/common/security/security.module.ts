import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { RedisModule } from '../../infrastructure/redis/redis.module';
import { AuthRateLimitGuard } from './auth-rate-limit.guard';
import { OriginGuard } from './origin.guard';

@Global()
@Module({
  imports: [RedisModule],
  providers: [
    AuthRateLimitGuard,
    OriginGuard,
    {
      provide: APP_GUARD,
      useClass: OriginGuard,
    },
  ],
  exports: [AuthRateLimitGuard, OriginGuard],
})
export class SecurityModule {}
