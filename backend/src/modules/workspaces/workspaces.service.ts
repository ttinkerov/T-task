import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { WorkspaceRole, Prisma, TeamSize, WorkspaceUseCase } from '@prisma/client';
import { generateRefreshToken, hashToken } from '../../common/auth/utils/token.util';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { assertCanAssignRole, createUniqueWorkspaceSlug } from './utils/workspace.util';
import { createDefaultBoard } from '../boards/utils/create-default-board.util';
import { createDefaultFunnel } from '../funnels/utils/create-default-funnel.util';

const INVITATION_TTL_DAYS = 7;

@Injectable()
export class WorkspacesService {
  constructor(private readonly prisma: PrismaService) {}

  async listForUser(userId: string) {
    const memberships = await this.prisma.workspaceMember.findMany({
      where: { userId },
      include: { workspace: true },
      orderBy: { joinedAt: 'asc' },
    });

    return memberships
      .filter((membership) => !membership.workspace.deletedAt && !membership.workspace.archivedAt)
      .map((membership) => this.toWorkspaceSummary(membership));
  }

  async getWorkspaceForMember(workspaceId: string, userId: string) {
    const membership = await this.getMembership(workspaceId, userId);
    return this.toWorkspaceSummary(membership);
  }

  async create(userId: string, dto: CreateWorkspaceDto) {
    const slug = await createUniqueWorkspaceSlug(this.prisma, dto.name);

    const workspace = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const created = await tx.workspace.create({
        data: {
          name: dto.name.trim(),
          slug,
          ownerId: userId,
          ...(dto.teamSize ? { teamSize: dto.teamSize } : {}),
          ...(dto.useCases ? { useCases: dto.useCases } : {}),
        },
      });

      await tx.workspaceMember.create({
        data: {
          workspaceId: created.id,
          userId,
          role: WorkspaceRole.OWNER,
        },
      });

      await createDefaultBoard(tx, created.id);
      await createDefaultFunnel(tx, created.id);

      return created;
    });

    return {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      role: WorkspaceRole.OWNER,
      teamSize: workspace.teamSize,
      useCases: workspace.useCases,
    };
  }

  async update(workspaceId: string, userId: string, dto: UpdateWorkspaceDto) {
    await this.getMembership(workspaceId, userId);

    const workspace = await this.prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        ...(dto.name ? { name: dto.name.trim() } : {}),
        ...(dto.autoRollOverdue !== undefined ? { autoRollOverdue: dto.autoRollOverdue } : {}),
      },
    });

    const membership = await this.getMembership(workspaceId, userId);

    return {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      role: membership.role,
      autoRollOverdue: workspace.autoRollOverdue,
    };
  }

  async archive(workspaceId: string, userId: string) {
    await this.getMembership(workspaceId, userId);

    await this.prisma.workspace.update({
      where: { id: workspaceId },
      data: { archivedAt: new Date() },
    });

    return { success: true };
  }

  async remove(workspaceId: string, userId: string) {
    const membership = await this.getMembership(workspaceId, userId);

    if (membership.role !== WorkspaceRole.OWNER) {
      throw new ForbiddenException('Only workspace owner can delete workspace');
    }

    await this.prisma.workspace.update({
      where: { id: workspaceId },
      data: { deletedAt: new Date() },
    });

    return { success: true };
  }

  async listMembers(workspaceId: string, userId: string) {
    await this.getMembership(workspaceId, userId);

    const members = await this.prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });

    return members.map((member) => ({
      id: member.id,
      userId: member.userId,
      role: member.role,
      joinedAt: member.joinedAt,
      user: member.user,
    }));
  }

  async updateMemberRole(
    workspaceId: string,
    actorUserId: string,
    memberId: string,
    dto: UpdateMemberRoleDto,
  ) {
    const actorMembership = await this.getMembership(workspaceId, actorUserId);

    if (
      actorMembership.role !== WorkspaceRole.OWNER &&
      actorMembership.role !== WorkspaceRole.ADMIN
    ) {
      throw new ForbiddenException('Insufficient permissions to change roles');
    }

    const targetMember = await this.prisma.workspaceMember.findFirst({
      where: { id: memberId, workspaceId },
    });

    if (!targetMember) {
      throw new NotFoundException('Member not found');
    }

    try {
      assertCanAssignRole(actorMembership.role, dto.role);
    } catch {
      throw new ForbiddenException('You cannot assign this role');
    }

    if (targetMember.role === WorkspaceRole.OWNER && dto.role !== WorkspaceRole.OWNER) {
      await this.assertNotLastOwner(workspaceId);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const member = await tx.workspaceMember.update({
        where: { id: memberId },
        data: { role: dto.role },
        include: {
          user: {
            select: { id: true, email: true, name: true, avatarUrl: true },
          },
        },
      });

      if (dto.role === WorkspaceRole.OWNER) {
        await tx.workspace.update({
          where: { id: workspaceId },
          data: { ownerId: member.userId },
        });

        if (actorUserId !== member.userId) {
          await tx.workspaceMember.update({
            where: {
              workspaceId_userId: { workspaceId, userId: actorUserId },
            },
            data: { role: WorkspaceRole.ADMIN },
          });
        }
      }

      return member;
    });

    return {
      id: updated.id,
      userId: updated.userId,
      role: updated.role,
      joinedAt: updated.joinedAt,
      user: updated.user,
    };
  }

  async removeMember(workspaceId: string, actorUserId: string, memberId: string) {
    const actorMembership = await this.getMembership(workspaceId, actorUserId);

    if (
      actorMembership.role !== WorkspaceRole.OWNER &&
      actorMembership.role !== WorkspaceRole.ADMIN
    ) {
      throw new ForbiddenException('Insufficient permissions to remove members');
    }

    const targetMember = await this.prisma.workspaceMember.findFirst({
      where: { id: memberId, workspaceId },
    });

    if (!targetMember) {
      throw new NotFoundException('Member not found');
    }

    if (targetMember.role === WorkspaceRole.OWNER && actorMembership.role !== WorkspaceRole.OWNER) {
      throw new ForbiddenException('Only owner can remove another owner');
    }

    if (targetMember.role === WorkspaceRole.OWNER) {
      await this.assertNotLastOwner(workspaceId);
    }

    await this.prisma.workspaceMember.delete({ where: { id: memberId } });

    return { success: true };
  }

  async listInvitations(workspaceId: string, userId: string) {
    await this.assertCanManageInvitations(workspaceId, userId);

    const invitations = await this.prisma.invitation.findMany({
      where: {
        workspaceId,
        acceptedAt: null,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    return invitations.map((invitation) => ({
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      expiresAt: invitation.expiresAt,
      createdAt: invitation.createdAt,
    }));
  }

  async createInvitation(workspaceId: string, userId: string, dto: InviteMemberDto) {
    await this.assertCanManageInvitations(workspaceId, userId);

    const email = dto.email.toLowerCase();
    const role = dto.role ?? WorkspaceRole.MEMBER;

    if (role === WorkspaceRole.OWNER) {
      throw new BadRequestException('Cannot invite with owner role');
    }

    const existingMember = await this.prisma.user.findUnique({
      where: { email },
      include: {
        memberships: {
          where: { workspaceId },
        },
      },
    });

    if (existingMember?.memberships.length) {
      throw new ConflictException('User is already a workspace member');
    }

    const activeInvite = await this.prisma.invitation.findFirst({
      where: {
        workspaceId,
        email,
        acceptedAt: null,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (activeInvite) {
      throw new ConflictException('Active invitation already exists for this email');
    }

    const rawToken = generateRefreshToken();
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + INVITATION_TTL_DAYS * 24 * 60 * 60 * 1000);

    const invitation = await this.prisma.invitation.create({
      data: {
        workspaceId,
        invitedById: userId,
        email,
        role,
        tokenHash,
        expiresAt,
      },
    });

    return {
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      expiresAt: invitation.expiresAt,
      token: rawToken,
    };
  }

  async revokeInvitation(workspaceId: string, userId: string, invitationId: string) {
    await this.assertCanManageInvitations(workspaceId, userId);

    const invitation = await this.prisma.invitation.findFirst({
      where: { id: invitationId, workspaceId, acceptedAt: null, revokedAt: null },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    await this.prisma.invitation.update({
      where: { id: invitationId },
      data: { revokedAt: new Date() },
    });

    return { success: true };
  }

  async getInvitationPreview(token: string) {
    const invitation = await this.findValidInvitation(token);

    const workspace = await this.prisma.workspace.findUnique({
      where: { id: invitation.workspaceId },
    });

    if (!workspace || workspace.deletedAt) {
      throw new NotFoundException('Invitation not found');
    }

    return {
      email: invitation.email,
      role: invitation.role,
      expiresAt: invitation.expiresAt,
      workspace: {
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
      },
    };
  }

  async acceptInvitation(token: string, userId: string) {
    const invitation = await this.findValidInvitation(token);

    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user || user.deletedAt) {
      throw new NotFoundException('User not found');
    }

    if (user.email.toLowerCase() !== invitation.email.toLowerCase()) {
      throw new ForbiddenException('Invitation email does not match your account');
    }

    const existingMembership = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: invitation.workspaceId,
          userId,
        },
      },
    });

    if (existingMembership) {
      throw new ConflictException('You are already a member of this workspace');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.invitation.update({
        where: { id: invitation.id },
        data: { acceptedAt: new Date() },
      });

      const membership = await tx.workspaceMember.create({
        data: {
          workspaceId: invitation.workspaceId,
          userId,
          role: invitation.role,
        },
      });

      const workspace = await tx.workspace.findUniqueOrThrow({
        where: { id: invitation.workspaceId },
      });

      return { membership, workspace };
    });

    return {
      workspace: {
        id: result.workspace.id,
        name: result.workspace.name,
        slug: result.workspace.slug,
        role: result.membership.role,
      },
    };
  }

  private async findValidInvitation(token: string) {
    const tokenHash = hashToken(token);
    const invitation = await this.prisma.invitation.findUnique({
      where: { tokenHash },
    });

    if (
      !invitation ||
      invitation.revokedAt ||
      invitation.acceptedAt ||
      invitation.expiresAt < new Date()
    ) {
      throw new NotFoundException('Invitation not found or expired');
    }

    return invitation;
  }

  private async assertCanManageInvitations(workspaceId: string, userId: string) {
    const membership = await this.getMembership(workspaceId, userId);

    if (membership.role !== WorkspaceRole.OWNER && membership.role !== WorkspaceRole.ADMIN) {
      throw new ForbiddenException('Insufficient permissions to manage invitations');
    }
  }

  private async getMembership(workspaceId: string, userId: string) {
    const membership = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId, userId },
      },
      include: { workspace: true },
    });

    if (!membership || membership.workspace.deletedAt) {
      throw new NotFoundException('Workspace not found');
    }

    return membership;
  }

  private async assertNotLastOwner(workspaceId: string) {
    const ownerCount = await this.prisma.workspaceMember.count({
      where: { workspaceId, role: WorkspaceRole.OWNER },
    });

    if (ownerCount <= 1) {
      throw new BadRequestException('Workspace must have at least one owner');
    }
  }

  private toWorkspaceSummary(membership: {
    role: WorkspaceRole;
    workspace: {
      id: string;
      name: string;
      slug: string;
      teamSize: TeamSize | null;
      useCases: WorkspaceUseCase[];
      autoRollOverdue: boolean;
    };
  }) {
    return {
      id: membership.workspace.id,
      name: membership.workspace.name,
      slug: membership.workspace.slug,
      role: membership.role,
      teamSize: membership.workspace.teamSize,
      useCases: membership.workspace.useCases,
      autoRollOverdue: membership.workspace.autoRollOverdue,
    };
  }
}
