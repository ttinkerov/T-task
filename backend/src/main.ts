import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as compression from 'compression';
import * as cookieParser from 'cookie-parser';
import { json, urlencoded } from 'express';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { ResponseEnvelopeInterceptor } from './common/interceptors/response-envelope.interceptor';
import { assertSecureRuntime } from './common/security/assert-secure-runtime.util';
import { ruValidationExceptionFactory } from './common/validation/ru-validation.exception-factory';
import { RedisIoAdapter } from './infrastructure/redis/redis-io.adapter';

const REQUEST_BODY_LIMIT = '100kb';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bodyParser: false });

  const configService = app.get(ConfigService);
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');
  assertSecureRuntime(nodeEnv);

  const redisIoAdapter = new RedisIoAdapter(app);
  await redisIoAdapter.connectToRedis();
  app.useWebSocketAdapter(redisIoAdapter);

  const port = configService.get<number>('BACKEND_PORT', 3001);
  const corsOrigins = configService
    .get<string>('CORS_ORIGIN', 'http://localhost')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  const isProduction = nodeEnv === 'production';

  const trustProxyRaw = (configService.get<string>('TRUST_PROXY') ?? (isProduction ? '1' : 'false'))
    .trim()
    .toLowerCase();
  if (trustProxyRaw !== 'false' && trustProxyRaw !== '0') {
    const asNumber = Number(trustProxyRaw);
    app
      .getHttpAdapter()
      .getInstance()
      .set(
        'trust proxy',
        Number.isFinite(asNumber) && trustProxyRaw !== '' ? asNumber : trustProxyRaw,
      );
  }

  app.use(compression());
  app.use(json({ limit: REQUEST_BODY_LIMIT }));
  app.use(urlencoded({ extended: true, limit: REQUEST_BODY_LIMIT }));

  app.setGlobalPrefix('api/v1', {
    exclude: ['health/live', 'health/ready'],
  });
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      strictTransportSecurity: isProduction
        ? {
            maxAge: 63_072_000,
            includeSubDomains: true,
            preload: true,
          }
        : false,
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
    origin: corsOrigins.length === 1 ? corsOrigins[0] : corsOrigins,
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-workspace-id'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: ruValidationExceptionFactory,
    }),
  );
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new ResponseEnvelopeInterceptor());

  if (!isProduction) {
    const openApi = new DocumentBuilder()
      .setTitle('T-task API')
      .setDescription('REST API v1 — workspaces, boards, CRM, forms, AI/RAG')
      .setVersion('1.0')
      .addCookieAuth('access_token')
      .addApiKey(
        { type: 'apiKey', name: 'x-workspace-id', in: 'header', description: 'Active workspace' },
        'workspace',
      )
      .build();
    const document = SwaggerModule.createDocument(app, openApi);
    SwaggerModule.setup('docs', app, document, {
      jsonDocumentUrl: 'docs-json',
    });
  }

  await app.listen(port);
}

void bootstrap();
