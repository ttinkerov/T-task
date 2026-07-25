import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SearchService } from './search.service';

function makePrisma() {
  return {
    task: { findMany: vi.fn() },
    deal: { findMany: vi.fn() },
    comment: { findMany: vi.fn() },
  };
}

function makeWorkspacesService() {
  return {
    getWorkspaceForMember: vi.fn().mockResolvedValue({ id: 'workspace-1' }),
  };
}

describe('SearchService', () => {
  let prisma: ReturnType<typeof makePrisma>;
  let workspacesService: ReturnType<typeof makeWorkspacesService>;
  let service: SearchService;

  beforeEach(() => {
    prisma = makePrisma();
    workspacesService = makeWorkspacesService();
    service = new SearchService(prisma as never, workspacesService as never);
    prisma.deal.findMany.mockResolvedValue([]);
    prisma.comment.findMany.mockResolvedValue([]);
  });

  it('searches tasks by title or description and returns board deep links', async () => {
    prisma.task.findMany.mockResolvedValue([
      {
        id: 'task-1',
        title: 'Онбординг',
        description: 'См. чеклист в docs',
        column: { boardId: 'board-1', name: 'Todo' },
      },
      {
        id: 'task-2',
        title: 'Другое',
        description: 'Нужен онбординг нового сотрудника',
        column: { boardId: 'board-2', name: 'Doing' },
      },
    ]);

    const result = await service.search('workspace-1', 'user-1', 'онбординг', 8);

    expect(prisma.task.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: [
            { title: { contains: 'онбординг', mode: 'insensitive' } },
            { description: { contains: 'онбординг', mode: 'insensitive' } },
          ],
        }),
      }),
    );
    expect(result.tasks[0]).toMatchObject({
      id: 'task-1',
      matchIn: 'title',
      href: '/dashboard/board?board=board-1&task=task-1',
    });
    expect(result.tasks[1]).toMatchObject({
      id: 'task-2',
      matchIn: 'description',
      href: '/dashboard/board?board=board-2&task=task-2',
    });
    expect(result.tasks[1].snippet).toMatch(/онбординг/i);
  });

  it('returns empty lists for blank query', async () => {
    await expect(service.search('workspace-1', 'user-1', '  ', 8)).resolves.toEqual({
      tasks: [],
      deals: [],
      comments: [],
    });
    expect(prisma.task.findMany).not.toHaveBeenCalled();
  });
});
