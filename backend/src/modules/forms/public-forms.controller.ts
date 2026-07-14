import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { Public } from '../../common/auth/decorators/public.decorator';
import { AuthRateLimitGuard } from '../../common/security/auth-rate-limit.guard';
import { successResponse } from '../../common/interfaces/api-response.interface';
import { SubmitFormDto } from './dto/submit-form.dto';
import { FormsService } from './forms.service';

@Controller('public/forms')
@Public()
export class PublicFormsController {
  constructor(private readonly formsService: FormsService) {}

  @Get(':token')
  async getForm(@Param('token') token: string) {
    const form = await this.formsService.getPublicForm(token);
    return successResponse(form);
  }

  @Post(':token/submit')
  @UseGuards(AuthRateLimitGuard)
  async submit(@Param('token') token: string, @Body() dto: SubmitFormDto) {
    const result = await this.formsService.submitPublicForm(token, dto.answers);
    return successResponse(result);
  }
}
