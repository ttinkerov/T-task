import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { WorkspaceRole, Prisma, TeamSize, WorkspaceUseCase } from '@prisma/client';
import { generateRefreshToken, hashToken } from '../../common/auth/utils/token.util';
import { DomainEvents } from '../../common/events/domain-events';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { RedisService } from '../../infrastructure/redis/redis.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { assertCanAssignRole, createUniqueWorkspaceSlug } from './utils/workspace.util';
import { createDefaultBoard } from '../boards/utils/create-default-board.util';
import { createDefaultFunnel } from '../funnels/utils/create-default-funnel.util';
import { ActivityService } from '../activity/activity.service';
import { ActivityAction, ActivityEntityType } from '../activity/activity.types';

const INVITATION_TTL_DAYS = 7;
const MEMBERSHIP_CACHE_TTL_SECONDS = 45;

@Injectable()
export class WorkspacesService {
  private readonly logger = new Logger(WorkspacesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly activityService: ActivityService,
    private readonly eventEmitter: EventEmitter2,
    private readonly redis: RedisService,
  ) {}

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

  async resolveGuardMembership(
    workspaceId: string,
    userId: string,
  ): Promise<{
    workspaceId: string;
    role: WorkspaceRole;
    scopes: string[];
  } | null> {
    try {
      const membership = await this.getMembership(workspaceId, userId);
      return {
        workspaceId,
        role: membership.role,
        scopes: membership.scopes ?? [],
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        return null;
      }
      throw error;
    }
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

    await this.activityService.record({
      workspaceId: workspace.id,
      actorId: userId,
      action: ActivityAction.WORKSPACE_CREATED,
      entityType: ActivityEntityType.WORKSPACE,
      entityId: workspace.id,
      entityName: workspace.name,
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

    const workspace = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.workspace.update({
        where: { id: workspaceId },
        data: {
          ...(dto.name ? { name: dto.name.trim() } : {}),
          ...(dto.autoRollOverdue !== undefined ? { autoRollOverdue: dto.autoRollOverdue } : {}),
        },
      });
      await this.activityService.record({
        workspaceId,
        actorId: userId,
        action: ActivityAction.WORKSPACE_UPDATED,
        entityType: ActivityEntityType.WORKSPACE,
        entityId: workspaceId,
        entityName: updated.name,
        metadata: {
          nameChanged: dto.name !== undefined,
          overdueSettingChanged: dto.autoRollOverdue !== undefined,
        },
      });
      return updated;
    });

    await this.invalidateMembershipCache(workspaceId, userId);
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

    await this.prisma.$transaction(async (tx) => {
      const workspace = await tx.workspace.update({
        where: { id: workspaceId },
        data: { archivedAt: new Date() },
      });

      await tx.form.updateMany({
        where: { workspaceId, isPublic: true },
        data: { isPublic: false },
      });
      await tx.invitation.updateMany({
        where: { workspaceId, acceptedAt: null, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      await this.activityService.record({
        workspaceId,
        actorId: userId,
        action: ActivityAction.WORKSPACE_ARCHIVED,
        entityType: ActivityEntityType.WORKSPACE,
        entityId: workspaceId,
        entityName: workspace.name,
      });
    });

    return { success: true };
  }

  async unarchive(workspaceId: string, userId: string) {
    await this.getMembership(workspaceId, userId);

    await this.prisma.$transaction(async (tx) => {
      const workspace = await tx.workspace.update({
        where: { id: workspaceId },
        data: { archivedAt: null },
      });
      await this.activityService.record({
        workspaceId,
        actorId: userId,
        action: ActivityAction.WORKSPACE_UNARCHIVED,
        entityType: ActivityEntityType.WORKSPACE,
        entityId: workspaceId,
        entityName: workspace.name,
      });
    });

    return { success: true };
  }

  async remove(workspaceId: string, userId: string) {
    const membership = await this.getMembership(workspaceId, userId);

    if (membership.role !== WorkspaceRole.OWNER) {
      throw new ForbiddenException('Только владелец может удалить рабочее пространство');
    }

    await this.prisma.$transaction(async (tx) => {
      const workspace = await tx.workspace.update({
        where: { id: workspaceId },
        data: { deletedAt: new Date() },
      });
      await tx.form.updateMany({
        where: { workspaceId, isPublic: true },
        data: { isPublic: false },
      });
      await tx.invitation.updateMany({
        where: { workspaceId, acceptedAt: null, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      await this.activityService.record({
        workspaceId,
        actorId: userId,
        action: ActivityAction.WORKSPACE_DELETED,
        entityType: ActivityEntityType.WORKSPACE,
        entityId: workspaceId,
        entityName: workspace.name,
      });
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
      scopes: member.scopes ?? [],
      joinedAt: member.joinedAt,
      user: member.user,
    }));
  }

  async updateMemberScopes(
    workspaceId: string,
    actorUserId: string,
    memberId: string,
    scopes: string[],
  ) {
    const actorMembership = await this.getMembership(workspaceId, actorUserId);
    if (
      actorMembership.role !== WorkspaceRole.OWNER &&
      actorMembership.role !== WorkspaceRole.ADMIN
    ) {
      throw new ForbiddenException('Недостаточно прав для изменения дополнительных прав');
    }

    const targetMember = await this.prisma.workspaceMember.findFirst({
      where: { id: memberId, workspaceId },
    });
    if (!targetMember) {
      throw new NotFoundException('Участник не найден');
    }

    const allowed = new Set(['CRM_WRITE', 'FORMS_WRITE', 'TASK_DELETE', 'DEAL_DELETE']);
    const nextScopes = [...new Set(scopes.filter((scope) => allowed.has(scope)))];

    const updated = await this.prisma.workspaceMember.update({
      where: { id: memberId },
      data: { scopes: nextScopes },
      include: {
        user: { select: { id: true, email: true, name: true, avatarUrl: true } },
      },
    });

    return {
      id: updated.id,
      userId: updated.userId,
      role: updated.role,
      scopes: updated.scopes,
      joinedAt: updated.joinedAt,
      user: updated.user,
    };
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
      throw new ForbiddenException('Недостаточно прав для изменения ролей');
    }

    const targetMember = await this.prisma.workspaceMember.findFirst({
      where: { id: memberId, workspaceId },
    });

    if (!targetMember) {
      throw new NotFoundException('Участник не найден');
    }

    if (targetMember.role === WorkspaceRole.OWNER && actorMembership.role !== WorkspaceRole.OWNER) {
      throw new ForbiddenException('Только владелец может менять роль другого владельца');
    }

    if (targetMember.role === WorkspaceRole.ADMIN && actorMembership.role !== WorkspaceRole.OWNER) {
      throw new ForbiddenException('Только владелец может менять роль администратора');
    }

    try {
      assertCanAssignRole(actorMembership.role, dto.role);
    } catch {
      throw new ForbiddenException('Вы не можете назначить эту роль');
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

    await this.invalidateMembershipCache(workspaceId, updated.userId);
    if (dto.role === WorkspaceRole.OWNER && actorUserId !== updated.userId) {
      await this.invalidateMembershipCache(workspaceId, actorUserId);
    }

    await this.activityService.record({
      workspaceId,
      actorId: actorUserId,
      action: ActivityAction.MEMBER_ROLE_UPDATED,
      entityType: ActivityEntityType.MEMBER,
      entityId: updated.userId,
      entityName: updated.user.name,
      metadata: {
        previousRole: targetMember.role,
        nextRole: updated.role,
      },
    });

    if (dto.role === WorkspaceRole.OWNER && actorUserId !== updated.userId) {
      const actorUser = await this.prisma.user.findUnique({
        where: { id: actorUserId },
        select: { name: true },
      });

      await this.activityService.record({
        workspaceId,
        actorId: actorUserId,
        actorName: actorUser?.name,
        action: ActivityAction.MEMBER_ROLE_UPDATED,
        entityType: ActivityEntityType.MEMBER,
        entityId: actorUserId,
        entityName: actorUser?.name ?? 'Удалённый пользователь',
        metadata: {
          previousRole: actorMembership.role,
          nextRole: WorkspaceRole.ADMIN,
          reason: 'automatic_owner_transfer',
        },
      });
    }

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
      throw new ForbiddenException('Недостаточно прав для удаления участников');
    }

    const targetMember = await this.prisma.workspaceMember.findFirst({
      where: { id: memberId, workspaceId },
      include: {
        user: {
          select: { name: true },
        },
      },
    });

    if (!targetMember) {
      throw new NotFoundException('Участник не найден');
    }

    if (targetMember.role === WorkspaceRole.OWNER && actorMembership.role !== WorkspaceRole.OWNER) {
      throw new ForbiddenException('Только владелец может удалить другого владельца');
    }

    if (targetMember.role === WorkspaceRole.OWNER) {
      await this.assertNotLastOwner(workspaceId);
    }

    await this.prisma.$transaction(async (tx) => {
      const removedUserId = targetMember.userId;

      await tx.task.updateMany({
        where: {
          assigneeId: removedUserId,
          column: { board: { workspaceId } },
        },
        data: { assigneeId: null },
      });
      await tx.deal.updateMany({
        where: {
          assigneeId: removedUserId,
          stage: { funnel: { workspaceId } },
        },
        data: { assigneeId: null },
      });
      await tx.columnAutomation.updateMany({
        where: {
          assigneeId: removedUserId,
          column: { board: { workspaceId } },
        },
        data: { assigneeId: null },
      });
      await tx.taskWatcher.deleteMany({
        where: {
          userId: removedUserId,
          task: { column: { board: { workspaceId } } },
        },
      });

      await tx.workspaceMember.delete({ where: { id: memberId } });
      await this.activityService.record({
        workspaceId,
        actorId: actorUserId,
        action: ActivityAction.MEMBER_REMOVED,
        entityType: ActivityEntityType.MEMBER,
        entityId: targetMember.userId,
        entityName: targetMember.user.name,
        metadata: { previousRole: targetMember.role },
      });
    });

    await this.invalidateMembershipCache(workspaceId, targetMember.userId);

    await this.prisma.calendarFeed.updateMany({
      where: { workspaceId, userId: targetMember.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    this.eventEmitter.emit(DomainEvents.WORKSPACE_MEMBER_REMOVED, {
      userId: targetMember.userId,
      workspaceId,
    });

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
    const actorMembership = await this.assertCanManageInvitations(workspaceId, userId);

    const email = dto.email.toLowerCase();
    const role = dto.role ?? WorkspaceRole.MEMBER;

    if (role === WorkspaceRole.OWNER) {
      throw new BadRequestException('Нельзя пригласить с ролью владельца');
    }

    try {
      assertCanAssignRole(actorMembership.role, role);
    } catch {
      throw new ForbiddenException('Вы не можете пригласить с этой ролью');
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
      throw new ConflictException('Пользователь уже участник пространства');
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
      throw new ConflictException('Активное приглашение для этого email уже есть');
    }

    const rawToken = generateRefreshToken();
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + INVITATION_TTL_DAYS * 24 * 60 * 60 * 1000);

    const invitation = await this.prisma.$transaction(async (tx) => {
      const created = await tx.invitation.create({
        data: {
          workspaceId,
          invitedById: userId,
          email,
          role,
          tokenHash,
          expiresAt,
        },
      });
      await this.activityService.record({
        workspaceId,
        actorId: userId,
        action: ActivityAction.INVITATION_CREATED,
        entityType: ActivityEntityType.INVITATION,
        entityId: created.id,
        entityName: email,
        metadata: { role },
      });
      return created;
    });

    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { name: true },
    });
    const inviter = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });

    this.eventEmitter.emit(DomainEvents.INVITATION_CREATED, {
      workspaceId,
      workspaceName: workspace?.name ?? 'Workspace',
      invitationId: invitation.id,
      email: invitation.email,
      role: invitation.role,
      token: rawToken,
      inviterName: inviter?.name ?? 'Коллега',
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
      throw new NotFoundException('Приглашение не найдено');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.invitation.update({
        where: { id: invitationId },
        data: { revokedAt: new Date() },
      });
      await this.activityService.record({
        workspaceId,
        actorId: userId,
        action: ActivityAction.INVITATION_REVOKED,
        entityType: ActivityEntityType.INVITATION,
        entityId: invitation.id,
        entityName: invitation.email,
        metadata: { role: invitation.role },
      });
    });

    return { success: true };
  }

  async getInvitationPreview(token: string) {
    const invitation = await this.findValidInvitation(token);
    const workspace = invitation.workspace;

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
      throw new NotFoundException('Пользователь не найден');
    }

    if (user.email.toLowerCase() !== invitation.email.toLowerCase()) {
      throw new ForbiddenException('Email приглашения не совпадает с вашим аккаунтом');
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
      throw new ConflictException('Вы уже участник этого пространства');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const claimed = await tx.invitation.updateMany({
        where: {
          id: invitation.id,
          acceptedAt: null,
          revokedAt: null,
          expiresAt: { gt: new Date() },
        },
        data: { acceptedAt: new Date() },
      });

      if (claimed.count !== 1) {
        throw new NotFoundException('Приглашение не найдено или истекло');
      }

      const workspace = await tx.workspace.findFirst({
        where: {
          id: invitation.workspaceId,
          deletedAt: null,
          archivedAt: null,
        },
      });

      if (!workspace) {
        throw new NotFoundException('Приглашение не найдено или истекло');
      }

      const membership = await tx.workspaceMember.create({
        data: {
          workspaceId: invitation.workspaceId,
          userId,
          role: invitation.role,
        },
      });

      await this.activityService.record({
        workspaceId: invitation.workspaceId,
        actorId: userId,
        action: ActivityAction.MEMBER_JOINED,
        entityType: ActivityEntityType.MEMBER,
        entityId: userId,
        entityName: user.name,
        metadata: { role: invitation.role },
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
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
            slug: true,
            deletedAt: true,
            archivedAt: true,
          },
        },
      },
    });

