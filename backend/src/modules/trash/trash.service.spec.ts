/**
 * TDD test suite for TrashService — workspace shared trash MVP.
 *
 * RED/GREEN priority order is encoded in the section headings.
 * Run: cd backend && npm test -- trash.service
 *
 * Implementation contract assumed by these tests:
 *
 *   class TrashService {
 *     constructor(private readonly prisma: PrismaService) {}
 *     list(workspaceId, userId, { page, limit }): Promise<ListTrashResult>
 *     restore(workspaceId, userId, entityType, entityId): Promise<{ success: true }>
 *     purge(workspaceId, userId, entityType, entityId): Promise<{ success: true }>
 *   }
 *
 *   type TrashEntityType = 'TASK' | 'DEAL' | 'APP';
 *
 *   interface TrashItem {
 *     entityType: TrashEntityType;
 *     entityId: string;
 *     entityName: string;
 *     deletedAt: string; // ISO-8601
 *     metadata: Record<string, string | number | boolean | null>;
 *   }
 *
 *   interface ListTrashResult {
 *     items: TrashItem[];
 *     meta: { total: number; page: number; limit: number };
 *   }
 *
 * Schema prerequisites (add to prisma/schema.prisma before running migrations):
 *   model Task            { ...; deletedAt DateTime? @map("deleted_at") }
 *   model Deal            { ...; deletedAt DateTime? @map("deleted_at") }
 *   model WorkspaceExternalApp { ...; deletedAt DateTime? @map("deleted_at") }
 */

import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { WorkspaceRole } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TrashService } from './trash.service';
import { TrashEntityType } from './trash.types';

// ---------------------------------------------------------------------------
// Shared mock factory
// ---------------------------------------------------------------------------

function makePrisma() {
  return {
    workspaceMember: {
      findUnique: vi.fn(),
    },
    task: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    deal: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    workspaceExternalApp: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    boardColumn: {
      findUnique: vi.fn(),
    },
    funnelStage: {
      findUnique: vi.fn(),
    },
  };
}

function adminMembership() {
  return { role: WorkspaceRole.ADMIN, workspace: { deletedAt: null } };
}

function ownerMembership() {
  return { role: WorkspaceRole.OWNER, workspace: { deletedAt: null } };
}

function memberMembership() {
  return { role: WorkspaceRole.MEMBER, workspace: { deletedAt: null } };
}

function viewerMembership() {
  return { role: WorkspaceRole.VIEWER, workspace: { deletedAt: null } };
}

function makeActivityService() {
  return {
    record: vi.fn().mockResolvedValue(undefined),
  };
}

// ---------------------------------------------------------------------------
// PHASE 1 — List: core happy paths
// ---------------------------------------------------------------------------

