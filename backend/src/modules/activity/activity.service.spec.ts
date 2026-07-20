import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { WorkspaceRole } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ActivityService } from './activity.service';
import { ActivityAction, ActivityEntityType } from './activity.types';

describe('ActivityService', () => {
  const prisma = {
    workspaceMember: {
      findUnique: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    activityLog: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
  };

  let service: ActivityService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ActivityService(prisma as never);
  });

  it('records an immutable activity entry with a provided actor snapshot', async () => {
    prisma.activityLog.create.mockResolvedValue({ id: 'log-1' });

    await service.record({
      workspaceId: 'workspace-1',
      actorId: 'user-1',
      actorName: 'Анна',
      action: ActivityAction.APP_CREATED,
      entityType: ActivityEntityType.APP,
      entityId: 'app-1',
      entityName: 'Макеты',
      metadata: {
        provider: 'FIGMA',
        token: 'must-not-be-stored',
      },
    });

    expect(prisma.user.findUnique).not.toHaveBeenCalled();
    expect(prisma.activityLog.create).toHaveBeenCalledWith({
      data: {
        workspaceId: 'workspace-1',
        actorId: 'user-1',
        actorName: 'Анна',
        action: ActivityAction.APP_CREATED,
        entityType: ActivityEntityType.APP,
        entityId: 'app-1',
        entityName: 'Макеты',
        metadata: { provider: 'FIGMA' },
      },
    });
  });

  it('swallows recording failures so business operations can continue', async () => {
    prisma.activityLog.create.mockRejectedValue(new Error('db down'));

    await expect(
      service.record({
        workspaceId: 'workspace-1',
        actorId: 'user-1',
        actorName: 'Анна',
        action: ActivityAction.APP_CREATED,
        entityType: ActivityEntityType.APP,
      }),
    ).resolves.toBeUndefined();
  });

  it('allows only workspace owners and admins to list activity', async () => {
    prisma.workspaceMember.findUnique.mockResolvedValue({
      role: WorkspaceRole.MEMBER,
      workspace: { deletedAt: null },
    });

    await expect(
      service.list('workspace-1', 'user-1', { page: 1, limit: 25 }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.activityLog.findMany).not.toHaveBeenCalled();
  });

  it('does not reveal whether an inaccessible workspace exists', async () => {
    prisma.workspaceMember.findUnique.mockResolvedValue(null);

    await expect(
      service.list('workspace-1', 'user-1', { page: 1, limit: 25 }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns newest entries with bounded pagination metadata', async () => {
    prisma.workspaceMember.findUnique.mockResolvedValue({
      role: WorkspaceRole.ADMIN,
      workspace: { deletedAt: null },
    });
    prisma.activityLog.findMany.mockResolvedValue([
      {
        id: 'log-1',
        action: ActivityAction.APP_CREATED,
        entityType: ActivityEntityType.APP,
        entityId: 'app-1',
        entityName: 'Макеты',
        actorId: 'user-1',
        actorName: 'Анна',
        metadata: { provider: 'FIGMA' },
        createdAt: new Date('2026-07-17T00:00:00.000Z'),
      },
    ]);
    prisma.activityLog.count.mockResolvedValue(26);

    const result = await service.list('workspace-1', 'user-1', { page: 2, limit: 25 });

    expect(prisma.activityLog.findMany).toHaveBeenCalledWith({
      where: { workspaceId: 'workspace-1' },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip: 25,
      take: 25,
    });
    expect(result).toEqual({
      items: [
        {
          id: 'log-1',
          action: ActivityAction.APP_CREATED,
          entityType: ActivityEntityType.APP,
          entityId: 'app-1',
          entityName: 'Макеты',
          actorId: 'user-1',
          actorName: 'Анна',
          metadata: { provider: 'FIGMA' },
          createdAt: '2026-07-17T00:00:00.000Z',
        },
      ],
      meta: { total: 26, page: 2, limit: 25 },
    });
  });
});
