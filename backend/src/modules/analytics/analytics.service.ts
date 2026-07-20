import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspacesService: WorkspacesService,
  ) {}

  async summary(workspaceId: string, userId: string, query: AnalyticsQueryDto) {
    await this.workspacesService.getWorkspaceForMember(workspaceId, userId);

    const to = query.to ? new Date(query.to) : new Date();
    const from = query.from
      ? new Date(query.from)
      : new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);

    const taskWhere: Prisma.TaskWhereInput = {
      deletedAt: null,
      column: {
        board: {
          workspaceId,
          ...(query.boardId ? { id: query.boardId } : {}),
        },
      },
      ...(query.assigneeId ? { assigneeId: query.assigneeId } : {}),
    };

    const [completed, overdueCount, openCycleSamples] = await Promise.all([
      this.prisma.task.findMany({
        where: {
          ...taskWhere,
          completedAt: { gte: from, lte: to },
        },
        select: { createdAt: true, completedAt: true },
      }),
      this.prisma.task.count({
        where: {
          ...taskWhere,
          completedAt: null,
          dueDate: { lt: new Date() },
        },
      }),
      this.prisma.task.findMany({
        where: {
          ...taskWhere,
          completedAt: { gte: from, lte: to, not: null },
        },
        select: { createdAt: true, completedAt: true },
        take: 2000,
      }),
    ]);

    const cycleHours = openCycleSamples
      .filter((task) => task.completedAt)
      .map((task) => (task.completedAt!.getTime() - task.createdAt.getTime()) / (1000 * 60 * 60))
      .filter((hours) => Number.isFinite(hours) && hours >= 0)
      .sort((a, b) => a - b);

    const avgCycleTimeHours =
      cycleHours.length === 0
        ? 0
        : Math.round((cycleHours.reduce((sum, h) => sum + h, 0) / cycleHours.length) * 10) / 10;

    const medianCycleTimeHours =
      cycleHours.length === 0
        ? 0
        : Math.round(cycleHours[Math.floor(cycleHours.length / 2)] * 10) / 10;

    return {
      from: from.toISOString(),
      to: to.toISOString(),
      throughput: completed.length,
      avgCycleTimeHours,
      medianCycleTimeHours,
      overdueCount,
    };
  }
}