    if (
      !invitation ||
      invitation.revokedAt ||
      invitation.acceptedAt ||
      invitation.expiresAt < new Date() ||
      invitation.workspace.deletedAt ||
      invitation.workspace.archivedAt
    ) {
      throw new NotFoundException('Приглашение не найдено или истекло');
    }

    return invitation;
  }

  private async assertCanManageInvitations(workspaceId: string, userId: string) {
    const membership = await this.getMembership(workspaceId, userId);

    if (membership.role !== WorkspaceRole.OWNER && membership.role !== WorkspaceRole.ADMIN) {
      throw new ForbiddenException('Недостаточно прав для управления приглашениями');
    }

    return membership;
  }

  private membershipCacheKey(workspaceId: string, userId: string) {
    return `ws:membership:${workspaceId}:${userId}`;
  }

  private async invalidateMembershipCache(workspaceId: string, userId: string) {
    try {
      await this.redis.getClient().del(this.membershipCacheKey(workspaceId, userId));
    } catch (error) {
      this.logger.warn(
        `Membership cache invalidate failed: ${error instanceof Error ? error.message : 'unknown'}`,
      );
    }
  }

  private async getMembership(workspaceId: string, userId: string) {
    const cacheKey = this.membershipCacheKey(workspaceId, userId);

    try {
      const cached = await this.redis.getClient().get(cacheKey);
      if (cached) {
        const membership = JSON.parse(cached) as {
          role: WorkspaceRole;
          userId: string;
          workspace: {
            deletedAt: string | Date | null;
            archivedAt?: string | Date | null;
          };
        };
        this.assertMembershipUsable(membership);
        return membership as Awaited<ReturnType<WorkspacesService['loadMembership']>>;
      }
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      this.logger.warn(
        `Membership cache read failed: ${error instanceof Error ? error.message : 'unknown'}`,
      );
    }

    const membership = await this.loadMembership(workspaceId, userId);

    try {
      await this.redis
        .getClient()
        .setex(cacheKey, MEMBERSHIP_CACHE_TTL_SECONDS, JSON.stringify(membership));
    } catch (error) {
      this.logger.warn(
        `Membership cache write failed: ${error instanceof Error ? error.message : 'unknown'}`,
      );
    }

    return membership;
  }

  private async loadMembership(workspaceId: string, userId: string) {
    const membership = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId, userId },
      },
      include: { workspace: true },
    });

    if (!membership || membership.workspace.deletedAt) {
      throw new NotFoundException('Рабочее пространство не найдено');
    }

    this.assertMembershipUsable(membership);
    return membership;
  }

  private assertMembershipUsable(membership: {
    role: WorkspaceRole;
    workspace: {
      deletedAt: string | Date | null;
      archivedAt?: string | Date | null;
    };
  }) {
    if (membership.workspace.deletedAt) {
      throw new NotFoundException('Рабочее пространство не найдено');
    }
    if (membership.workspace.archivedAt) {
      if (membership.role !== WorkspaceRole.OWNER && membership.role !== WorkspaceRole.ADMIN) {
        throw new ForbiddenException('Рабочее пространство в архиве');
      }
    }
  }

  private async assertNotLastOwner(workspaceId: string) {
    const ownerCount = await this.prisma.workspaceMember.count({
      where: { workspaceId, role: WorkspaceRole.OWNER },
    });

    if (ownerCount <= 1) {
      throw new BadRequestException('В рабочем пространстве должен остаться хотя бы один владелец');
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