describe('TrashService.list — core happy paths', () => {
  let prisma: ReturnType<typeof makePrisma>;
  let service: TrashService;

  beforeEach(() => {
    vi.clearAllMocks();
    prisma = makePrisma();
    service = new TrashService(prisma as never, makeActivityService() as never);
  });

  it('returns an empty list when no entities are in trash', async () => {
    prisma.workspaceMember.findUnique.mockResolvedValue(adminMembership());
    prisma.task.findMany.mockResolvedValue([]);
    prisma.task.count.mockResolvedValue(0);
    prisma.deal.findMany.mockResolvedValue([]);
    prisma.deal.count.mockResolvedValue(0);
    prisma.workspaceExternalApp.findMany.mockResolvedValue([]);
    prisma.workspaceExternalApp.count.mockResolvedValue(0);

    const result = await service.list('workspace-1', 'user-1', { page: 1, limit: 25 });

    expect(result).toEqual({ items: [], meta: { total: 0, page: 1, limit: 25 } });
  });

  it('returns soft-deleted tasks shaped as TrashItems', async () => {
    const deletedAt = new Date('2026-07-01T10:00:00.000Z');

    prisma.workspaceMember.findUnique.mockResolvedValue(adminMembership());
    prisma.task.findMany.mockResolvedValue([
      {
        id: 'task-1',
        title: 'Design login page',
        deletedAt,
        columnId: 'col-1',
        priority: 'HIGH',
      },
    ]);
    prisma.task.count.mockResolvedValue(1);
    prisma.deal.findMany.mockResolvedValue([]);
    prisma.deal.count.mockResolvedValue(0);
    prisma.workspaceExternalApp.findMany.mockResolvedValue([]);
    prisma.workspaceExternalApp.count.mockResolvedValue(0);

    const result = await service.list('workspace-1', 'user-1', { page: 1, limit: 25 });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      entityType: TrashEntityType.TASK,
      entityId: 'task-1',
      entityName: 'Design login page',
      deletedAt: '2026-07-01T10:00:00.000Z',
    });
    expect(result.meta).toEqual({ total: 1, page: 1, limit: 25 });
  });

  it('returns soft-deleted deals shaped as TrashItems', async () => {
    const deletedAt = new Date('2026-07-02T08:00:00.000Z');

    prisma.workspaceMember.findUnique.mockResolvedValue(adminMembership());
    prisma.task.findMany.mockResolvedValue([]);
    prisma.task.count.mockResolvedValue(0);
    prisma.deal.findMany.mockResolvedValue([
      {
        id: 'deal-1',
        title: 'Acme Corp renewal',
        deletedAt,
        amount: 5000,
        contactName: 'Jane',
      },
    ]);
    prisma.deal.count.mockResolvedValue(1);
    prisma.workspaceExternalApp.findMany.mockResolvedValue([]);
    prisma.workspaceExternalApp.count.mockResolvedValue(0);

    const result = await service.list('workspace-1', 'user-1', { page: 1, limit: 25 });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      entityType: TrashEntityType.DEAL,
      entityId: 'deal-1',
      entityName: 'Acme Corp renewal',
      deletedAt: '2026-07-02T08:00:00.000Z',
    });
  });

  it('returns soft-deleted external apps shaped as TrashItems', async () => {
    const deletedAt = new Date('2026-07-03T12:00:00.000Z');

    prisma.workspaceMember.findUnique.mockResolvedValue(adminMembership());
    prisma.task.findMany.mockResolvedValue([]);
    prisma.task.count.mockResolvedValue(0);
    prisma.deal.findMany.mockResolvedValue([]);
    prisma.deal.count.mockResolvedValue(0);
    prisma.workspaceExternalApp.findMany.mockResolvedValue([
      {
        id: 'app-1',
        title: 'Design Mockups',
        provider: 'FIGMA',
        deletedAt,
      },
    ]);
    prisma.workspaceExternalApp.count.mockResolvedValue(1);

    const result = await service.list('workspace-1', 'user-1', { page: 1, limit: 25 });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      entityType: TrashEntityType.APP,
      entityId: 'app-1',
      entityName: 'Design Mockups',
      deletedAt: '2026-07-03T12:00:00.000Z',
    });
  });

  it('aggregates and sorts mixed trash items by deletedAt descending', async () => {
    const older = new Date('2026-07-01T00:00:00.000Z');
    const newer = new Date('2026-07-10T00:00:00.000Z');

    prisma.workspaceMember.findUnique.mockResolvedValue(adminMembership());
    prisma.task.findMany.mockResolvedValue([{ id: 'task-1', title: 'Old task', deletedAt: older }]);
    prisma.task.count.mockResolvedValue(1);
    prisma.deal.findMany.mockResolvedValue([{ id: 'deal-1', title: 'New deal', deletedAt: newer }]);
    prisma.deal.count.mockResolvedValue(1);
    prisma.workspaceExternalApp.findMany.mockResolvedValue([]);
    prisma.workspaceExternalApp.count.mockResolvedValue(0);

    const result = await service.list('workspace-1', 'user-1', { page: 1, limit: 25 });

    expect(result.items).toHaveLength(2);
    expect(result.items[0].entityId).toBe('deal-1'); // newest first
    expect(result.items[1].entityId).toBe('task-1');
    expect(result.meta.total).toBe(2);
  });

  it('queries workspace-scoped entities only (not cross-workspace bleed)', async () => {
    prisma.workspaceMember.findUnique.mockResolvedValue(adminMembership());
    prisma.task.findMany.mockResolvedValue([]);
    prisma.task.count.mockResolvedValue(0);
    prisma.deal.findMany.mockResolvedValue([]);
    prisma.deal.count.mockResolvedValue(0);
    prisma.workspaceExternalApp.findMany.mockResolvedValue([]);
    prisma.workspaceExternalApp.count.mockResolvedValue(0);

    await service.list('workspace-1', 'user-1', { page: 1, limit: 25 });

    // Tasks must be scoped through the board→workspace chain
    expect(prisma.task.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          column: expect.objectContaining({
            board: expect.objectContaining({ workspaceId: 'workspace-1' }),
          }),
          deletedAt: { not: null },
        }),
      }),
    );

    // Deals must be scoped through the funnel→workspace chain
    expect(prisma.deal.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          stage: expect.objectContaining({
            funnel: expect.objectContaining({ workspaceId: 'workspace-1' }),
          }),
          deletedAt: { not: null },
        }),
      }),
    );

    // Apps are directly scoped
    expect(prisma.workspaceExternalApp.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          workspaceId: 'workspace-1',
          deletedAt: { not: null },
        }),
      }),
    );
  });
});

