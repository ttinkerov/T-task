import { createHash } from 'node:crypto';
import { NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CalendarFeedsService } from './calendar-feeds.service';

const CREATED_AT = new Date('2026-07-17T00:00:00.000Z');
const UPDATED_AT = new Date('2026-07-17T01:00:00.000Z');

function makePrisma() {
  return {
    calendarFeed: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      updateMany: vi.fn(),
    },
    workspaceMember: {
      findUnique: vi.fn(),
    },
    task: {
      findMany: vi.fn(),
    },
  };
}

function makeWorkspacesService() {
  return {
    getWorkspaceForMember: vi.fn().mockResolvedValue({
      id: 'workspace-1',
      name: 'Команда',
    }),
  };
}

function makeActivityService() {
  return {
    record: vi.fn().mockResolvedValue(undefined),
  };
}

describe('CalendarFeedsService', () => {
  let prisma: ReturnType<typeof makePrisma>;
  let workspacesService: ReturnType<typeof makeWorkspacesService>;
  let activityService: ReturnType<typeof makeActivityService>;
  let service: CalendarFeedsService;

  beforeEach(() => {
    prisma = makePrisma();
    workspacesService = makeWorkspacesService();
    activityService = makeActivityService();
    service = new CalendarFeedsService(
      prisma as never,
      workspacesService as never,
      activityService as never,
    );
  });

  it('creates a high-entropy feed token but stores only its SHA-256 hash', async () => {
    prisma.calendarFeed.upsert.mockResolvedValue({
      id: 'feed-1',
      createdAt: CREATED_AT,
      updatedAt: UPDATED_AT,
      revokedAt: null,
    });

    const result = await service.createOrRotate('workspace-1', 'user-1');
    const token = result.feedPath.match(
      /^\/api\/v1\/calendar\/feeds\/([A-Za-z0-9_-]{43})\/calendar\.ics$/,
    )?.[1];

    expect(token).toBeDefined();
    expect(prisma.calendarFeed.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          workspaceId: 'workspace-1',
          userId: 'user-1',
          tokenHash: createHash('sha256').update(token!).digest('hex'),
          tokenPrefix: token!.slice(0, 8),
        }),
        update: expect.objectContaining({
          tokenHash: createHash('sha256').update(token!).digest('hex'),
          tokenPrefix: token!.slice(0, 8),
          revokedAt: null,
        }),
      }),
    );
    expect(JSON.stringify(prisma.calendarFeed.upsert.mock.calls)).not.toContain(`"${token}"`);
    expect(activityService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceId: 'workspace-1',
        actorId: 'user-1',
        action: 'CALENDAR_FEED_ROTATED',
      }),
    );
  });

  it('returns status without exposing the private feed token', async () => {
    prisma.calendarFeed.findUnique.mockResolvedValue({
      createdAt: CREATED_AT,
      updatedAt: UPDATED_AT,
      revokedAt: null,
      tokenPrefix: 'abcdefgh',
    });

    await expect(service.getStatus('workspace-1', 'user-1')).resolves.toEqual({
      enabled: true,
      tokenPrefix: 'abcdefgh',
      createdAt: CREATED_AT.toISOString(),
      updatedAt: UPDATED_AT.toISOString(),
    });
  });

  it('revokes only the current user feed in the selected workspace', async () => {
    prisma.calendarFeed.findUnique.mockResolvedValue({ id: 'feed-1' });
    prisma.calendarFeed.updateMany.mockResolvedValue({ count: 1 });

    await expect(service.revoke('workspace-1', 'user-1')).resolves.toEqual({ success: true });
    expect(prisma.calendarFeed.updateMany).toHaveBeenCalledWith({
      where: { workspaceId: 'workspace-1', userId: 'user-1', revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    });
    expect(activityService.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'CALENDAR_FEED_REVOKED', entityId: 'feed-1' }),
    );
  });

  it('resolves an active feed to due tasks assigned to its owner in its workspace', async () => {
    const token = 'A'.repeat(43);
    prisma.calendarFeed.findUnique.mockResolvedValue({
      workspaceId: 'workspace-1',
      userId: 'user-1',
      revokedAt: null,
      workspace: { name: 'Команда', deletedAt: null, archivedAt: null },
      user: { name: 'Ирина', deletedAt: null },
    });
    prisma.workspaceMember.findUnique.mockResolvedValue({ id: 'member-1' });
    prisma.task.findMany.mockResolvedValue([
      {
        id: 'task-1',
        title: 'Дедлайн',
        dueDate: new Date('2026-07-20T12:00:00.000Z'),
        updatedAt: UPDATED_AT,
        completedAt: null,
        column: { board: { name: 'Продукт' } },
      },
    ]);

    const result = await service.getCalendar(token);

    expect(prisma.calendarFeed.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { tokenHash: createHash('sha256').update(token).digest('hex') },
      }),
    );
    expect(prisma.task.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          assigneeId: 'user-1',
          dueDate: { not: null },
          deletedAt: null,
          column: { board: { workspaceId: 'workspace-1' } },
        },
        take: 2000,
      }),
    );
    expect(result.content).toContain('SUMMARY:Дедлайн');
    expect(result.content).toContain('X-WR-CALNAME:T-task — Ирина / Команда');
  });

  it('returns the same not-found response for malformed, revoked, and orphaned feeds', async () => {
    await expect(service.getCalendar('../secret')).rejects.toBeInstanceOf(NotFoundException);

    prisma.calendarFeed.findUnique.mockResolvedValue({
      workspaceId: 'workspace-1',
      userId: 'user-1',
      revokedAt: new Date(),
      workspace: { name: 'Команда', deletedAt: null, archivedAt: null },
      user: { name: 'Ирина', deletedAt: null },
    });
    await expect(service.getCalendar('A'.repeat(43))).rejects.toBeInstanceOf(NotFoundException);

    prisma.calendarFeed.findUnique.mockResolvedValue({
      workspaceId: 'workspace-1',
      userId: 'user-1',
      revokedAt: null,
      workspace: { name: 'Команда', deletedAt: null, archivedAt: null },
      user: { name: 'Ирина', deletedAt: null },
    });
    prisma.workspaceMember.findUnique.mockResolvedValue(null);
    await expect(service.getCalendar('B'.repeat(43))).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects feeds for archived workspaces', async () => {
    prisma.calendarFeed.findUnique.mockResolvedValue({
      workspaceId: 'workspace-1',
      userId: 'user-1',
      revokedAt: null,
      workspace: { name: 'Команда', deletedAt: null, archivedAt: new Date() },
      user: { name: 'Ирина', deletedAt: null },
    });
    await expect(service.getCalendar('C'.repeat(43))).rejects.toBeInstanceOf(NotFoundException);
  });
});
