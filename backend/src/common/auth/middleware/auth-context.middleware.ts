import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { TokenExtractorService } from '../services/token-extractor.service';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';

export type RequestWithAuth = Request & {
  user?: AuthenticatedUser;
  authPayload?: { sub: string; email: string };
};

@Injectable()
export class AuthContextMiddleware implements NestMiddleware {
  constructor(
    private readonly tokenExtractor: TokenExtractorService,
    private readonly prisma: PrismaService,
  ) {}

  async use(request: RequestWithAuth, _response: Response, next: NextFunction): Promise<void> {
    const token = this.tokenExtractor.extractAccessToken(request);

    if (!token) {
      next();
      return;
    }

    try {
      const payload = this.tokenExtractor.verifyAccessToken(token);
      const user = await this.prisma.user.findFirst({
        where: {
          id: payload.sub,
          deletedAt: null,
        },
        select: {
          id: true,
          email: true,
          name: true,
        },
      });

      if (user) {
        request.authPayload = { sub: payload.sub, email: payload.email };
        request.user = user;
      }
    } catch {
      // Guard will enforce auth on protected routes.
    }

    next();
  }
}
