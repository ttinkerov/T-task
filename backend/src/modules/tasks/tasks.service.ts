import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { BoardsService } from '../boards/boards.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { MoveTaskDto } from './dto/move-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspacesService: WorkspacesService,
    private readonly boardsService: BoardsService,
  ) {}

  async create(workspaceId: string, userId: string, dto: CreateTaskDto) {
    await this.workspacesService.getWorkspaceForMember(workspaceId, userId);
    await this.boardsService.getBoardForWorkspace(workspaceId);

    const column = await this.prisma.boardColumn.findFirst({
      where: {
        id: dto.columnId,
        board: { workspaceId },
      },
    });

    if (!column) {
      throw new NotFoundException('Column not found');
    }

    const lastTask = await this.prisma.task.findFirst({
      where: { columnId: column.id },
      orderBy: { position: 'desc' },
    });

    const position = (lastTask?.position ?? -1) + 1;

    const task = await this.prisma.task.create({
      data: {
        columnId: column.id,
        title: dto.title.trim(),
        description: dto.description?.trim() || null,
        position,
      },
    });

    return this.toTask(task);
  }

  async update(workspaceId: string, taskId: string, userId: string, dto: UpdateTaskDto) {
    const task = await this.assertTaskInWorkspace(workspaceId, taskId, userId);

    const updated = await this.prisma.task.update({
      where: { id: task.id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
        ...(dto.description !== undefined ? { description: dto.description.trim() || null } : {}),
      },
    });

    return this.toTask(updated);
  }

  async move(workspaceId: string, taskId: string, userId: string, dto: MoveTaskDto) {
    const task = await this.assertTaskInWorkspace(workspaceId, taskId, userId);

    const targetColumn = await this.prisma.boardColumn.findFirst({
      where: {
        id: dto.columnId,
        board: { workspaceId },
      },
    });

    if (!targetColumn) {
      throw new NotFoundException('Column not found');
    }

    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      if (task.columnId === dto.columnId) {
        await this.reorderWithinColumn(tx, task.columnId, taskId, dto.position);
        return;
      }

      await this.closeGap(tx, task.columnId, task.position);
      await this.makeSpace(tx, dto.columnId, dto.position);
      await tx.task.update({
        where: { id: taskId },
        data: {
          columnId: dto.columnId,
          position: dto.position,
        },
      });
    });

    const updated = await this.prisma.task.findUniqueOrThrow({ where: { id: taskId } });
    return this.toTask(updated);
  }

  async remove(workspaceId: string, taskId: string, userId: string) {
    const task = await this.assertTaskInWorkspace(workspaceId, taskId, userId);

    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.task.delete({ where: { id: taskId } });
      await this.closeGap(tx, task.columnId, task.position);
    });

    return { success: true };
  }

  private async assertTaskInWorkspace(workspaceId: string, taskId: string, userId: string) {
    await this.workspacesService.getWorkspaceForMember(workspaceId, userId);

    const task = await this.prisma.task.findFirst({
      where: {
        id: taskId,
        column: { board: { workspaceId } },
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  private async reorderWithinColumn(
    tx: Prisma.TransactionClient,
    columnId: string,
    taskId: string,
    newPosition: number,
  ) {
    const tasks = await tx.task.findMany({
      where: { columnId },
      orderBy: { position: 'asc' },
    });

    const moving = tasks.find((item) => item.id === taskId);
    if (!moving) return;

    const without = tasks.filter((item) => item.id !== taskId);
    without.splice(newPosition, 0, moving);

    await Promise.all(
      without.map((item, index) =>
        tx.task.update({
          where: { id: item.id },
          data: { position: index },
        }),
      ),
    );
  }

  private async closeGap(tx: Prisma.TransactionClient, columnId: string, removedPosition: number) {
    const tasks = await tx.task.findMany({
      where: { columnId, position: { gt: removedPosition } },
      orderBy: { position: 'asc' },
    });

    await Promise.all(
      tasks.map((item) =>
        tx.task.update({
          where: { id: item.id },
          data: { position: item.position - 1 },
        }),
      ),
    );
  }

  private async makeSpace(tx: Prisma.TransactionClient, columnId: string, position: number) {
    const tasks = await tx.task.findMany({
      where: { columnId, position: { gte: position } },
      orderBy: { position: 'desc' },
    });

    await Promise.all(
      tasks.map((item) =>
        tx.task.update({
          where: { id: item.id },
          data: { position: item.position + 1 },
        }),
      ),
    );
  }

  private toTask(task: {
    id: string;
    title: string;
    description: string | null;
    position: number;
    columnId: string;
    createdAt: Date;
  }) {
    return {
      id: task.id,
      title: task.title,
      description: task.description,
      position: task.position,
      columnId: task.columnId,
      createdAt: task.createdAt.toISOString(),
    };
  }
}
