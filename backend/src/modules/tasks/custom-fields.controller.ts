import { Body, Controller, Delete, Get, Param, Patch, Post, Put, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/auth/decorators/current-user.decorator';
import { Roles } from '../../common/auth/decorators/roles.decorator';
import { ALL_WORKSPACE_ROLES, MEMBER_PLUS_ROLES } from '../../common/auth/workspace-roles';
import { AuthenticatedUser } from '../../common/auth/interfaces/authenticated-user.interface';
import { successResponse } from '../../common/interfaces/api-response.interface';
import { AuthRateLimitGuard } from '../../common/security/auth-rate-limit.guard';
import {
  CUSTOM_FIELD_MUTATE_RATE_LIMIT,
  RateLimit,
} from '../../common/security/rate-limit.decorator';
import { CreateCustomFieldDto } from './dto/create-custom-field.dto';
import { UpdateCustomFieldDto } from './dto/update-custom-field.dto';
import { SetCustomFieldValueDto } from './dto/set-custom-field-value.dto';
import { CustomFieldsService } from './custom-fields.service';

@Controller('workspaces/:workspaceId/custom-fields')
export class CustomFieldsController {
  constructor(private readonly customFieldsService: CustomFieldsService) {}

  @Get()
  @Roles(...ALL_WORKSPACE_ROLES)
  async list(@Param('workspaceId') workspaceId: string, @CurrentUser() user: AuthenticatedUser) {
    return successResponse(await this.customFieldsService.listDefinitions(workspaceId, user.id));
  }

  @Post()
  @UseGuards(AuthRateLimitGuard)
  @RateLimit(CUSTOM_FIELD_MUTATE_RATE_LIMIT)
  @Roles(...MEMBER_PLUS_ROLES)
  async create(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateCustomFieldDto,
  ) {
    return successResponse(
      await this.customFieldsService.createDefinition(workspaceId, user.id, dto),
    );
  }

  @Patch(':fieldId')
  @UseGuards(AuthRateLimitGuard)
  @RateLimit(CUSTOM_FIELD_MUTATE_RATE_LIMIT)
  @Roles(...MEMBER_PLUS_ROLES)
  async update(
    @Param('workspaceId') workspaceId: string,
    @Param('fieldId') fieldId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateCustomFieldDto,
  ) {
    return successResponse(
      await this.customFieldsService.updateDefinition(workspaceId, fieldId, user.id, dto),
    );
  }

  @Delete(':fieldId')
  @UseGuards(AuthRateLimitGuard)
  @RateLimit(CUSTOM_FIELD_MUTATE_RATE_LIMIT)
  @Roles(...MEMBER_PLUS_ROLES)
  async remove(
    @Param('workspaceId') workspaceId: string,
    @Param('fieldId') fieldId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return successResponse(
      await this.customFieldsService.removeDefinition(workspaceId, fieldId, user.id),
    );
  }
}

@Controller('workspaces/:workspaceId/tasks/:taskId/custom-fields')
export class TaskCustomFieldsController {
  constructor(private readonly customFieldsService: CustomFieldsService) {}

  @Put(':fieldId')
  @UseGuards(AuthRateLimitGuard)
  @RateLimit(CUSTOM_FIELD_MUTATE_RATE_LIMIT)
  @Roles(...MEMBER_PLUS_ROLES)
  async setValue(
    @Param('workspaceId') workspaceId: string,
    @Param('taskId') taskId: string,
    @Param('fieldId') fieldId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SetCustomFieldValueDto,
  ) {
    return successResponse(
      await this.customFieldsService.setValue(workspaceId, taskId, fieldId, user.id, dto),
    );
  }
}
