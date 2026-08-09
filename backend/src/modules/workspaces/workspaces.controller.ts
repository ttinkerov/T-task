import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { WorkspaceRole } from '@prisma/client';
import { CurrentUser } from '../../common/auth/decorators/current-user.decorator';
import { Public } from '../../common/auth/decorators/public.decorator';
import { Roles } from '../../common/auth/decorators/roles.decorator';
import { ALL_WORKSPACE_ROLES, ADMIN_PLUS_ROLES } from '../../common/auth/workspace-roles';
import { AuthRateLimitGuard } from '../../common/security/auth-rate-limit.guard';
import {
  INVITATION_ACCEPT_RATE_LIMIT,
  INVITATION_CREATE_RATE_LIMIT,
  RateLimit,
  WORKSPACE_MUTATE_RATE_LIMIT,
  WORKSPACE_READ_RATE_LIMIT,
} from '../../common/security/rate-limit.decorator';
import { AuthenticatedUser } from '../../common/auth/interfaces/authenticated-user.interface';
import { successResponse } from '../../common/interfaces/api-response.interface';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { UpdateMemberScopesDto } from './dto/update-member-scopes.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { WorkspacesService } from './workspaces.service';

@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Get()
  @UseGuards(AuthRateLimitGuard)
  @RateLimit(WORKSPACE_READ_RATE_LIMIT)
  async list(@CurrentUser() user: AuthenticatedUser) {
    const workspaces = await this.workspacesService.listForUser(user.id);
    return successResponse(workspaces);
  }

  @Post()
  @UseGuards(AuthRateLimitGuard)
  @RateLimit(WORKSPACE_MUTATE_RATE_LIMIT)
  async create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateWorkspaceDto) {
    const workspace = await this.workspacesService.create(user.id, dto);
    return successResponse(workspace);
  }

  @Get(':workspaceId')
  @UseGuards(AuthRateLimitGuard)
  @RateLimit(WORKSPACE_READ_RATE_LIMIT)
  @Roles(...ALL_WORKSPACE_ROLES)
  async getOne(@Param('workspaceId') workspaceId: string, @CurrentUser() user: AuthenticatedUser) {
    const workspace = await this.workspacesService.getWorkspaceForMember(workspaceId, user.id);
    return successResponse(workspace);
  }

  @Patch(':workspaceId')
  @UseGuards(AuthRateLimitGuard)
  @RateLimit(WORKSPACE_MUTATE_RATE_LIMIT)
  @Roles(...ADMIN_PLUS_ROLES)
  async update(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateWorkspaceDto,
  ) {
    const workspace = await this.workspacesService.update(workspaceId, user.id, dto);
    return successResponse(workspace);
  }

  @Post(':workspaceId/archive')
  @UseGuards(AuthRateLimitGuard)
  @RateLimit(WORKSPACE_MUTATE_RATE_LIMIT)
  @Roles(...ADMIN_PLUS_ROLES)
  async archive(@Param('workspaceId') workspaceId: string, @CurrentUser() user: AuthenticatedUser) {
    const result = await this.workspacesService.archive(workspaceId, user.id);
    return successResponse(result);
  }

  @Post(':workspaceId/unarchive')
  @UseGuards(AuthRateLimitGuard)
  @RateLimit(WORKSPACE_MUTATE_RATE_LIMIT)
  @Roles(...ADMIN_PLUS_ROLES)
  async unarchive(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const result = await this.workspacesService.unarchive(workspaceId, user.id);
    return successResponse(result);
  }

  @Delete(':workspaceId')
  @UseGuards(AuthRateLimitGuard)
  @RateLimit(WORKSPACE_MUTATE_RATE_LIMIT)
  @Roles(WorkspaceRole.OWNER)
  async remove(@Param('workspaceId') workspaceId: string, @CurrentUser() user: AuthenticatedUser) {
    const result = await this.workspacesService.remove(workspaceId, user.id);
    return successResponse(result);
  }

  @Get(':workspaceId/members')
  @UseGuards(AuthRateLimitGuard)
  @RateLimit(WORKSPACE_READ_RATE_LIMIT)
  @Roles(...ALL_WORKSPACE_ROLES)
  async listMembers(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const members = await this.workspacesService.listMembers(workspaceId, user.id);
    return successResponse(members);
  }

  @Patch(':workspaceId/members/:memberId')
  @UseGuards(AuthRateLimitGuard)
  @RateLimit(WORKSPACE_MUTATE_RATE_LIMIT)
  @Roles(...ADMIN_PLUS_ROLES)
  async updateMemberRole(
    @Param('workspaceId') workspaceId: string,
    @Param('memberId') memberId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateMemberRoleDto,
  ) {
    const member = await this.workspacesService.updateMemberRole(
      workspaceId,
      user.id,
      memberId,
      dto,
    );
    return successResponse(member);
  }

  @Patch(':workspaceId/members/:memberId/scopes')
  @UseGuards(AuthRateLimitGuard)
  @RateLimit(WORKSPACE_MUTATE_RATE_LIMIT)
  @Roles(...ADMIN_PLUS_ROLES)
  async updateMemberScopes(
    @Param('workspaceId') workspaceId: string,
    @Param('memberId') memberId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateMemberScopesDto,
  ) {
    const member = await this.workspacesService.updateMemberScopes(
      workspaceId,
      user.id,
      memberId,
      dto.scopes,
    );
    return successResponse(member);
  }

  @Delete(':workspaceId/members/:memberId')
  @UseGuards(AuthRateLimitGuard)
  @RateLimit(WORKSPACE_MUTATE_RATE_LIMIT)
  @Roles(...ADMIN_PLUS_ROLES)
  async removeMember(
    @Param('workspaceId') workspaceId: string,
    @Param('memberId') memberId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const result = await this.workspacesService.removeMember(workspaceId, user.id, memberId);
    return successResponse(result);
  }

  @Get(':workspaceId/invitations')
  @UseGuards(AuthRateLimitGuard)
  @RateLimit(WORKSPACE_READ_RATE_LIMIT)
  @Roles(...ADMIN_PLUS_ROLES)
  async listInvitations(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const invitations = await this.workspacesService.listInvitations(workspaceId, user.id);
    return successResponse(invitations);
  }

  @Post(':workspaceId/invitations')
  @UseGuards(AuthRateLimitGuard)
  @RateLimit(INVITATION_CREATE_RATE_LIMIT)
  @Roles(...ADMIN_PLUS_ROLES)
  async createInvitation(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: InviteMemberDto,
  ) {
    const invitation = await this.workspacesService.createInvitation(workspaceId, user.id, dto);
    return successResponse(invitation);
  }

  @Delete(':workspaceId/invitations/:invitationId')
  @UseGuards(AuthRateLimitGuard)
  @RateLimit(INVITATION_CREATE_RATE_LIMIT)
  @Roles(...ADMIN_PLUS_ROLES)
  async revokeInvitation(
    @Param('workspaceId') workspaceId: string,
    @Param('invitationId') invitationId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const result = await this.workspacesService.revokeInvitation(
      workspaceId,
      user.id,
      invitationId,
    );
    return successResponse(result);
  }
}

@Controller('invitations')
export class InvitationsController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Public()
  @UseGuards(AuthRateLimitGuard)
  @Get(':token')
  async preview(@Param('token') token: string) {
    const invitation = await this.workspacesService.getInvitationPreview(token);
    return successResponse(invitation);
  }

  @UseGuards(AuthRateLimitGuard)
  @RateLimit(INVITATION_ACCEPT_RATE_LIMIT)
  @Post(':token/accept')
  async accept(@Param('token') token: string, @CurrentUser() user: AuthenticatedUser) {
    const result = await this.workspacesService.acceptInvitation(token, user.id);
    return successResponse(result);
  }
}