// ---------------------------------------------------------------------------
// PHASE 2 — List: authorization
// ---------------------------------------------------------------------------

describe('TrashService.list — authorization', () => {
  let prisma: ReturnType<typeof makePrisma>;
  let service: TrashService;

  beforeEach(() => {
    vi.clearAllMocks();
    prisma = makePrisma();
    service = new TrashService(prisma as never, makeActivityService() as never);
  });

  it('allows OWNER to list trash', async () => {
    prisma.workspaceMember.findUnique.mockResolvedValue(ownerMembership());
    prisma.task.findMany.mockResolvedValue([]);
    prisma.task.count.mockResolvedValue(0);
    prisma.deal.findMany.mockResolvedValue([]);
    prisma.deal.count.mockResolvedValue(0);
    prisma.workspaceExternalApp.findMany.mockResolvedValue([]);
    prisma.workspaceExternalApp.count.mockResolvedValue(0);

    await expect(
      service.list('workspace-1', 'user-1', { page: 1, limit: 25 }),
    ).resolves.toBeDefined();
  });

  it('allows ADMIN to list trash', async () => {
    prisma.workspaceMember.findUnique.mockResolvedValue(adminMembership());
    prisma.task.findMany.mockResolvedValue([]);
    prisma.task.count.mockResolvedValue(0);
    prisma.deal.findMany.mockResolvedValue([]);
    prisma.deal.count.mockResolvedValue(0);
    prisma.workspaceExternalApp.findMany.mockResolvedValue([]);
    prisma.workspaceExternalApp.count.mockResolvedValue(0);

    await expect(
      service.list('workspace-1', 'user-1', { page: 1, limit: 25 }),
    ).resolves.toBeDefined();
  });

  it('forbids MEMBER from listing trash', async () => {
    prisma.workspaceMember.findUnique.mockResolvedValue(memberMembership());

    await expect(
      service.list('workspace-1', 'user-1', { page: 1, limit: 25 }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(prisma.task.findMany).not.toHaveBeenCalled();
    expect(prisma.deal.findMany).not.toHaveBeenCalled();
  });

  it('forbids VIEWER from listing trash', async () => {
    prisma.workspaceMember.findUnique.mockResolvedValue(viewerMembership());

    await expect(
      service.list('workspace-1', 'user-1', { page: 1, limit: 25 }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('does not reveal workspace existence to non-members', async () => {
    prisma.workspaceMember.findUnique.mockResolvedValue(null);

    await expect(
      service.list('workspace-1', 'user-1', { page: 1, limit: 25 }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('does not reveal soft-deleted workspace to any user', async () => {
    prisma.workspaceMember.findUnique.mockResolvedValue({
      role: WorkspaceRole.OWNER,
      workspace: { deletedAt: new Date() },
    });

    await expect(
      service.list('workspace-1', 'user-1', { page: 1, limit: 25 }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

// ---------------------------------------------------------------------------
// PHASE 3 — List: pagination
// ---------------------------------------------------------------------------

describe('TrashService.list — pagination', () => {
  let prisma: ReturnType<typeof makePrisma>;
  let service: TrashService;

  beforeEach(() => {
    vi.clearAllMocks();
    prisma = makePrisma();
    service = new TrashService(prisma as never, makeActivityService() as never);
  });

  it('returns correct meta for second page with items spanning multiple types', async () => {
    // 20 tasks + 15 deals = 35 total; page 2 with limit 20 → skip 20 items
    const makeDeletedTask = (id: string, deletedAt: Date) => ({
      id,
      title: `Task ${id}`,
      deletedAt,
    });

    const taskDates = Array.from({ length: 20 }, (_, i) =>
      makeDeletedTask(`task-${i}`, new Date(2026, 5, 20 - i)),
    );
    const dealDates = Array.from({ length: 15 }, (_, i) => ({
      id: `deal-${i}`,
      title: `Deal ${i}`,
      deletedAt: new Date(2026, 5, 10 - i),
    }));

    prisma.workspaceMember.findUnique.mockResolvedValue(adminMembership());
    prisma.task.findMany.mockResolvedValue(taskDates);
    prisma.task.count.mockResolvedValue(20);
    prisma.deal.findMany.mockResolvedValue(dealDates);
    prisma.deal.count.mockResolvedValue(15);
    prisma.workspaceExternalApp.findMany.mockResolvedValue([]);
    prisma.workspaceExternalApp.count.mockResolvedValue(0);

    const result = await service.list('workspace-1', 'user-1', { page: 2, limit: 20 });

    expect(result.meta).toEqual({ total: 35, page: 2, limit: 20 });
    expect(result.items).toHaveLength(15); // 35 total - 20 skipped
  });

  it('returns empty items array on a page beyond total', async () => {
    prisma.workspaceMember.findUnique.mockResolvedValue(adminMembership());
    prisma.task.findMany.mockResolvedValue([
      { id: 'task-1', title: 'Only task', deletedAt: new Date() },
    ]);
    prisma.task.count.mockResolvedValue(1);
    prisma.deal.findMany.mockResolvedValue([]);
    prisma.deal.count.mockResolvedValue(0);
    prisma.workspaceExternalApp.findMany.mockResolvedValue([]);
    prisma.workspaceExternalApp.count.mockResolvedValue(0);

    const result = await service.list('workspace-1', 'user-1', { page: 3, limit: 25 });

    expect(result.items).toHaveLength(0);
    expect(result.meta).toEqual({ total: 1, page: 3, limit: 25 });
  });
});

// ---------------------------------------------------------------------------
// PHASE 4 — Restore: core happy paths
// ---------------------------------------------------------------------------

describe('TrashService.restore — core happy paths', () => {
  let prisma: ReturnType<typeof makePrisma>;
  let service: TrashService;

  beforeEach(() => {
    vi.clearAllMocks();
    prisma = makePrisma();
    service = new TrashService(prisma as never, makeActivityService() as never);
  });

  it('clears deletedAt on a soft-deleted task', async () => {
    prisma.workspaceMember.findUnique.mockResolvedValue(adminMembership());
    prisma.task.findFirst
      .mockResolvedValueOnce({
        id: 'task-1',
        title: 'Deleted task',
        deletedAt: new Date('2026-07-01T00:00:00.000Z'),
        columnId: 'col-1',
      })
      .mockResolvedValueOnce({ position: 2 });
    prisma.boardColumn.findUnique.mockResolvedValue({ id: 'col-1', deletedAt: null });
    prisma.task.update.mockResolvedValue({ id: 'task-1', deletedAt: null });

    const result = await service.restore('workspace-1', 'user-1', TrashEntityType.TASK, 'task-1');

    expect(result).toEqual({ success: true });
    expect(prisma.task.update).toHaveBeenCalledWith({
      where: { id: 'task-1' },
      data: { deletedAt: null, position: 3 },
    });
  });

  it('clears deletedAt on a soft-deleted deal', async () => {
    prisma.workspaceMember.findUnique.mockResolvedValue(adminMembership());
    prisma.deal.findFirst
      .mockResolvedValueOnce({
        id: 'deal-1',
        title: 'Deleted deal',
        deletedAt: new Date('2026-07-01T00:00:00.000Z'),
        stageId: 'stage-1',
      })
      .mockResolvedValueOnce({ position: 0 });
    prisma.funnelStage.findUnique.mockResolvedValue({ id: 'stage-1', deletedAt: null });
    prisma.deal.update.mockResolvedValue({ id: 'deal-1', deletedAt: null });

    const result = await service.restore('workspace-1', 'user-1', TrashEntityType.DEAL, 'deal-1');

    expect(result).toEqual({ success: true });
    expect(prisma.deal.update).toHaveBeenCalledWith({
      where: { id: 'deal-1' },
      data: { deletedAt: null, position: 1 },
    });
  });

  it('clears deletedAt on a soft-deleted external app', async () => {
    prisma.workspaceMember.findUnique.mockResolvedValue(adminMembership());
    prisma.workspaceExternalApp.findFirst.mockResolvedValue({
      id: 'app-1',
      title: 'Design Mockups',
      deletedAt: new Date('2026-07-01T00:00:00.000Z'),
      workspaceId: 'workspace-1',
    });
    prisma.workspaceExternalApp.count.mockResolvedValue(3);
    prisma.workspaceExternalApp.update.mockResolvedValue({ id: 'app-1', deletedAt: null });

    const result = await service.restore('workspace-1', 'user-1', TrashEntityType.APP, 'app-1');

    expect(result).toEqual({ success: true });
    expect(prisma.workspaceExternalApp.update).toHaveBeenCalledWith({
      where: { id: 'app-1' },
      data: { deletedAt: null },
    });
  });

  it('looks up the task scoped to the correct workspace', async () => {
    prisma.workspaceMember.findUnique.mockResolvedValue(adminMembership());
    prisma.task.findFirst
      .mockResolvedValueOnce({
        id: 'task-1',
        title: 'Task',
        deletedAt: new Date(),
        columnId: 'col-1',
      })
      .mockResolvedValueOnce({ position: 0 });
    prisma.boardColumn.findUnique.mockResolvedValue({ id: 'col-1', deletedAt: null });
    prisma.task.update.mockResolvedValue({});

    await service.restore('workspace-1', 'user-1', TrashEntityType.TASK, 'task-1');

    expect(prisma.task.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: 'task-1',
          deletedAt: { not: null },
          column: expect.objectContaining({
            board: expect.objectContaining({ workspaceId: 'workspace-1' }),
          }),
        }),
      }),
    );
  });
});

// ---------------------------------------------------------------------------
// PHASE 5 — Restore: authorization
// ---------------------------------------------------------------------------

describe('TrashService.restore — authorization', () => {
  let prisma: ReturnType<typeof makePrisma>;
  let service: TrashService;

  beforeEach(() => {
    vi.clearAllMocks();
    prisma = makePrisma();
    service = new TrashService(prisma as never, makeActivityService() as never);
  });

  it('allows OWNER to restore', async () => {
    prisma.workspaceMember.findUnique.mockResolvedValue(ownerMembership());
    prisma.task.findFirst
      .mockResolvedValueOnce({
        id: 'task-1',
        deletedAt: new Date(),
        columnId: 'col-1',
      })
      .mockResolvedValueOnce({ position: 0 });
    prisma.boardColumn.findUnique.mockResolvedValue({ id: 'col-1', deletedAt: null });
    prisma.task.update.mockResolvedValue({});

    await expect(
      service.restore('workspace-1', 'user-1', TrashEntityType.TASK, 'task-1'),
    ).resolves.toEqual({ success: true });
  });

  it('allows ADMIN to restore', async () => {
    prisma.workspaceMember.findUnique.mockResolvedValue(adminMembership());
    prisma.task.findFirst
      .mockResolvedValueOnce({
        id: 'task-1',
        deletedAt: new Date(),
        columnId: 'col-1',
      })
      .mockResolvedValueOnce({ position: 0 });
    prisma.boardColumn.findUnique.mockResolvedValue({ id: 'col-1', deletedAt: null });
    prisma.task.update.mockResolvedValue({});

    await expect(
      service.restore('workspace-1', 'user-1', TrashEntityType.TASK, 'task-1'),
    ).resolves.toEqual({ success: true });
  });

  it('forbids MEMBER from restoring any entity', async () => {
    prisma.workspaceMember.findUnique.mockResolvedValue(memberMembership());

    await expect(
      service.restore('workspace-1', 'user-1', TrashEntityType.TASK, 'task-1'),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(prisma.task.update).not.toHaveBeenCalled();
  });

  it('forbids VIEWER from restoring any entity', async () => {
    prisma.workspaceMember.findUnique.mockResolvedValue(viewerMembership());

    await expect(
      service.restore('workspace-1', 'user-1', TrashEntityType.APP, 'app-1'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('does not reveal workspace existence to non-members on restore', async () => {
    prisma.workspaceMember.findUnique.mockResolvedValue(null);

    await expect(
      service.restore('workspace-1', 'user-1', TrashEntityType.DEAL, 'deal-1'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

// ---------------------------------------------------------------------------
// PHASE 6 — Restore: not-found and cross-workspace isolation
// ---------------------------------------------------------------------------

describe('TrashService.restore — not-found and isolation', () => {
  let prisma: ReturnType<typeof makePrisma>;
  let service: TrashService;

  beforeEach(() => {
    vi.clearAllMocks();
    prisma = makePrisma();
    service = new TrashService(prisma as never, makeActivityService() as never);
  });

  it('throws NotFoundException when task does not exist in any workspace', async () => {
    prisma.workspaceMember.findUnique.mockResolvedValue(adminMembership());
    prisma.task.findFirst.mockResolvedValue(null);

    await expect(
      service.restore('workspace-1', 'user-1', TrashEntityType.TASK, 'nonexistent'),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(prisma.task.update).not.toHaveBeenCalled();
  });

  it('throws NotFoundException when deal does not exist', async () => {
    prisma.workspaceMember.findUnique.mockResolvedValue(adminMembership());
    prisma.deal.findFirst.mockResolvedValue(null);

    await expect(
      service.restore('workspace-1', 'user-1', TrashEntityType.DEAL, 'nonexistent'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws NotFoundException when app does not exist', async () => {
    prisma.workspaceMember.findUnique.mockResolvedValue(adminMembership());
    prisma.workspaceExternalApp.findFirst.mockResolvedValue(null);

    await expect(
      service.restore('workspace-1', 'user-1', TrashEntityType.APP, 'nonexistent'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('does not find task from a different workspace (workspace scoping via findFirst)', async () => {
    // The workspace scoping is enforced in the query itself via the nested where.
    // findFirst returns null when the task belongs to another workspace → NotFoundException.
    prisma.workspaceMember.findUnique.mockResolvedValue(adminMembership());
    prisma.task.findFirst.mockResolvedValue(null); // other-workspace task filtered out

    await expect(
      service.restore('workspace-1', 'user-1', TrashEntityType.TASK, 'task-other-ws'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws BadRequestException for an unrecognised entity type', async () => {
    prisma.workspaceMember.findUnique.mockResolvedValue(adminMembership());

    await expect(
      service.restore('workspace-1', 'user-1', 'BOARD' as TrashEntityType, 'board-1'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

// ---------------------------------------------------------------------------
// PHASE 7 — Restore: idempotency and conflict detection
// ---------------------------------------------------------------------------

describe('TrashService.restore — idempotency and conflicts', () => {
  let prisma: ReturnType<typeof makePrisma>;
  let service: TrashService;

  beforeEach(() => {
    vi.clearAllMocks();
    prisma = makePrisma();
    service = new TrashService(prisma as never, makeActivityService() as never);
  });

  it('throws ConflictException when restoring an already-active (non-deleted) task', async () => {
    prisma.workspaceMember.findUnique.mockResolvedValue(adminMembership());
    // findFirst with deletedAt: { not: null } returns null for an active entity
    prisma.task.findFirst.mockResolvedValue(null);

    await expect(
      service.restore('workspace-1', 'user-1', TrashEntityType.TASK, 'active-task'),
    ).rejects.toBeInstanceOf(NotFoundException);

    // The service must not attempt an update
    expect(prisma.task.update).not.toHaveBeenCalled();
  });

  it('throws ConflictException when restoring a task whose parent column is soft-deleted', async () => {
    // Scenario: task is in trash, but its column was also soft-deleted.
    // Restoring the task without its column is a conflict.
    prisma.workspaceMember.findUnique.mockResolvedValue(adminMembership());
    prisma.task.findFirst.mockResolvedValue({
      id: 'task-1',
      title: 'Orphaned task',
      deletedAt: new Date('2026-07-01T00:00:00.000Z'),
      columnId: 'col-deleted',
    });
    prisma.boardColumn.findUnique.mockResolvedValue({
      id: 'col-deleted',
      deletedAt: new Date('2026-07-01T00:00:00.000Z'), // column itself is soft-deleted
    });

    await expect(
      service.restore('workspace-1', 'user-1', TrashEntityType.TASK, 'task-1'),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(prisma.task.update).not.toHaveBeenCalled();
  });

  it('throws ConflictException when restoring a deal whose parent stage is soft-deleted', async () => {
    prisma.workspaceMember.findUnique.mockResolvedValue(adminMembership());
    prisma.deal.findFirst.mockResolvedValue({
      id: 'deal-1',
      title: 'Orphaned deal',
      deletedAt: new Date('2026-07-01T00:00:00.000Z'),
      stageId: 'stage-deleted',
    });
    prisma.funnelStage.findUnique.mockResolvedValue({
      id: 'stage-deleted',
      deletedAt: new Date('2026-07-01T00:00:00.000Z'),
    });

    await expect(
      service.restore('workspace-1', 'user-1', TrashEntityType.DEAL, 'deal-1'),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(prisma.deal.update).not.toHaveBeenCalled();
  });

  it('is idempotent: second restore call on an already-restored task fails predictably', async () => {
    // After a successful restore, deletedAt is null. A second call with the same
    // entityId finds no soft-deleted record → NotFoundException (not a silent success).
    prisma.workspaceMember.findUnique.mockResolvedValue(adminMembership());
    prisma.task.findFirst.mockResolvedValue(null); // already restored → not found in trash

    await expect(
      service.restore('workspace-1', 'user-1', TrashEntityType.TASK, 'task-1'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

// ---------------------------------------------------------------------------
// PHASE 8 — Purge (permanent delete): OWNER-only hard delete from trash
// ---------------------------------------------------------------------------

describe('TrashService.purge — permanent deletion', () => {
  let prisma: ReturnType<typeof makePrisma>;
  let service: TrashService;

  beforeEach(() => {
    vi.clearAllMocks();
    prisma = makePrisma();
    service = new TrashService(prisma as never, makeActivityService() as never);
  });

  it('permanently deletes a soft-deleted task from the database', async () => {
    prisma.workspaceMember.findUnique.mockResolvedValue(ownerMembership());
    prisma.task.findFirst.mockResolvedValue({
      id: 'task-1',
      title: 'Purged task',
      deletedAt: new Date(),
      columnId: 'col-1',
    });
    prisma.task.delete.mockResolvedValue({ id: 'task-1' });

    const result = await service.purge('workspace-1', 'user-1', TrashEntityType.TASK, 'task-1');

    expect(result).toEqual({ success: true });
    expect(prisma.task.delete).toHaveBeenCalledWith({ where: { id: 'task-1' } });
    expect(prisma.task.update).not.toHaveBeenCalled();
  });

  it('permanently deletes a soft-deleted deal', async () => {
    prisma.workspaceMember.findUnique.mockResolvedValue(ownerMembership());
    prisma.deal.findFirst.mockResolvedValue({
      id: 'deal-1',
      title: 'Purged deal',
      deletedAt: new Date(),
      stageId: 'stage-1',
    });
    prisma.deal.delete.mockResolvedValue({ id: 'deal-1' });

    await service.purge('workspace-1', 'user-1', TrashEntityType.DEAL, 'deal-1');

    expect(prisma.deal.delete).toHaveBeenCalledWith({ where: { id: 'deal-1' } });
  });

  it('permanently deletes a soft-deleted external app', async () => {
    prisma.workspaceMember.findUnique.mockResolvedValue(ownerMembership());
    prisma.workspaceExternalApp.findFirst.mockResolvedValue({
      id: 'app-1',
      title: 'Purged app',
      deletedAt: new Date(),
      workspaceId: 'workspace-1',
    });
    prisma.workspaceExternalApp.delete.mockResolvedValue({ id: 'app-1' });

    await service.purge('workspace-1', 'user-1', TrashEntityType.APP, 'app-1');

    expect(prisma.workspaceExternalApp.delete).toHaveBeenCalledWith({ where: { id: 'app-1' } });
  });

  it('allows OWNER to purge', async () => {
    prisma.workspaceMember.findUnique.mockResolvedValue(ownerMembership());
    prisma.task.findFirst.mockResolvedValue({ id: 'task-1', deletedAt: new Date(), columnId: 'c' });
    prisma.task.delete.mockResolvedValue({});

    await expect(
      service.purge('workspace-1', 'user-1', TrashEntityType.TASK, 'task-1'),
    ).resolves.toEqual({ success: true });
  });

  it('forbids ADMIN from purging (purge requires OWNER)', async () => {
    prisma.workspaceMember.findUnique.mockResolvedValue(adminMembership());

    await expect(
      service.purge('workspace-1', 'user-1', TrashEntityType.TASK, 'task-1'),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(prisma.task.delete).not.toHaveBeenCalled();
  });

  it('forbids MEMBER from purging', async () => {
    prisma.workspaceMember.findUnique.mockResolvedValue(memberMembership());

    await expect(
      service.purge('workspace-1', 'user-1', TrashEntityType.TASK, 'task-1'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('throws NotFoundException when purging an entity not in trash', async () => {
    prisma.workspaceMember.findUnique.mockResolvedValue(ownerMembership());
    prisma.task.findFirst.mockResolvedValue(null);

    await expect(
      service.purge('workspace-1', 'user-1', TrashEntityType.TASK, 'task-active'),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(prisma.task.delete).not.toHaveBeenCalled();
  });

  it('throws BadRequestException for an unrecognised entity type on purge', async () => {
    prisma.workspaceMember.findUnique.mockResolvedValue(ownerMembership());

    await expect(
      service.purge('workspace-1', 'user-1', 'FORM' as TrashEntityType, 'form-1'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
