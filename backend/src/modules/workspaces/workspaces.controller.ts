import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { WorkspaceRole } from '@prisma/client';
import { CurrentUser } from '../../common/auth/decorators/current-user.decorator';
import { Public } from '../../common/auth/decorators/public.decorator';
import { Roles } from '../../common/auth/decorators/roles.decorator';
import { AuthenticatedUser } from '../../common/auth/interfaces/authenticated-user.interface';
import { successResponse } from '../../common/interfaces/api-response.interface';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { WorkspacesService } from './workspaces.service';

@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Get()
  async list(@CurrentUser() user: AuthenticatedUser) {
    const workspaces = await this.workspacesService.listForUser(user.id);
    return successResponse(workspaces);
  }

  @Post()
  async create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateWorkspaceDto) {
    const workspace = await this.workspacesService.create(user.id, dto);
    return successResponse(workspace);
  }

  @Get(':workspaceId')
  @Roles(WorkspaceRole.VIEWER, WorkspaceRole.MEMBER, WorkspaceRole.ADMIN, WorkspaceRole.OWNER)
  async getOne(@Param('workspaceId') workspaceId: string, @CurrentUser() user: AuthenticatedUser) {
    const workspace = await this.workspacesService.getWorkspaceForMember(workspaceId, user.id);
    return successResponse(workspace);
  }

  @Patch(':workspaceId')
  @Roles(WorkspaceRole.ADMIN, WorkspaceRole.OWNER)
  async update(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateWorkspaceDto,
  ) {
    const workspace = await this.workspacesService.update(workspaceId, user.id, dto);
    return successResponse(workspace);
  }

  @Post(':workspaceId/archive')
  @Roles(WorkspaceRole.ADMIN, WorkspaceRole.OWNER)
  async archive(@Param('workspaceId') workspaceId: string, @CurrentUser() user: AuthenticatedUser) {
    const result = await this.workspacesService.archive(workspaceId, user.id);
    return successResponse(result);
  }

  @Delete(':workspaceId')
  @Roles(WorkspaceRole.OWNER)
  async remove(@Param('workspaceId') workspaceId: string, @CurrentUser() user: AuthenticatedUser) {
    const result = await this.workspacesService.remove(workspaceId, user.id);
    return successResponse(result);
  }

  @Get(':workspaceId/members')
  @Roles(WorkspaceRole.MEMBER, WorkspaceRole.ADMIN, WorkspaceRole.OWNER, WorkspaceRole.VIEWER)
  async listMembers(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const members = await this.workspacesService.listMembers(workspaceId, user.id);
    return successResponse(members);
  }

  @Patch(':workspaceId/members/:memberId')
  @Roles(WorkspaceRole.ADMIN, WorkspaceRole.OWNER)
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

  @Delete(':workspaceId/members/:memberId')
  @Roles(WorkspaceRole.ADMIN, WorkspaceRole.OWNER)
  async removeMember(
    @Param('workspaceId') workspaceId: string,
    @Param('memberId') memberId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const result = await this.workspacesService.removeMember(workspaceId, user.id, memberId);
    return successResponse(result);
  }

  @Get(':workspaceId/invitations')
  @Roles(WorkspaceRole.ADMIN, WorkspaceRole.OWNER)
  async listInvitations(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const invitations = await this.workspacesService.listInvitations(workspaceId, user.id);
    return successResponse(invitations);
  }

  @Post(':workspaceId/invitations')
  @Roles(WorkspaceRole.ADMIN, WorkspaceRole.OWNER)
  async createInvitation(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: InviteMemberDto,
  ) {
    const invitation = await this.workspacesService.createInvitation(workspaceId, user.id, dto);
    return successResponse(invitation);
  }

  @Delete(':workspaceId/invitations/:invitationId')
  @Roles(WorkspaceRole.ADMIN, WorkspaceRole.OWNER)
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
  @Get(':token')
  async preview(@Param('token') token: string) {
    const invitation = await this.workspacesService.getInvitationPreview(token);
    return successResponse(invitation);
  }

  @Post(':token/accept')
  async accept(@Param('token') token: string, @CurrentUser() user: AuthenticatedUser) {
    const result = await this.workspacesService.acceptInvitation(token, user.id);
    return successResponse(result);
  }
}
