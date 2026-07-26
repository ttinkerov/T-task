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

  async revokeAllForUser(userId: string): Promise<void> {
    try {
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
      const keys: string[] = [];
      const hasJti = Boolean(payload.jti);
      const hasEpochCheck = Boolean(payload.sub && typeof payload.iat === 'number');

      if (hasJti && payload.jti) {
        keys.push(this.jtiKey(payload.jti));
      }
      if (hasEpochCheck && payload.sub) {
        keys.push(this.userEpochKey(payload.sub));
      }

      if (keys.length === 0) {
        return;
      }

      const values = await client.mget(...keys);
      let offset = 0;

      if (hasJti) {
        const denied = values[offset++];
        if (denied) {
          throw new UnauthorizedException('Access token revoked');
        }
      }

      if (hasEpochCheck && typeof payload.iat === 'number') {
        const epochRaw = values[offset];
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
