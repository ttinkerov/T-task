import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../infrastructure/redis/redis.service';
import type { RateLimitConfig } from './rate-limit.decorator';

@Injectable()
export class RateLimitService {
  private readonly logger = new Logger(RateLimitService.name);
  private readonly memoryStore = new Map<string, { count: number; expiresAt: number }>();

  constructor(private readonly redis: RedisService) {}

  async consume(rateKey: string, config: RateLimitConfig): Promise<void> {
    try {
      await this.checkRedisRateLimit(rateKey, config);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.warn(
        `Redis rate limit unavailable, using in-memory fallback: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
      this.checkMemoryRateLimit(rateKey, config);
    }
  }

  private async checkRedisRateLimit(rateKey: string, config: RateLimitConfig): Promise<void> {
    const key = `${config.keyPrefix}:${rateKey}`;
    const client = this.redis.getClient();

    const attempts = await client.incr(key);

    if (attempts === 1) {
      await client.expire(key, config.windowSeconds);
    }

    if (attempts > config.maxAttempts) {
      throw new HttpException('Too many requests. Try again later.', HttpStatus.TOO_MANY_REQUESTS);
    }
  }

  private checkMemoryRateLimit(rateKey: string, config: RateLimitConfig): void {
    const now = Date.now();
    const storeKey = `${config.keyPrefix}:${rateKey}`;
    const existing = this.memoryStore.get(storeKey);

    if (!existing || existing.expiresAt <= now) {
      this.memoryStore.set(storeKey, {
        count: 1,
        expiresAt: now + config.windowSeconds * 1000,
      });
      return;
    }

    const nextCount = existing.count + 1;
    this.memoryStore.set(storeKey, {
      count: nextCount,
      expiresAt: existing.expiresAt,
    });

    if (nextCount > config.maxAttempts) {
      throw new HttpException('Too many requests. Try again later.', HttpStatus.TOO_MANY_REQUESTS);
    }
  }
}
