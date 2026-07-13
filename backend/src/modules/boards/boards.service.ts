import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { CreateColumnDto } from './dto/create-column.dto';

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
}
