import { NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TaskBacklinksService } from './task-backlinks.service';

function makePrisma() {
  return {
    task: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
  };
}

function makeWorkspacesService() {
  return {
    getWorkspaceForMember: vi.fn().mockResolvedValue({ id: 'workspace-1' }),
  };
}

describe('TaskBacklinksService', () => {
  let prisma: ReturnType<typeof makePrisma>;
  let workspacesService: ReturnType<typeof makeWorkspacesService>;
  let service: TaskBacklinksService;

  const taskId = 'cm12345678901234567890';

  beforeEach(() => {
    prisma = makePrisma();
    workspacesService = makeWorkspacesService();
    service = new TaskBacklinksService(prisma as never, workspacesService as never);
    prisma.task.findFirst.mockResolvedValue({ id: taskId });
    prisma.task.findMany.mockResolvedValue([
      {
        id: 'cmabcdefghijklmnopqrstuv',
        title: 'Эпик онбординга',
        column: { name: 'В работе' },
      },
    ]);
  });

  it('lists workspace tasks whose description wiki-links to the target', async () => {
    const result = await service.list('workspace-1', taskId, 'user-1');

    expect(workspacesService.getWorkspaceForMember).toHaveBeenCalledWith('workspace-1', 'user-1');
    expect(prisma.task.findMany).toHaveBeenCalledWith({
      where: {
        id: { not: taskId },
        deletedAt: null,
        description: { contains: `]](${taskId})` },
        column: { board: { workspaceId: 'workspace-1' } },
      },
      select: {
        id: true,
        title: true,
        column: { select: { name: true } },
      },
      orderBy: [{ updatedAt: 'desc' }, { id: 'asc' }],
      take: 50,
    });
    expect(result).toEqual([
      {
        id: 'cmabcdefghijklmnopqrstuv',
        title: 'Эпик онбординга',
        columnName: 'В работе',
      },
    ]);
  });

  it('rejects unknown tasks', async () => {
    prisma.task.findFirst.mockResolvedValue(null);
    await expect(service.list('workspace-1', taskId, 'user-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('rejects malformed task ids without querying descriptions', async () => {
    await expect(service.list('workspace-1', 'short', 'user-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prisma.task.findMany).not.toHaveBeenCalled();
  });
});
