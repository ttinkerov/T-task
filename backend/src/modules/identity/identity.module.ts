import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthContextMiddleware } from '../../common/auth/middleware/auth-context.middleware';
import { JwtAuthGuard } from '../../common/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/auth/guards/roles.guard';
import { TokenExtractorService } from '../../common/auth/services/token-extractor.service';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { IdentityController } from './identity.controller';
import { IdentityService } from './identity.service';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({}),
    WorkspacesModule,
  ],
  controllers: [IdentityController],
  providers: [
    IdentityService,
    JwtStrategy,
    TokenExtractorService,
    AuthContextMiddleware,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
  exports: [IdentityService, TokenExtractorService],
})
export class IdentityModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(AuthContextMiddleware).forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
