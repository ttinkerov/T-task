import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { CreateColumnDto } from './dto/create-column.dto';
import { MoveColumnDto } from './dto/move-column.dto';
import { UpdateColumnDto } from './dto/update-column.dto';
import { countOverdueDays, isTaskOverdue, nextRolledDueDate } from './utils/overdue.util';

@Injectable()
export class BoardsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspacesService: WorkspacesService,
  ) {}

  async getBoard(workspaceId: string, userId: string) {
    await this.workspacesService.getWorkspaceForMember(workspaceId, userId);

    const workspace = await this.prisma.workspace.findUniqueOrThrow({
      where: { id: workspaceId },
      select: { autoRollOverdue: true },
    });

    let board = await this.fetchBoard(workspaceId);

    if (workspace.autoRollOverdue) {
      await this.rollOverdueTasks(board);
      board = await this.fetchBoard(workspaceId);
    }

    return {
      id: board.id,
      workspaceId: board.workspaceId,
      name: board.name,
      columns: board.columns.map((column) => ({
        id: column.id,
        name: column.name,
        position: column.position,
        tasks: column.tasks.map((task) => this.serializeTask(task)),
      })),
    };
  }

  private async fetchBoard(workspaceId: string) {
    const board = await this.prisma.board.findFirst({
      where: { workspaceId },
      include: {
        columns: {
          orderBy: { position: 'asc' },
          include: {
            tasks: {
              orderBy: { position: 'asc' },
              include: {
                assignee: {
                  select: { id: true, name: true, email: true, avatarUrl: true },
                },
              },
            },
          },
        },
      },
    });

    if (!board) {
      throw new NotFoundException('Board not found');
    }

    return board;
  }

  private async rollOverdueTasks(board: {
    columns: Array<{
      id: string;
      name: string;
      position: number;
      tasks: Array<{
        id: string;
        dueDate: Date | null;
      }>;
    }>;
  }) {
    const columns = board.columns;
    const updates: Array<ReturnType<typeof this.prisma.task.update>> = [];

    for (const column of columns) {
      for (const task of column.tasks) {
        if (!isTaskOverdue(task, column, columns)) {
          continue;
        }

        updates.push(
          this.prisma.task.update({
            where: { id: task.id },
            data: {
              dueDate: nextRolledDueDate(),
              overdueDays: countOverdueDays(task.dueDate!),
            },
          }),
        );
      }
    }

    if (updates.length > 0) {
      await Promise.all(updates);
    }
  }

  async getBoardForWorkspace(workspaceId: string) {
    const board = await this.prisma.board.findFirst({
      where: { workspaceId },
      select: { id: true },
    });

    if (!board) {
      throw new NotFoundException('Board not found');
    }

    return board;
  }

  async createColumn(workspaceId: string, userId: string, dto: CreateColumnDto) {
    await this.workspacesService.getWorkspaceForMember(workspaceId, userId);
    const board = await this.getBoardForWorkspace(workspaceId);

    const lastColumn = await this.prisma.boardColumn.findFirst({
      where: { boardId: board.id },
      orderBy: { position: 'desc' },
    });

    const column = await this.prisma.boardColumn.create({
      data: {
        boardId: board.id,
        name: dto.name.trim(),
        position: (lastColumn?.position ?? -1) + 1,
      },
    });

    return {
      id: column.id,
      name: column.name,
      position: column.position,
      tasks: [],
    };
  }

  async updateColumn(workspaceId: string, columnId: string, userId: string, dto: UpdateColumnDto) {
    await this.workspacesService.getWorkspaceForMember(workspaceId, userId);
    const board = await this.getBoardForWorkspace(workspaceId);

    const column = await this.prisma.boardColumn.findFirst({
      where: { id: columnId, boardId: board.id },
    });

    if (!column) {
      throw new NotFoundException('Column not found');
    }

    const updated = await this.prisma.boardColumn.update({
      where: { id: columnId },
      data: { name: dto.name.trim() },
    });

    return {
      id: updated.id,
      name: updated.name,
      position: updated.position,
    };
  }

  async deleteColumn(workspaceId: string, columnId: string, userId: string) {
    await this.workspacesService.getWorkspaceForMember(workspaceId, userId);
    const board = await this.getBoardForWorkspace(workspaceId);

    const column = await this.prisma.boardColumn.findFirst({
      where: { id: columnId, boardId: board.id },
    });

    if (!column) {
      throw new NotFoundException('Column not found');
    }

    const columnCount = await this.prisma.boardColumn.count({
      where: { boardId: board.id },
    });

    if (columnCount <= 1) {
      throw new BadRequestException('Cannot delete the last column');
    }

    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.boardColumn.delete({ where: { id: columnId } });

      const remaining = await tx.boardColumn.findMany({
        where: { boardId: board.id },
        orderBy: { position: 'asc' },
      });

      await Promise.all(
        remaining.map((item, index) =>
          tx.boardColumn.update({
            where: { id: item.id },
            data: { position: index },
          }),
        ),
      );
    });

    return { success: true };
  }

  async moveColumn(workspaceId: string, columnId: string, userId: string, dto: MoveColumnDto) {
    await this.workspacesService.getWorkspaceForMember(workspaceId, userId);
    const board = await this.getBoardForWorkspace(workspaceId);

    const column = await this.prisma.boardColumn.findFirst({
      where: { id: columnId, boardId: board.id },
    });

    if (!column) {
      throw new NotFoundException('Column not found');
    }

    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await this.reorderColumns(tx, board.id, columnId, dto.position);
    });

    const updated = await this.prisma.boardColumn.findUniqueOrThrow({ where: { id: columnId } });

    return {
      id: updated.id,
      name: updated.name,
      position: updated.position,
    };
  }

  serializeTask(task: {
    id: string;
    title: string;
    description: string | null;
    priority: import('@prisma/client').TaskPriority | null;
    complexity: number | null;
    timeEstimateMinutes: number | null;
    actualMinutes: number | null;
    dueDate: Date | null;
    assigneeId?: string | null;
    position: number;
    columnId: string;
    recurrenceRule: import('@prisma/client').TaskRecurrenceRule;
    recurrenceAction: import('@prisma/client').TaskRecurrenceAction;
    recurrenceWeekdays: number[];
    recurrenceOriginColumnId: string | null;
    overdueDays: number;
    createdAt: Date;
    assignee?: {
      id: string;
      name: string;
      email: string;
      avatarUrl: string | null;
    } | null;
  }) {
    return {
      id: task.id,
      title: task.title,
      description: task.description,
      priority: task.priority,
      complexity: task.complexity,
      timeEstimateMinutes: task.timeEstimateMinutes,
      actualMinutes: task.actualMinutes,
      dueDate: task.dueDate?.toISOString() ?? null,
      assigneeId: task.assigneeId ?? null,
      assignee: task.assignee
        ? {
            id: task.assignee.id,
            name: task.assignee.name,
            email: task.assignee.email,
            avatarUrl: task.assignee.avatarUrl,
          }
        : null,
      position: task.position,
      columnId: task.columnId,
      recurrenceRule: task.recurrenceRule,
      recurrenceAction: task.recurrenceAction,
      recurrenceWeekdays: task.recurrenceWeekdays,
      recurrenceOriginColumnId: task.recurrenceOriginColumnId,
      overdueDays: task.overdueDays,
      createdAt: task.createdAt.toISOString(),
    };
  }

  private async reorderColumns(
    tx: Prisma.TransactionClient,
    boardId: string,
    columnId: string,
    newPosition: number,
  ) {
    const columns = await tx.boardColumn.findMany({
      where: { boardId },
      orderBy: { position: 'asc' },
    });

    const moving = columns.find((item) => item.id === columnId);
    if (!moving) return;

    const without = columns.filter((item) => item.id !== columnId);
    without.splice(newPosition, 0, moving);

    await Promise.all(
      without.map((item, index) =>
        tx.boardColumn.update({
          where: { id: item.id },
          data: { position: index },
        }),
      ),
    );
  }
}
