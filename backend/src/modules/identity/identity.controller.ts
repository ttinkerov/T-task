import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { CurrentUser } from '../../common/auth/decorators/current-user.decorator';
import { Public } from '../../common/auth/decorators/public.decorator';
import { AuthRateLimitGuard } from '../../common/security/auth-rate-limit.guard';
import { AuthenticatedUser } from '../../common/auth/interfaces/authenticated-user.interface';
import { successResponse } from '../../common/interfaces/api-response.interface';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { IdentityService } from './identity.service';

@Controller('auth')
export class IdentityController {
  constructor(private readonly identityService: IdentityService) {}

  @Public()
  @UseGuards(AuthRateLimitGuard)
  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const data = await this.identityService.register(dto, request, response);
    return successResponse(data);
  }

  @Public()
  @UseGuards(AuthRateLimitGuard)
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const data = await this.identityService.login(dto, request, response);
    return successResponse(data);
  }

  @Public()
  @UseGuards(AuthRateLimitGuard)
  @Post('refresh')
  async refresh(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const data = await this.identityService.refresh(request, response);
    return successResponse(data);
  }

  @Public()
  @Post('logout')
  async logout(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const data = await this.identityService.logout(request, response);
    return successResponse(data);
  }

  @Post('logout-all')
  async logoutAll(
    @CurrentUser() user: AuthenticatedUser,
    @Res({ passthrough: true }) response: Response,
  ) {
    const data = await this.identityService.logoutAll(user.id, response);
    return successResponse(data);
  }

  @Get('me')
  async me(@CurrentUser() user: AuthenticatedUser) {
    const data = await this.identityService.getMe(user.id);
    return successResponse(data);
  }
}
