import { Module } from '@nestjs/common';
import { IdentityModule } from '../identity/identity.module';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { RealtimeGateway } from './realtime.gateway';

@Module({
  imports: [IdentityModule, PrismaModule],
  providers: [RealtimeGateway],
})
export class RealtimeModule {}
