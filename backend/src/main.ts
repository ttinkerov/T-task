import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import * as cookieParser from 'cookie-parser';
import { json, urlencoded } from 'express';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { ResponseEnvelopeInterceptor } from './common/interceptors/response-envelope.interceptor';

const REQUEST_BODY_LIMIT = '100kb';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bodyParser: false });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('BACKEND_PORT', 3001);
  const corsOrigin = configService.get<string>('CORS_ORIGIN', 'http://localhost');
  const isProduction = configService.get<string>('NODE_ENV') === 'production';

  app.getHttpAdapter().getInstance().set('trust proxy', 1);

  app.use(json({ limit: REQUEST_BODY_LIMIT }));
  app.use(urlencoded({ extended: true, limit: REQUEST_BODY_LIMIT }));

  app.setGlobalPrefix('api/v1');
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: isProduction
        ? {
            directives: {
              defaultSrc: ["'none'"],
              frameAncestors: ["'none'"],
            },
          }
        : false,
    }),
  );
  app.use(cookieParser());
  app.enableCors({
    origin: corsOrigin,
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-workspace-id'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new ResponseEnvelopeInterceptor());

  await app.listen(port);
}

void bootstrap();
