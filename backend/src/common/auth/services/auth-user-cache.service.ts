import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { RedisService } from '../../../infrastructure/redis/redis.service';
import type { AuthenticatedUser } from '../interfaces/authenticated-user.interface';

export const AUTH_USER_CACHE_TTL_SECONDS = 45;

@Injectable()
export class AuthUserCacheService {
  private readonly logger = new Logger(AuthUserCacheService.name);

  constructor(
    private readonly redis: RedisService,
    private readonly prisma: PrismaService,
  ) {}

  async getActiveUser(userId: string): Promise<AuthenticatedUser | null> {
    const cacheKey = this.cacheKey(userId);

    try {
      const cached = await this.redis.getClient().get(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached) as AuthenticatedUser;
        if (parsed?.id && parsed.email && parsed.name) {
          return parsed;
        }
      }
    } catch (error) {
      this.logger.warn(
        `Auth user cache read failed: ${error instanceof Error ? error.message : 'unknown'}`,
      );
    }

    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        deletedAt: null,
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    if (!user) {
      return null;
    }

    try {
      await this.redis
        .getClient()
        .setex(cacheKey, AUTH_USER_CACHE_TTL_SECONDS, JSON.stringify(user));
    } catch (error) {
      this.logger.warn(
        `Auth user cache write failed: ${error instanceof Error ? error.message : 'unknown'}`,
      );
    }

    return user;
  }

  async invalidate(userId: string): Promise<void> {
    try {
      await this.redis.getClient().del(this.cacheKey(userId));
    } catch (error) {
      this.logger.warn(
        `Auth user cache invalidate failed: ${error instanceof Error ? error.message : 'unknown'}`,
      );
    }
  }

  private cacheKey(userId: string) {
    return `auth:user:${userId}`;
  }
}
