import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';
import { RedisService } from '../../infrastructure/redis/redis.service';

const WINDOW_SECONDS = 60;
const MAX_ATTEMPTS = 20;

@Injectable()
export class AuthRateLimitGuard implements CanActivate {
  private readonly logger = new Logger(AuthRateLimitGuard.name);
  private readonly memoryStore = new Map<string, { count: number; expiresAt: number }>();

  constructor(private readonly redis: RedisService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const ip = this.resolveClientIp(request);

    try {
      return await this.checkRedisRateLimit(ip);
    } catch (error) {
      this.logger.warn(
        `Redis rate limit unavailable, using in-memory fallback: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
      return this.checkMemoryRateLimit(ip);
    }
  }

  private async checkRedisRateLimit(ip: string): Promise<boolean> {
    const key = `auth:rate:${ip}`;
    const client = this.redis.getClient();

    const attempts = await client.incr(key);

    if (attempts === 1) {
      await client.expire(key, WINDOW_SECONDS);
    }

    if (attempts > MAX_ATTEMPTS) {
      throw new HttpException('Too many requests. Try again later.', HttpStatus.TOO_MANY_REQUESTS);
    }

    return true;
  }

  private checkMemoryRateLimit(ip: string): boolean {
    const now = Date.now();
    const existing = this.memoryStore.get(ip);

    if (!existing || existing.expiresAt <= now) {
      this.memoryStore.set(ip, {
        count: 1,
        expiresAt: now + WINDOW_SECONDS * 1000,
      });
      return true;
    }

    const nextCount = existing.count + 1;
    this.memoryStore.set(ip, {
      count: nextCount,
      expiresAt: existing.expiresAt,
    });

    if (nextCount > MAX_ATTEMPTS) {
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
