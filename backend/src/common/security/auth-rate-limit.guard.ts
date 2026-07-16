import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { RedisService } from '../../infrastructure/redis/redis.service';
import { DEFAULT_AUTH_RATE_LIMIT, RATE_LIMIT_KEY, RateLimitConfig } from './rate-limit.decorator';

@Injectable()
export class AuthRateLimitGuard implements CanActivate {
  private readonly logger = new Logger(AuthRateLimitGuard.name);
  private readonly memoryStore = new Map<string, { count: number; expiresAt: number }>();

  constructor(
    private readonly redis: RedisService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const ip = this.resolveClientIp(request);
    const config =
      this.reflector.getAllAndOverride<RateLimitConfig>(RATE_LIMIT_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? DEFAULT_AUTH_RATE_LIMIT;

    try {
      return await this.checkRedisRateLimit(ip, config);
    } catch (error) {
      this.logger.warn(
        `Redis rate limit unavailable, using in-memory fallback: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
      return this.checkMemoryRateLimit(ip, config);
    }
  }

  private async checkRedisRateLimit(ip: string, config: RateLimitConfig): Promise<boolean> {
    const key = `${config.keyPrefix}:${ip}`;
    const client = this.redis.getClient();

    const attempts = await client.incr(key);

    if (attempts === 1) {
      await client.expire(key, config.windowSeconds);
    }

    if (attempts > config.maxAttempts) {
      throw new HttpException('Too many requests. Try again later.', HttpStatus.TOO_MANY_REQUESTS);
    }

    return true;
  }

  private checkMemoryRateLimit(ip: string, config: RateLimitConfig): boolean {
    const now = Date.now();
    const storeKey = `${config.keyPrefix}:${ip}`;
    const existing = this.memoryStore.get(storeKey);

    if (!existing || existing.expiresAt <= now) {
      this.memoryStore.set(storeKey, {
        count: 1,
        expiresAt: now + config.windowSeconds * 1000,
      });
      return true;
    }

    const nextCount = existing.count + 1;
    this.memoryStore.set(storeKey, {
      count: nextCount,
      expiresAt: existing.expiresAt,
    });

    if (nextCount > config.maxAttempts) {
      throw new HttpException('Too many requests. Try again later.', HttpStatus.TOO_MANY_REQUESTS);
    }

    return true;
  }

  private resolveClientIp(request: Request): string {
    const forwarded = request.headers['x-forwarded-for'];

    if (typeof forwarded === 'string' && forwarded.length > 0) {
      return forwarded.split(',')[0]?.trim() ?? 'unknown';
    }

    return request.ip ?? 'unknown';
  }
}
