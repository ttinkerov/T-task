import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { TokenExtractorService } from '../services/token-extractor.service';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';

export type RequestWithAuth = Request & {
  user?: AuthenticatedUser;
  authPayload?: { sub: string; email: string };
};

@Injectable()
export class AuthContextMiddleware implements NestMiddleware {
  constructor(private readonly tokenExtractor: TokenExtractorService) {}

  async use(request: RequestWithAuth, _response: Response, next: NextFunction): Promise<void> {
    const token = this.tokenExtractor.extractAccessToken(request);

    if (!token) {
      next();
      return;
    }

    try {
      // Sync verify only — Redis deny + user load happen once in JwtStrategy.
      const payload = this.tokenExtractor.verifyAccessToken(token);
      request.authPayload = { sub: payload.sub, email: payload.email };
    } catch {
      // Guard will enforce auth on protected routes.
    }

    next();
  }
}
