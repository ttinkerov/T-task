import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SearchService } from './search.service';

function makePrisma() {
  return {
    $queryRaw: vi.fn(),
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
  });

  it('searches tasks by title or description and returns board deep links', async () => {
    prisma.$queryRaw
      .mockResolvedValueOnce([
        {
          id: 'task-1',
          title: 'Онбординг',
          description: 'См. чеклист в docs',
          board_id: 'board-1',
          column_name: 'Todo',
          rank: 1,
        },
        {
          id: 'task-2',
          title: 'Другое',
          description: 'Нужен онбординг нового сотрудника',
          board_id: 'board-2',
          column_name: 'Doing',
          rank: 0.4,
        },
      ])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const result = await service.search('workspace-1', 'user-1', 'онбординг', 8);

    expect(prisma.$queryRaw).toHaveBeenCalledTimes(3);
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
    expect(prisma.$queryRaw).not.toHaveBeenCalled();
  });
});
