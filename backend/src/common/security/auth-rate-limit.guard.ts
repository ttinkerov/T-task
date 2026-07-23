import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { resolveRateLimitKeys } from './rate-limit-keys.util';
import { DEFAULT_AUTH_RATE_LIMIT, RATE_LIMIT_KEY, RateLimitConfig } from './rate-limit.decorator';
import { RateLimitService } from './rate-limit.service';

@Injectable()
export class AuthRateLimitGuard implements CanActivate {
  constructor(
    private readonly rateLimitService: RateLimitService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>();
    const config =
      this.reflector.getAllAndOverride<RateLimitConfig>(RATE_LIMIT_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? DEFAULT_AUTH_RATE_LIMIT;

    const keys = resolveRateLimitKeys(request, config);

    for (const rateKey of keys) {
      await this.rateLimitService.consume(rateKey, config);
    }

    return true;
  }
}
