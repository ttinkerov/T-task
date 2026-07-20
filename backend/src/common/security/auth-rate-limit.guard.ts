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
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
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
    const request = context.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>();
    const config =
      this.reflector.getAllAndOverride<RateLimitConfig>(RATE_LIMIT_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? DEFAULT_AUTH_RATE_LIMIT;

    const keys = this.resolveRateKeys(request);

    for (const rateKey of keys) {
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

    return true;
  }

  /**
   * Prefer user id; for anonymous auth endpoints also key by email so
   * X-Forwarded-For spoofing cannot bypass per-account brute-force limits.
   */
  private resolveRateKeys(request: Request & { user?: AuthenticatedUser }): string[] {
    if (request.user?.id) {
      return [request.user.id];
    }

    const body = request.body as { email?: unknown } | undefined;
    const email =
      typeof body?.email === 'string' ? body.email.trim().toLowerCase().slice(0, 320) : '';
    const ip = request.ip ?? 'unknown';

    if (email) {
      return [`ip:${ip}`, `email:${email}`];
    }

    return [`ip:${ip}`];
  }

  private async checkRedisRateLimit(rateKey: string, config: RateLimitConfig): Promise<boolean> {
    const key = `${config.keyPrefix}:${rateKey}`;
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

  private checkMemoryRateLimit(rateKey: string, config: RateLimitConfig): boolean {
    const now = Date.now();
    const storeKey = `${config.keyPrefix}:${rateKey}`;
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
}
