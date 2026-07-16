import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from '../auth/decorators/public.decorator';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

@Injectable()
export class OriginGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    if (!MUTATING_METHODS.has(request.method)) {
      return true;
    }

    const origin = request.headers.origin;

    if (!origin) {
      const isProduction = this.configService.get<string>('NODE_ENV') === 'production';
      const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);

      if (isProduction && isPublic) {
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
