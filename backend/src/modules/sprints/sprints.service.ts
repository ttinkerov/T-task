import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { CreateSprintDto } from './dto/create-sprint.dto';
import { UpdateSprintDto } from './dto/update-sprint.dto';

@Injectable()
export class SprintsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspacesService: WorkspacesService,
  ) {}

  async list(workspaceId: string, userId: string) {
    await this.workspacesService.getWorkspaceForMember(workspaceId, userId);
    const sprints = await this.prisma.sprint.findMany({
      where: { workspaceId },
      orderBy: [{ closedAt: 'asc' }, { startDate: 'desc' }],
    });
    return sprints.map((sprint) => this.serialize(sprint));
  }

  async create(workspaceId: string, userId: string, dto: CreateSprintDto) {
    await this.workspacesService.getWorkspaceForMember(workspaceId, userId);
    this.assertDateRange(dto.startDate, dto.endDate);

    const sprint = await this.prisma.sprint.create({
      data: {
        workspaceId,
        name: dto.name.trim(),
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
      },
    });
    return this.serialize(sprint);
  }

  async update(workspaceId: string, sprintId: string, userId: string, dto: UpdateSprintDto) {
    await this.requireSprint(workspaceId, sprintId, userId);
    const startDate = dto.startDate;
    const endDate = dto.endDate;
    if (startDate && endDate) this.assertDateRange(startDate, endDate);

    const sprint = await this.prisma.sprint.update({
      where: { id: sprintId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(startDate ? { startDate: new Date(startDate) } : {}),
        ...(endDate ? { endDate: new Date(endDate) } : {}),
      },
    });
    return this.serialize(sprint);
  }

  async close(workspaceId: string, sprintId: string, userId: string) {
    await this.requireSprint(workspaceId, sprintId, userId);
    const sprint = await this.prisma.sprint.update({
      where: { id: sprintId },
      data: { closedAt: new Date() },
    });
    return this.serialize(sprint);
  }

  async remove(workspaceId: string, sprintId: string, userId: string) {
    await this.requireSprint(workspaceId, sprintId, userId);
    await this.prisma.sprint.delete({ where: { id: sprintId } });
    return { deleted: true };
  }

  async burndown(workspaceId: string, sprintId: string, userId: string) {
    const sprint = await this.requireSprint(workspaceId, sprintId, userId);
    const tasks = await this.prisma.task.findMany({
      where: { sprintId, deletedAt: null },
      select: { id: true, createdAt: true, completedAt: true, complexity: true },
    });

    const start = startOfDay(sprint.startDate);
    const end = startOfDay(sprint.endDate);
    const today = startOfDay(new Date());
    const last = today.getTime() < end.getTime() ? today : end;
    const totalDays = Math.max(1, Math.floor((end.getTime() - start.getTime()) / 86_400_000) + 1);
    const total = tasks.length;
    const totalPoints = tasks.reduce((sum, task) => sum + (task.complexity ?? 0), 0);

    const days: Array<{
      date: string;
      remaining: number;
      remainingPoints: number;
      ideal: number;
    }> = [];
    for (
      let cursor = new Date(start);
      cursor.getTime() <= last.getTime();
      cursor.setDate(cursor.getDate() + 1)
    ) {
      const dayEnd = endOfDay(cursor);
      const openTasks = tasks.filter((task) => {
        if (task.createdAt.getTime() > dayEnd.getTime()) return false;
        if (!task.completedAt) return true;
        return task.completedAt.getTime() > dayEnd.getTime();
      });
      const remaining = openTasks.length;
      const remainingPoints = openTasks.reduce((sum, task) => sum + (task.complexity ?? 0), 0);
      const dayIndex = Math.floor((startOfDay(cursor).getTime() - start.getTime()) / 86_400_000);
      const ideal = Math.max(0, Math.round(total * (1 - dayIndex / Math.max(1, totalDays - 1))));
      days.push({
        date: startOfDay(cursor).toISOString().slice(0, 10),
        remaining,
        remainingPoints,
        ideal: Number.isFinite(ideal) ? ideal : total,
      });
    }

    return {
      sprintId: sprint.id,
      name: sprint.name,
      total,
      totalPoints,
      days,
    };
  }

  async velocity(workspaceId: string, userId: string) {
    await this.workspacesService.getWorkspaceForMember(workspaceId, userId);

    const sprints = await this.prisma.sprint.findMany({
      where: { workspaceId },
      orderBy: { startDate: 'desc' },
      take: 8,
    });

    if (sprints.length === 0) {
      return { sprints: [], averageVelocity: 0 };
    }

    const sprintIds = sprints.map((sprint) => sprint.id);
    const [committedGroups, completedGroups] = await Promise.all([
      this.prisma.task.groupBy({
        by: ['sprintId'],
        where: { sprintId: { in: sprintIds }, deletedAt: null },
        _sum: { complexity: true },
      }),
      this.prisma.task.groupBy({
        by: ['sprintId'],
        where: {
          sprintId: { in: sprintIds },
          deletedAt: null,
          completedAt: { not: null },
        },
        _sum: { complexity: true },
      }),
    ]);

    const committedBySprint = new Map(
      committedGroups.map((group) => [group.sprintId, group._sum.complexity ?? 0]),
    );
    const completedBySprint = new Map(
      completedGroups.map((group) => [group.sprintId, group._sum.complexity ?? 0]),
    );

    const now = Date.now();
    const items = [...sprints].reverse().map((sprint) => {
      const active =
        !sprint.closedAt && sprint.startDate.getTime() <= now && sprint.endDate.getTime() >= now;
      return {
        sprintId: sprint.id,
        name: sprint.name,
        closedAt: sprint.closedAt?.toISOString() ?? null,
        active,
        committedPoints: committedBySprint.get(sprint.id) ?? 0,
        completedPoints: completedBySprint.get(sprint.id) ?? 0,
      };
    });

    const closed = items.filter((item) => item.closedAt);
    const averageVelocity =
      closed.length === 0
        ? 0
        : Math.round(
            (closed.reduce((sum, item) => sum + item.completedPoints, 0) / closed.length) * 10,
          ) / 10;

    return { sprints: items, averageVelocity };
  }

  private async requireSprint(workspaceId: string, sprintId: string, userId: string) {
    await this.workspacesService.getWorkspaceForMember(workspaceId, userId);
    const sprint = await this.prisma.sprint.findFirst({
      where: { id: sprintId, workspaceId },
    });
    if (!sprint) throw new NotFoundException('Спринт не найден');
    return sprint;
  }

  private assertDateRange(startDate: string, endDate: string) {
    if (new Date(startDate).getTime() >= new Date(endDate).getTime()) {
      throw new BadRequestException('Дата начала должна быть раньше даты окончания');
    }
  }

  private serialize(sprint: {
    id: string;
    workspaceId: string;
    name: string;
    startDate: Date;
    endDate: Date;
    closedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    const now = Date.now();
    const active =
      !sprint.closedAt && sprint.startDate.getTime() <= now && sprint.endDate.getTime() >= now;
    return {
      id: sprint.id,
      workspaceId: sprint.workspaceId,
      name: sprint.name,
      startDate: sprint.startDate.toISOString(),
      endDate: sprint.endDate.toISOString(),
      closedAt: sprint.closedAt?.toISOString() ?? null,
      active,
      createdAt: sprint.createdAt.toISOString(),
      updatedAt: sprint.updatedAt.toISOString(),
    };
  }
}

function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function endOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}
