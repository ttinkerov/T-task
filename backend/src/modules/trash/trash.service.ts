import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { WorkspaceRole } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { ActivityService } from '../activity/activity.service';
import { ActivityAction, ActivityEntityType } from '../activity/activity.types';
import { ListTrashResult, TrashEntityType, TrashItem } from './trash.types';

const MAX_APPS_PER_WORKSPACE = 50;

@Injectable()
export class TrashService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityService: ActivityService,
  ) {}

  async list(
    workspaceId: string,
    userId: string,
    opts: { page: number; limit: number },
  ): Promise<ListTrashResult> {
    await this.assertAdminOrOwner(workspaceId, userId);

    const taskWhere = {
      deletedAt: { not: null },
      column: { board: { workspaceId } },
    } as const;
    const dealWhere = {
      deletedAt: { not: null },
      stage: { funnel: { workspaceId } },
    } as const;
    const appWhere = {
      workspaceId,
      deletedAt: { not: null },
    } as const;

    const skip = (opts.page - 1) * opts.limit;
    // Need skip+limit from each stream to merge-sort correctly across types.
    const take = skip + opts.limit;
    const trashSelect = { id: true, title: true, deletedAt: true } as const;

    const [tasks, deals, apps, taskCount, dealCount, appCount] = await Promise.all([
      this.prisma.task.findMany({
        where: taskWhere,
        orderBy: { deletedAt: 'desc' },
        take,
        select: trashSelect,
      }),
      this.prisma.deal.findMany({
        where: dealWhere,
        orderBy: { deletedAt: 'desc' },
        take,
        select: trashSelect,
      }),
      this.prisma.workspaceExternalApp.findMany({
        where: appWhere,
        orderBy: { deletedAt: 'desc' },
        take,
        select: trashSelect,
      }),
      this.prisma.task.count({ where: taskWhere }),
      this.prisma.deal.count({ where: dealWhere }),
      this.prisma.workspaceExternalApp.count({ where: appWhere }),
    ]);

    const total = taskCount + dealCount + appCount;

    const merged: TrashItem[] = [
      ...tasks.map((task) => ({
        entityType: TrashEntityType.TASK,
        entityId: task.id,
        entityName: task.title,
        deletedAt: task.deletedAt!.toISOString(),
        metadata: {},
      })),
      ...deals.map((deal) => ({
        entityType: TrashEntityType.DEAL,
        entityId: deal.id,
        entityName: deal.title,
        deletedAt: deal.deletedAt!.toISOString(),
        metadata: {},
      })),
      ...apps.map((app) => ({
        entityType: TrashEntityType.APP,
        entityId: app.id,
        entityName: app.title,
        deletedAt: app.deletedAt!.toISOString(),
        metadata: {},
      })),
    ].sort((left, right) => right.deletedAt.localeCompare(left.deletedAt));

    return {
      items: merged.slice(skip, skip + opts.limit),
      meta: { total, page: opts.page, limit: opts.limit },
    };
  }

  async restore(
    workspaceId: string,
    userId: string,
    entityType: TrashEntityType,
    entityId: string,
  ): Promise<{ success: true }> {
    await this.assertAdminOrOwner(workspaceId, userId);
    this.assertEntityType(entityType);

    if (entityType === TrashEntityType.TASK) {
      const task = await this.prisma.task.findFirst({
        where: {
          id: entityId,
          deletedAt: { not: null },
          column: { board: { workspaceId } },
        },
      });

      if (!task) {
        throw new NotFoundException('Trash item not found');
      }

      const column = await this.prisma.boardColumn.findUnique({
        where: { id: task.columnId },
      });

      if (column?.deletedAt) {
        throw new ConflictException('Cannot restore task from a deleted column');
      }

      const lastTask = await this.prisma.task.findFirst({
        where: { columnId: task.columnId, deletedAt: null },
        orderBy: { position: 'desc' },
        select: { position: true },
      });

      await this.prisma.task.update({
        where: { id: task.id },
        data: {
          deletedAt: null,
          position: (lastTask?.position ?? -1) + 1,
        },
      });
      await this.activityService.record({
        workspaceId,
        actorId: userId,
        action: ActivityAction.TASK_RESTORED,
        entityType: ActivityEntityType.TASK,
        entityId: task.id,
        entityName: task.title,
      });

      return { success: true };
    }

    if (entityType === TrashEntityType.DEAL) {
      const deal = await this.prisma.deal.findFirst({
        where: {
          id: entityId,
          deletedAt: { not: null },
          stage: { funnel: { workspaceId } },
        },
      });

      if (!deal) {
        throw new NotFoundException('Trash item not found');
      }

      const stage = await this.prisma.funnelStage.findUnique({
        where: { id: deal.stageId },
      });

      if (stage?.deletedAt) {
        throw new ConflictException('Cannot restore deal from a deleted stage');
      }

      const lastDeal = await this.prisma.deal.findFirst({
        where: { stageId: deal.stageId, deletedAt: null },
        orderBy: { position: 'desc' },
        select: { position: true },
      });

      await this.prisma.deal.update({
        where: { id: deal.id },
        data: {
          deletedAt: null,
          position: (lastDeal?.position ?? -1) + 1,
        },
      });
      await this.activityService.record({
        workspaceId,
        actorId: userId,
        action: ActivityAction.DEAL_RESTORED,
        entityType: ActivityEntityType.DEAL,
        entityId: deal.id,
        entityName: deal.title,
      });

      return { success: true };
    }

    const app = await this.prisma.workspaceExternalApp.findFirst({
      where: {
        id: entityId,
        workspaceId,
        deletedAt: { not: null },
      },
    });

    if (!app) {
      throw new NotFoundException('Trash item not found');
    }

    const appCount = await this.prisma.workspaceExternalApp.count({
      where: { workspaceId, deletedAt: null },
    });

    if (appCount >= MAX_APPS_PER_WORKSPACE) {
      throw new ConflictException(
        `В рабочем пространстве можно добавить до ${MAX_APPS_PER_WORKSPACE} приложений`,
      );
    }

    await this.prisma.workspaceExternalApp.update({
      where: { id: app.id },
      data: { deletedAt: null },
    });
    await this.activityService.record({
      workspaceId,
      actorId: userId,
      action: ActivityAction.APP_RESTORED,
      entityType: ActivityEntityType.APP,
      entityId: app.id,
      entityName: app.title,
      metadata: { provider: app.provider },
    });

    return { success: true };
  }

  async purge(
    workspaceId: string,
    userId: string,
    entityType: TrashEntityType,
    entityId: string,
  ): Promise<{ success: true }> {
    await this.assertOwner(workspaceId, userId);
    this.assertEntityType(entityType);

    if (entityType === TrashEntityType.TASK) {
      const task = await this.prisma.task.findFirst({
        where: {
          id: entityId,
          deletedAt: { not: null },
          column: { board: { workspaceId } },
        },
      });

      if (!task) {
        throw new NotFoundException('Trash item not found');
      }

      await this.prisma.task.delete({ where: { id: task.id } });
      await this.activityService.record({
        workspaceId,
        actorId: userId,
        action: ActivityAction.TASK_PURGED,
        entityType: ActivityEntityType.TASK,
        entityId: task.id,
        entityName: task.title,
        metadata: { permanent: true },
      });
      return { success: true };
    }

    if (entityType === TrashEntityType.DEAL) {
      const deal = await this.prisma.deal.findFirst({
        where: {
          id: entityId,
          deletedAt: { not: null },
          stage: { funnel: { workspaceId } },
        },
      });

      if (!deal) {
        throw new NotFoundException('Trash item not found');
      }

      await this.prisma.deal.delete({ where: { id: deal.id } });
      await this.activityService.record({
        workspaceId,
        actorId: userId,
        action: ActivityAction.DEAL_PURGED,
        entityType: ActivityEntityType.DEAL,
        entityId: deal.id,
        entityName: deal.title,
        metadata: { permanent: true },
      });
      return { success: true };
    }

    const app = await this.prisma.workspaceExternalApp.findFirst({
      where: {
        id: entityId,
        workspaceId,
        deletedAt: { not: null },
      },
    });

    if (!app) {
      throw new NotFoundException('Trash item not found');
    }

    await this.prisma.workspaceExternalApp.delete({ where: { id: app.id } });
    await this.activityService.record({
      workspaceId,
      actorId: userId,
      action: ActivityAction.APP_PURGED,
      entityType: ActivityEntityType.APP,
      entityId: app.id,
      entityName: app.title,
      metadata: { permanent: true, provider: app.provider },
    });
    return { success: true };
  }

  private assertEntityType(entityType: string): asserts entityType is TrashEntityType {
    if (
      entityType !== TrashEntityType.TASK &&
      entityType !== TrashEntityType.DEAL &&
      entityType !== TrashEntityType.APP
    ) {
      throw new BadRequestException('Unsupported trash entity type');
    }
  }

  private async assertAdminOrOwner(workspaceId: string, userId: string) {
    const membership = await this.getMembership(workspaceId, userId);

    if (membership.role !== WorkspaceRole.OWNER && membership.role !== WorkspaceRole.ADMIN) {
      throw new ForbiddenException('Insufficient permissions to access trash');
    }

    return membership;
  }

  private async assertOwner(workspaceId: string, userId: string) {
    const membership = await this.getMembership(workspaceId, userId);

    if (membership.role !== WorkspaceRole.OWNER) {
      throw new ForbiddenException('Only workspace owner can permanently delete trash items');
    }

    return membership;
  }

  private async getMembership(workspaceId: string, userId: string) {
    const membership = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId, userId },
      },
      select: {
        role: true,
        workspace: { select: { deletedAt: true } },
      },
    });

    if (!membership || membership.workspace.deletedAt) {
      throw new NotFoundException('Workspace not found');
    }

    return membership;
  }
}
