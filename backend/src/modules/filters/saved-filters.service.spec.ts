import { BadRequestException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SavedFiltersService } from './saved-filters.service';

function makePrisma() {
  return {
    savedFilter: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
    },
    $transaction: vi.fn(),
  };
}

describe('SavedFiltersService', () => {
  let prisma: ReturnType<typeof makePrisma>;
  let service: SavedFiltersService;

  beforeEach(() => {
    prisma = makePrisma();
    service = new SavedFiltersService(
      prisma as never,
      { getWorkspaceForMember: vi.fn().mockResolvedValue({ id: 'workspace-1' }) } as never,
    );
    prisma.$transaction.mockImplementation(async (fn: (tx: typeof prisma) => Promise<unknown>) =>
      fn(prisma),
    );
  });

  it('lists filters for the current user and optional view', async () => {
    prisma.savedFilter.findMany.mockResolvedValue([]);
    await service.list('workspace-1', 'user-1', 'BOARD');
    expect(prisma.savedFilter.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { workspaceId: 'workspace-1', userId: 'user-1', view: 'BOARD' },
      }),
    );
  });

  it('rejects empty filter names', async () => {
    await expect(
      service.create('workspace-1', 'user-1', {
        view: 'BOARD',
        name: '   ',
        filters: {},
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('clears previous default when creating a default filter', async () => {
    prisma.savedFilter.create.mockResolvedValue({
      id: 'f1',
      view: 'BOARD',
      name: 'Мои',
      filters: { myTasksOnly: true },
      isDefault: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await service.create('workspace-1', 'user-1', {
      view: 'BOARD',
      name: 'Мои',
      filters: { myTasksOnly: true },
      isDefault: true,
    });

    expect(prisma.savedFilter.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ isDefault: true, view: 'BOARD' }),
        data: { isDefault: false },
      }),
    );
  });
});
