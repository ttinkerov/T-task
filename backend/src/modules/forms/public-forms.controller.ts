import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { Public } from '../../common/auth/decorators/public.decorator';
import { AuthRateLimitGuard } from '../../common/security/auth-rate-limit.guard';
import {
  PUBLIC_FORM_GET_RATE_LIMIT,
  PUBLIC_FORM_SUBMIT_RATE_LIMIT,
  RateLimit,
} from '../../common/security/rate-limit.decorator';
import { successResponse } from '../../common/interfaces/api-response.interface';
import { SubmitFormDto } from './dto/submit-form.dto';
import { FormsService } from './forms.service';

@Controller('public/forms')
@Public()
export class PublicFormsController {
  constructor(private readonly formsService: FormsService) {}

  @Get(':token')
  @UseGuards(AuthRateLimitGuard)
  @RateLimit(PUBLIC_FORM_GET_RATE_LIMIT)
  async getForm(@Param('token') token: string) {
    const form = await this.formsService.getPublicForm(token);
    return successResponse(form);
  }

  @Post(':token/submit')
  @UseGuards(AuthRateLimitGuard)
  @RateLimit(PUBLIC_FORM_SUBMIT_RATE_LIMIT)
  async submit(@Param('token') token: string, @Body() dto: SubmitFormDto) {
    const result = await this.formsService.submitPublicForm(token, dto.answers);
    return successResponse(result);
  }
}
