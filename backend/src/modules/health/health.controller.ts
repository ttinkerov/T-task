import { Controller, Get } from '@nestjs/common';
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
    await this.prisma.$queryRaw`SELECT 1`;
    await this.redis.ping();

    return successResponse({
      status: 'ok',
      checks: {
        postgres: 'up',
        redis: 'up',
      },
    });
  }
}
