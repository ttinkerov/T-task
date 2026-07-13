import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { CreateColumnDto } from './dto/create-column.dto';
import { MoveColumnDto } from './dto/move-column.dto';

@Injectable()
export class BoardsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspacesService: WorkspacesService,
  ) {}

  async getBoard(workspaceId: string, userId: string) {
    await this.workspacesService.getWorkspaceForMember(workspaceId, userId);

    const board = await this.prisma.board.findFirst({
      where: { workspaceId },
      include: {
        columns: {
          orderBy: { position: 'asc' },
          include: {
            tasks: {
              orderBy: { position: 'asc' },
            },
          },
        },
      },
    });

    if (!board) {
      throw new NotFoundException('Board not found');
    }

    return {
      id: board.id,
      workspaceId: board.workspaceId,
      name: board.name,
      columns: board.columns.map((column) => ({
        id: column.id,
        name: column.name,
        position: column.position,
        tasks: column.tasks.map((task) => ({
          id: task.id,
          title: task.title,
          description: task.description,
          priority: task.priority,
          complexity: task.complexity,
          dueDate: task.dueDate?.toISOString() ?? null,
          position: task.position,
          columnId: task.columnId,
          createdAt: task.createdAt.toISOString(),
        })),
      })),
    };
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
