import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';
import { Public } from '../../common/auth/decorators/public.decorator';
import { successResponse } from '../../common/interfaces/api-response.interface';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { RedisService } from '../../infrastructure/redis/redis.service';

@Controller('health')
@Public()
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  @Get('live')
  live() {
    return successResponse({ status: 'ok' });
  }

  @Get('ready')
  async ready() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      await this.redis.ping();
    } catch {
      throw new HttpException('Service unavailable', HttpStatus.SERVICE_UNAVAILABLE);
    }

    return successResponse({ status: 'ok' });
  }
}
