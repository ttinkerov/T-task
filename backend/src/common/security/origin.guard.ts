import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

@Injectable()
export class OriginGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    if (!MUTATING_METHODS.has(request.method)) {
      return true;
    }

    const origin = request.headers.origin;
    const isProduction = this.configService.get<string>('NODE_ENV') === 'production';

    // Cookie-authenticated browsers always send Origin on cross-origin and same-origin
    // fetch/XHR mutations. Require it in production to block CSRF from non-browser clients
    // that omit Origin while still carrying cookies.
    if (!origin) {
      if (isProduction) {
        throw new ForbiddenException('Origin header is required');
      }
      return true;
    }

    const allowedOrigins = this.configService
      .getOrThrow<string>('CORS_ORIGIN')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);

    if (!allowedOrigins.includes(origin)) {
      throw new ForbiddenException('Invalid request origin');
    }

    return true;
  }
}
