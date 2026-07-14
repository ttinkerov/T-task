import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { WorkspaceRole } from '@prisma/client';
import { CurrentUser } from '../../common/auth/decorators/current-user.decorator';
import { Roles } from '../../common/auth/decorators/roles.decorator';
import { AuthenticatedUser } from '../../common/auth/interfaces/authenticated-user.interface';
import { successResponse } from '../../common/interfaces/api-response.interface';
import { CreateFormFieldDto } from './dto/create-form-field.dto';
import { CreateFormDto } from './dto/create-form.dto';
import { UpdateFormDto } from './dto/update-form.dto';
import { UpdateFormFieldDto } from './dto/update-form-field.dto';
import { FormsService } from './forms.service';

@Controller('workspaces/:workspaceId/forms')
export class FormsController {
  constructor(private readonly formsService: FormsService) {}

  @Get()
  @Roles(WorkspaceRole.VIEWER, WorkspaceRole.MEMBER, WorkspaceRole.ADMIN, WorkspaceRole.OWNER)
  async list(@Param('workspaceId') workspaceId: string, @CurrentUser() user: AuthenticatedUser) {
    const forms = await this.formsService.list(workspaceId, user.id);
    return successResponse(forms);
  }

  @Post()
  @Roles(WorkspaceRole.MEMBER, WorkspaceRole.ADMIN, WorkspaceRole.OWNER)
  async create(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateFormDto,
  ) {
    const form = await this.formsService.create(workspaceId, user.id, dto);
    return successResponse(form);
  }

  @Get(':formId')
  @Roles(WorkspaceRole.VIEWER, WorkspaceRole.MEMBER, WorkspaceRole.ADMIN, WorkspaceRole.OWNER)
  async get(
    @Param('workspaceId') workspaceId: string,
    @Param('formId') formId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const form = await this.formsService.getForm(workspaceId, formId, user.id);
    return successResponse(form);
  }

  @Patch(':formId')
  @Roles(WorkspaceRole.MEMBER, WorkspaceRole.ADMIN, WorkspaceRole.OWNER)
  async update(
    @Param('workspaceId') workspaceId: string,
    @Param('formId') formId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateFormDto,
  ) {
    const form = await this.formsService.update(workspaceId, formId, user.id, dto);
    return successResponse(form);
  }

  @Delete(':formId')
  @Roles(WorkspaceRole.MEMBER, WorkspaceRole.ADMIN, WorkspaceRole.OWNER)
  async remove(
    @Param('workspaceId') workspaceId: string,
    @Param('formId') formId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const result = await this.formsService.remove(workspaceId, formId, user.id);
    return successResponse(result);
  }

  @Post(':formId/fields')
  @Roles(WorkspaceRole.MEMBER, WorkspaceRole.ADMIN, WorkspaceRole.OWNER)
  async addField(
    @Param('workspaceId') workspaceId: string,
    @Param('formId') formId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateFormFieldDto,
  ) {
    const form = await this.formsService.addField(workspaceId, formId, user.id, dto);
    return successResponse(form);
  }

  @Patch(':formId/fields/:fieldId')
  @Roles(WorkspaceRole.MEMBER, WorkspaceRole.ADMIN, WorkspaceRole.OWNER)
  async updateField(
    @Param('workspaceId') workspaceId: string,
    @Param('formId') formId: string,
    @Param('fieldId') fieldId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateFormFieldDto,
  ) {
    const form = await this.formsService.updateField(workspaceId, formId, fieldId, user.id, dto);
    return successResponse(form);
  }

  @Delete(':formId/fields/:fieldId')
  @Roles(WorkspaceRole.MEMBER, WorkspaceRole.ADMIN, WorkspaceRole.OWNER)
  async removeField(
    @Param('workspaceId') workspaceId: string,
    @Param('formId') formId: string,
    @Param('fieldId') fieldId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const form = await this.formsService.removeField(workspaceId, formId, fieldId, user.id);
    return successResponse(form);
  }

  @Get(':formId/responses')
  @Roles(WorkspaceRole.VIEWER, WorkspaceRole.MEMBER, WorkspaceRole.ADMIN, WorkspaceRole.OWNER)
  async responses(
    @Param('workspaceId') workspaceId: string,
    @Param('formId') formId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.formsService.getResponses(workspaceId, formId, user.id);
    return successResponse(data);
  }
}
