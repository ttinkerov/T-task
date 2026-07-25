import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { WorkspacesService } from '../workspaces/workspaces.service';

const TASK_ID_PATTERN = /^[A-Za-z0-9_-]{20,36}$/;
const MAX_BACKLINKS = 50;

export type TaskBacklink = {
  id: string;
  title: string;
  columnName: string;
};

@Injectable()
export class TaskBacklinksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspacesService: WorkspacesService,
  ) {}

  async list(workspaceId: string, taskId: string, userId: string): Promise<TaskBacklink[]> {
    await this.workspacesService.getWorkspaceForMember(workspaceId, userId);

    if (!TASK_ID_PATTERN.test(taskId)) {
      throw new NotFoundException('Задача не найдена');
    }

    const target = await this.prisma.task.findFirst({
      where: {
        id: taskId,
        deletedAt: null,
        column: { board: { workspaceId } },
      },
      select: { id: true },
    });
    if (!target) {
      throw new NotFoundException('Задача не найдена');
    }

    const needle = `]](${taskId})`;
    const tasks = await this.prisma.task.findMany({
      where: {
        id: { not: taskId },
        deletedAt: null,
        description: { contains: needle },
        column: { board: { workspaceId } },
      },
      select: {
        id: true,
        title: true,
        column: { select: { name: true } },
      },
      orderBy: [{ updatedAt: 'desc' }, { id: 'asc' }],
      take: MAX_BACKLINKS,
    });

    return tasks.map((task) => ({
      id: task.id,
      title: task.title,
      columnName: task.column.name,
    }));
  }
}
