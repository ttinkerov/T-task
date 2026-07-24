import {
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { RedisService } from '../../../infrastructure/redis/redis.service';
import type { JwtPayload } from '../interfaces/authenticated-user.interface';

@Injectable()
export class AccessTokenDenyService {
  private readonly logger = new Logger(AccessTokenDenyService.name);

  constructor(private readonly redis: RedisService) {}

  /** Deny a single access token (logout). TTL should match remaining JWT lifetime. */
  async revokeJti(jti: string, ttlSeconds: number): Promise<void> {
    if (!jti || ttlSeconds <= 0) return;
    try {
      await this.redis.getClient().setex(this.jtiKey(jti), ttlSeconds, '1');
    } catch (error) {
      this.logger.error(
        `Failed to revoke access jti: ${error instanceof Error ? error.message : 'unknown'}`,
      );
      throw new ServiceUnavailableException('Unable to revoke access token');
    }
  }

  /** Invalidate all access tokens for a user issued at or before now (logout-all). */
  async revokeAllForUser(userId: string): Promise<void> {
    try {
      // Keep longer than max access TTL (15m default) — 1h covers clock skew / config bumps.
      await this.redis
        .getClient()
        .setex(this.userEpochKey(userId), 3600, String(Math.floor(Date.now() / 1000)));
    } catch (error) {
      this.logger.error(
        `Failed to revoke user access epoch: ${error instanceof Error ? error.message : 'unknown'}`,
      );
      throw new ServiceUnavailableException('Unable to revoke sessions');
    }
  }

  async assertNotRevoked(payload: JwtPayload): Promise<void> {
    try {
      const client = this.redis.getClient();

      if (payload.jti) {
        const denied = await client.get(this.jtiKey(payload.jti));
        if (denied) {
          throw new UnauthorizedException('Access token revoked');
        }
      }

      if (payload.sub && typeof payload.iat === 'number') {
        const epochRaw = await client.get(this.userEpochKey(payload.sub));
        if (epochRaw) {
          const epoch = Number(epochRaw);
          if (Number.isFinite(epoch) && payload.iat <= epoch) {
            throw new UnauthorizedException('Access token revoked');
          }
        }
      }
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      // Soft-fail reads: Redis outage must not lock out the whole product.
      // Revocation writes remain fail-closed.
      this.logger.warn(
        `Access deny check skipped (Redis unavailable): ${
          error instanceof Error ? error.message : 'unknown'
        }`,
      );
    }
  }

  private jtiKey(jti: string) {
    return `access:deny:jti:${jti}`;
  }

  private userEpochKey(userId: string) {
    return `access:deny:user:${userId}`;
  }
}
