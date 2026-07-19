import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { CreateSubtaskDto } from './dto/create-subtask.dto';
import { UpdateSubtaskDto } from './dto/update-subtask.dto';

@Injectable()
export class SubtasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspacesService: WorkspacesService,
  ) {}

  async list(workspaceId: string, taskId: string, userId: string) {
    await this.requireTask(workspaceId, taskId, userId);
    return this.prisma.subtask.findMany({
      where: { taskId },
      orderBy: { position: 'asc' },
      select: { id: true, title: true, completed: true, position: true },
    });
  }

  async create(workspaceId: string, taskId: string, userId: string, dto: CreateSubtaskDto) {
    await this.requireTask(workspaceId, taskId, userId);

    const last = await this.prisma.subtask.findFirst({
      where: { taskId },
      orderBy: { position: 'desc' },
      select: { position: true },
    });

    return this.prisma.subtask.create({
      data: {
        taskId,
        title: dto.title.trim(),
        position: (last?.position ?? -1) + 1,
      },
      select: { id: true, title: true, completed: true, position: true },
    });
  }

  async update(
    workspaceId: string,
    taskId: string,
    subtaskId: string,
    userId: string,
    dto: UpdateSubtaskDto,
  ) {
    await this.requireTask(workspaceId, taskId, userId);
    const subtask = await this.prisma.subtask.findFirst({
      where: { id: subtaskId, taskId },
    });
    if (!subtask) {
      throw new NotFoundException('Подзадача не найдена');
    }

    return this.prisma.subtask.update({
      where: { id: subtaskId },
      data: {
        ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
        ...(dto.completed !== undefined ? { completed: dto.completed } : {}),
      },
      select: { id: true, title: true, completed: true, position: true },
    });
  }

  async remove(workspaceId: string, taskId: string, subtaskId: string, userId: string) {
    await this.requireTask(workspaceId, taskId, userId);
    const subtask = await this.prisma.subtask.findFirst({
      where: { id: subtaskId, taskId },
      select: { id: true },
    });
    if (!subtask) {
      throw new NotFoundException('Подзадача не найдена');
    }

    await this.prisma.subtask.delete({ where: { id: subtaskId } });
    return { deleted: true };
  }

  private async requireTask(workspaceId: string, taskId: string, userId: string) {
    await this.workspacesService.getWorkspaceForMember(workspaceId, userId);
    const task = await this.prisma.task.findFirst({
      where: {
        id: taskId,
        deletedAt: null,
        column: { board: { workspaceId } },
      },
      select: { id: true },
    });
    if (!task) {
      throw new NotFoundException('Задача не найдена');
    }
    return task;
  }
}
