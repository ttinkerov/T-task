import { BadRequestException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BoardsService } from './boards.service';
import { DEFAULT_BOARD_COLUMNS } from './utils/create-default-board.util';

function makePrisma() {
  return {
    workspace: {
      findUniqueOrThrow: vi.fn(),
    },
    board: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    boardColumn: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    task: {
      count: vi.fn(),
      update: vi.fn(),
    },
    workspaceMember: {
      findFirst: vi.fn(),
    },
    columnAutomation: {
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
    $transaction: vi.fn(),
  };
}

describe('BoardsService — multiple boards', () => {
  let prisma: ReturnType<typeof makePrisma>;
  let service: BoardsService;
  const workspacesService = { getWorkspaceForMember: vi.fn().mockResolvedValue({ id: 'ws-1' }) };
  const activityService = { record: vi.fn().mockResolvedValue(undefined) };

  beforeEach(() => {
    vi.clearAllMocks();
    prisma = makePrisma();
    prisma.$transaction = vi.fn(async (fn: (tx: unknown) => unknown) => fn(prisma));
    workspacesService.getWorkspaceForMember.mockResolvedValue({ id: 'ws-1' });
    activityService.record.mockResolvedValue(undefined);
    service = new BoardsService(
      prisma as never,
      workspacesService as never,
      activityService as never,
    );
  });

  describe('listBoards', () => {
    it('returns boards ordered by createdAt', async () => {
      const createdAt = new Date('2026-01-01T00:00:00.000Z');
      const updatedAt = new Date('2026-01-02T00:00:00.000Z');
      prisma.board.findMany.mockResolvedValue([
        {
          id: 'board-1',
          workspaceId: 'ws-1',
          name: 'Доска',
          createdAt,
          updatedAt,
        },
        {
          id: 'board-2',
          workspaceId: 'ws-1',
          name: 'Спринт',
          createdAt: new Date('2026-01-03T00:00:00.000Z'),
          updatedAt: new Date('2026-01-03T00:00:00.000Z'),
        },
      ]);

      const result = await service.listBoards('ws-1', 'user-1');

      expect(workspacesService.getWorkspaceForMember).toHaveBeenCalledWith('ws-1', 'user-1');
      expect(prisma.board.findMany).toHaveBeenCalledWith({
        where: { workspaceId: 'ws-1' },
        orderBy: { createdAt: 'asc' },
        select: { id: true, workspaceId: true, name: true, createdAt: true, updatedAt: true },
      });
      expect(result).toEqual([
        {
          id: 'board-1',
          workspaceId: 'ws-1',
          name: 'Доска',
          createdAt: createdAt.toISOString(),
          updatedAt: updatedAt.toISOString(),
        },
        expect.objectContaining({ id: 'board-2', name: 'Спринт' }),
      ]);
    });
  });

  describe('createBoard', () => {
    it('creates a board with default columns', async () => {
      const createdAt = new Date('2026-01-05T00:00:00.000Z');
      const updatedAt = createdAt;
      prisma.board.create.mockResolvedValue({
        id: 'board-new',
        workspaceId: 'ws-1',
        name: 'Маркетинг',
        createdAt,
        updatedAt,
      });
      prisma.boardColumn.create.mockResolvedValue({});

      const result = await service.createBoard('ws-1', 'user-1', { name: '  Маркетинг  ' });

      expect(prisma.board.create).toHaveBeenCalledWith({
        data: { workspaceId: 'ws-1', name: 'Маркетинг' },
      });
      expect(prisma.boardColumn.create).toHaveBeenCalledTimes(DEFAULT_BOARD_COLUMNS.length);
      expect(prisma.boardColumn.create).toHaveBeenCalledWith({
        data: { boardId: 'board-new', name: DEFAULT_BOARD_COLUMNS[0], position: 0 },
      });
      expect(result).toEqual({
        id: 'board-new',
        workspaceId: 'ws-1',
        name: 'Маркетинг',
        createdAt: createdAt.toISOString(),
        updatedAt: updatedAt.toISOString(),
      });
    });
  });

  describe('getBoard', () => {
    const boardPayload = {
      id: 'board-2',
      workspaceId: 'ws-1',
      name: 'Спринт',
      columns: [],
    };

    it('fetches the first board when boardId is omitted', async () => {
      prisma.workspace.findUniqueOrThrow.mockResolvedValue({ autoRollOverdue: false });
      prisma.board.findFirst.mockResolvedValue(boardPayload);

      const result = await service.getBoard('ws-1', 'user-1');

      expect(prisma.board.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { workspaceId: 'ws-1' },
          orderBy: { createdAt: 'asc' },
        }),
      );
      expect(result).toEqual({
        id: 'board-2',
        workspaceId: 'ws-1',
        name: 'Спринт',
        columns: [],
      });
    });

    it('fetches a specific board by id', async () => {
      prisma.workspace.findUniqueOrThrow.mockResolvedValue({ autoRollOverdue: false });
      prisma.board.findFirst.mockResolvedValue(boardPayload);

      const result = await service.getBoard('ws-1', 'user-1', 'board-2');

      expect(prisma.board.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'board-2', workspaceId: 'ws-1' },
        }),
      );
      expect(result.id).toBe('board-2');
    });

    it('throws when board is missing', async () => {
      prisma.workspace.findUniqueOrThrow.mockResolvedValue({ autoRollOverdue: false });
      prisma.board.findFirst.mockResolvedValue(null);

      await expect(service.getBoard('ws-1', 'user-1', 'missing')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('updateBoard / deleteBoard', () => {
    it('renames a board in the workspace', async () => {
      const createdAt = new Date('2026-01-01T00:00:00.000Z');
      const updatedAt = new Date('2026-01-06T00:00:00.000Z');
      prisma.board.findFirst.mockResolvedValue({ id: 'board-2' });
      prisma.board.update.mockResolvedValue({
        id: 'board-2',
        workspaceId: 'ws-1',
        name: 'Новое имя',
        createdAt,
        updatedAt,
      });

      const result = await service.updateBoard('ws-1', 'board-2', 'user-1', {
        name: ' Новое имя ',
      });

      expect(prisma.board.findFirst).toHaveBeenCalledWith({
        where: { id: 'board-2', workspaceId: 'ws-1' },
        orderBy: { createdAt: 'asc' },
        select: { id: true },
      });
      expect(prisma.board.update).toHaveBeenCalledWith({
        where: { id: 'board-2' },
        data: { name: 'Новое имя' },
        select: { id: true, workspaceId: true, name: true, createdAt: true, updatedAt: true },
      });
      expect(result.name).toBe('Новое имя');
    });

    it('deletes a board when more than one remains', async () => {
      prisma.board.findFirst.mockResolvedValue({ id: 'board-2' });
      prisma.board.count.mockResolvedValue(2);
      prisma.board.delete.mockResolvedValue({});

      const result = await service.deleteBoard('ws-1', 'board-2', 'user-1');

      expect(prisma.board.delete).toHaveBeenCalledWith({ where: { id: 'board-2' } });
      expect(result).toEqual({ success: true });
    });

    it('rejects deleting the last board', async () => {
      prisma.board.findFirst.mockResolvedValue({ id: 'board-1' });
      prisma.board.count.mockResolvedValue(1);

      await expect(service.deleteBoard('ws-1', 'board-1', 'user-1')).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(prisma.board.delete).not.toHaveBeenCalled();
    });
  });

  describe('column scoping across boards', () => {
    it('creates a column on an explicit boardId', async () => {
      prisma.board.findFirst.mockResolvedValue({ id: 'board-2' });
      prisma.boardColumn.findFirst.mockResolvedValue({ position: 2 });
      prisma.boardColumn.create.mockResolvedValue({
        id: 'col-new',
        name: 'Ревью',
        position: 3,
        boardId: 'board-2',
      });

      const result = await service.createColumn('ws-1', 'user-1', {
        name: 'Ревью',
        boardId: 'board-2',
      });

      expect(prisma.board.findFirst).toHaveBeenCalledWith({
        where: { id: 'board-2', workspaceId: 'ws-1' },
        orderBy: { createdAt: 'asc' },
        select: { id: true },
      });
      expect(prisma.boardColumn.create).toHaveBeenCalledWith({
        data: { boardId: 'board-2', name: 'Ревью', position: 3 },
      });
      expect(result).toEqual({
        id: 'col-new',
        name: 'Ревью',
        position: 3,
        automations: [],
        tasks: [],
      });
    });

    it('defaults createColumn to the first board when boardId is omitted', async () => {
      prisma.board.findFirst.mockResolvedValue({ id: 'board-1' });
      prisma.boardColumn.findFirst.mockResolvedValue(null);
      prisma.boardColumn.create.mockResolvedValue({
        id: 'col-1',
        name: 'Новая',
        position: 0,
        boardId: 'board-1',
      });

      await service.createColumn('ws-1', 'user-1', { name: 'Новая' });

      expect(prisma.board.findFirst).toHaveBeenCalledWith({
        where: { workspaceId: 'ws-1' },
        orderBy: { createdAt: 'asc' },
        select: { id: true },
      });
      expect(prisma.boardColumn.create).toHaveBeenCalledWith({
        data: { boardId: 'board-1', name: 'Новая', position: 0 },
      });
    });

    it('updates a column via board.workspaceId, not only the first board', async () => {
      prisma.boardColumn.findFirst.mockResolvedValue({
        id: 'col-on-board-2',
        boardId: 'board-2',
        name: 'Старое',
        position: 1,
      });
      prisma.boardColumn.update.mockResolvedValue({
        id: 'col-on-board-2',
        name: 'Новое',
        position: 1,
      });

      const result = await service.updateColumn('ws-1', 'col-on-board-2', 'user-1', {
        name: 'Новое',
      });

      expect(prisma.boardColumn.findFirst).toHaveBeenCalledWith({
        where: { id: 'col-on-board-2', board: { workspaceId: 'ws-1' } },
      });
      expect(result.name).toBe('Новое');
    });

    it('deletes a column scoped to its own board', async () => {
      prisma.boardColumn.findFirst.mockResolvedValue({
        id: 'col-on-board-2',
        boardId: 'board-2',
        name: 'Лишняя',
        position: 2,
      });
      prisma.boardColumn.count.mockResolvedValue(3);
      prisma.task.count.mockResolvedValue(0);
      prisma.boardColumn.findMany.mockResolvedValue([
        { id: 'col-a', position: 0 },
        { id: 'col-b', position: 1 },
      ]);

      const result = await service.deleteColumn('ws-1', 'col-on-board-2', 'user-1');

      expect(prisma.boardColumn.findFirst).toHaveBeenCalledWith({
        where: { id: 'col-on-board-2', board: { workspaceId: 'ws-1' } },
      });
      expect(prisma.boardColumn.count).toHaveBeenCalledWith({ where: { boardId: 'board-2' } });
      expect(prisma.boardColumn.delete).toHaveBeenCalledWith({ where: { id: 'col-on-board-2' } });
      expect(result).toEqual({ success: true });
    });

    it('throws when column belongs to another workspace', async () => {
      prisma.boardColumn.findFirst.mockResolvedValue(null);

      await expect(
        service.updateColumn('ws-1', 'foreign-col', 'user-1', { name: 'X' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
