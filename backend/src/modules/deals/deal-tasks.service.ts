import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { WorkspacesService } from '../workspaces/workspaces.service';

const taskSummarySelect = {
  id: true,
  title: true,
  columnId: true,
  completedAt: true,
  dueDate: true,
  column: {
    select: {
      name: true,
    },
  },
} as const;

const dealSummarySelect = {
  id: true,
  title: true,
  amount: true,
  stageId: true,
  stage: {
    select: {
      name: true,
      funnelId: true,
    },
  },
} as const;

@Injectable()
export class DealTasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspacesService: WorkspacesService,
  ) {}

  async listTasksForDeal(workspaceId: string, dealId: string, userId: string) {
    await this.assertDealInWorkspace(workspaceId, dealId, userId);

    const links = await this.prisma.dealTask.findMany({
      where: {
        dealId,
        task: {
          deletedAt: null,
          column: { board: { workspaceId } },
        },
      },
      orderBy: [{ createdAt: 'asc' }],
      include: {
        task: { select: taskSummarySelect },
      },
    });

    return links.map((link) => this.serializeTaskLink(link));
  }

  async listDealsForTask(workspaceId: string, taskId: string, userId: string) {
    await this.assertTaskInWorkspace(workspaceId, taskId, userId);

    const links = await this.prisma.dealTask.findMany({
      where: {
        taskId,
        deal: {
          deletedAt: null,
          stage: { funnel: { workspaceId } },
        },
      },
      orderBy: [{ createdAt: 'asc' }],
      include: {
        deal: { select: dealSummarySelect },
      },
    });

    return links.map((link) => this.serializeDealLink(link));
  }

  async linkFromDeal(workspaceId: string, dealId: string, taskId: string, userId: string) {
    await this.assertDealInWorkspace(workspaceId, dealId, userId);
    await this.assertTaskInWorkspace(workspaceId, taskId, userId);
    return this.createLink(dealId, taskId);
  }

  async linkFromTask(workspaceId: string, taskId: string, dealId: string, userId: string) {
    await this.assertTaskInWorkspace(workspaceId, taskId, userId);
    await this.assertDealInWorkspace(workspaceId, dealId, userId);
    return this.createLink(dealId, taskId);
  }

  async unlinkFromDeal(workspaceId: string, dealId: string, taskId: string, userId: string) {
    await this.assertDealInWorkspace(workspaceId, dealId, userId);
    await this.assertTaskInWorkspace(workspaceId, taskId, userId);
    return this.removeLink(dealId, taskId);
  }

  async unlinkFromTask(workspaceId: string, taskId: string, dealId: string, userId: string) {
    await this.assertTaskInWorkspace(workspaceId, taskId, userId);
    await this.assertDealInWorkspace(workspaceId, dealId, userId);
    return this.removeLink(dealId, taskId);
  }

  private async createLink(dealId: string, taskId: string) {
    const existing = await this.prisma.dealTask.findUnique({
      where: { dealId_taskId: { dealId, taskId } },
    });
    if (existing) {
      throw new ConflictException('Deal is already linked to this task');
    }

    try {
      const link = await this.prisma.dealTask.create({
        data: { dealId, taskId },
        include: {
          task: { select: taskSummarySelect },
          deal: { select: dealSummarySelect },
        },
      });

      return {
        dealId: link.dealId,
        taskId: link.taskId,
        createdAt: link.createdAt.toISOString(),
        deal: this.serializeDeal(link.deal),
        task: this.serializeTask(link.task),
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Deal is already linked to this task');
      }
      throw error;
    }
  }

  private async removeLink(dealId: string, taskId: string) {
    const deleted = await this.prisma.dealTask.deleteMany({
      where: { dealId, taskId },
    });
    if (deleted.count === 0) {
      throw new NotFoundException('Deal-task link not found');
    }
    return { success: true };
  }

  private async assertDealInWorkspace(workspaceId: string, dealId: string, userId: string) {
    await this.workspacesService.getWorkspaceForMember(workspaceId, userId);

    const deal = await this.prisma.deal.findFirst({
      where: {
        id: dealId,
        deletedAt: null,
        stage: { funnel: { workspaceId } },
      },
      select: dealSummarySelect,
    });

    if (!deal) {
      throw new NotFoundException('Deal not found');
    }

    return deal;
  }

  private async assertTaskInWorkspace(workspaceId: string, taskId: string, userId: string) {
    await this.workspacesService.getWorkspaceForMember(workspaceId, userId);

    const task = await this.prisma.task.findFirst({
      where: {
        id: taskId,
        deletedAt: null,
        column: { board: { workspaceId } },
      },
      select: taskSummarySelect,
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  private serializeTaskLink(link: {
    dealId: string;
    taskId: string;
    createdAt: Date;
    task: {
      id: string;
      title: string;
      columnId: string;
      completedAt: Date | null;
      dueDate: Date | null;
      column: { name: string };
    };
  }) {
    return {
      dealId: link.dealId,
      taskId: link.taskId,
      createdAt: link.createdAt.toISOString(),
      task: this.serializeTask(link.task),
    };
  }

  private serializeDealLink(link: {
    dealId: string;
    taskId: string;
    createdAt: Date;
    deal: {
      id: string;
      title: string;
      amount: number | null;
      stageId: string;
      stage: { name: string; funnelId: string };
    };
  }) {
    return {
      dealId: link.dealId,
      taskId: link.taskId,
      createdAt: link.createdAt.toISOString(),
      deal: this.serializeDeal(link.deal),
    };
  }

  private serializeTask(task: {
    id: string;
    title: string;
    columnId: string;
    completedAt: Date | null;
    dueDate: Date | null;
    column: { name: string };
  }) {
    return {
      id: task.id,
      title: task.title,
      columnId: task.columnId,
      columnName: task.column.name,
      completed: Boolean(task.completedAt),
      dueDate: task.dueDate ? task.dueDate.toISOString() : null,
    };
  }

  private serializeDeal(deal: {
    id: string;
    title: string;
    amount: number | null;
    stageId: string;
    stage: { name: string; funnelId: string };
  }) {
    return {
      id: deal.id,
      title: deal.title,
      amount: deal.amount,
      stageId: deal.stageId,
      stageName: deal.stage.name,
      funnelId: deal.stage.funnelId,
    };
  }
}
