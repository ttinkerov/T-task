import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { CurrentUser } from '../../common/auth/decorators/current-user.decorator';
import { Public } from '../../common/auth/decorators/public.decorator';
import { AuthRateLimitGuard } from '../../common/security/auth-rate-limit.guard';
import {
  AUTH_FORGOT_PASSWORD_RATE_LIMIT,
  AUTH_ME_RATE_LIMIT,
  AUTH_RESET_PASSWORD_RATE_LIMIT,
  AUTH_SESSION_RATE_LIMIT,
  RateLimit,
} from '../../common/security/rate-limit.decorator';
import { AuthenticatedUser } from '../../common/auth/interfaces/authenticated-user.interface';
import { successResponse } from '../../common/interfaces/api-response.interface';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { IdentityService } from './identity.service';

@ApiTags('auth')
@Controller('auth')
export class IdentityController {
  constructor(private readonly identityService: IdentityService) {}

  @Public()
  @UseGuards(AuthRateLimitGuard)
  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
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
  @ApiOperation({ summary: 'Login with email and password' })
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
  @RateLimit(AUTH_FORGOT_PASSWORD_RATE_LIMIT)
  @Post('forgot-password')
  @ApiOperation({ summary: 'Request password reset email' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    const data = await this.identityService.requestPasswordReset(dto);
    return successResponse(data);
  }

  @Public()
  @UseGuards(AuthRateLimitGuard)
  @RateLimit(AUTH_RESET_PASSWORD_RATE_LIMIT)
  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password with email token' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    const data = await this.identityService.resetPassword(dto);
    return successResponse(data);
  }

  @Public()
  @UseGuards(AuthRateLimitGuard)
  @RateLimit(AUTH_SESSION_RATE_LIMIT)
  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  async refresh(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const data = await this.identityService.refresh(request, response);
    return successResponse(data);
  }

  @Public()
  @UseGuards(AuthRateLimitGuard)
  @RateLimit(AUTH_SESSION_RATE_LIMIT)
  @Post('logout')
  @ApiOperation({ summary: 'Logout current session' })
  async logout(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const data = await this.identityService.logout(request, response);
    return successResponse(data);
  }

  @UseGuards(AuthRateLimitGuard)
  @RateLimit(AUTH_SESSION_RATE_LIMIT)
  @Post('logout-all')
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: 'Logout all sessions' })
  async logoutAll(
    @CurrentUser() user: AuthenticatedUser,
    @Res({ passthrough: true }) response: Response,
  ) {
    const data = await this.identityService.logoutAll(user.id, response);
    return successResponse(data);
  }

  @Get('me')
  @UseGuards(AuthRateLimitGuard)
  @RateLimit(AUTH_ME_RATE_LIMIT)
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: 'Current user profile and workspaces' })
  async me(@CurrentUser() user: AuthenticatedUser) {
    const data = await this.identityService.getMe(user.id);
    return successResponse(data);
  }
}
