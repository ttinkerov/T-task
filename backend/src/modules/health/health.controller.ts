import { Controller, Get } from '@nestjs/common';
import { Public } from '../../common/auth/decorators/public.decorator';

@Controller('health')
export class HealthController {
  @Public()
  @Get('live')
  live() {
    return { status: 'ok' };
  }

  @Public()
  @Get('ready')
  ready() {
    return { status: 'ok' };
  }
}
