import { Global, Module } from '@nestjs/common';
import { RedisModule } from '../../infrastructure/redis/redis.module';
import { AuthRateLimitGuard } from './auth-rate-limit.guard';

@Global()
@Module({
  imports: [RedisModule],
  providers: [AuthRateLimitGuard],
  exports: [AuthRateLimitGuard],
})
export class SecurityModule {}
