import { ForbiddenException } from '@nestjs/common';
import { WorkspaceRole } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WorkspacesService } from './workspaces.service';

type Membership = { role: WorkspaceRole; userId: string };

function makePrisma() {
  return {
    workspaceMember: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    workspace: {
      update: vi.fn(),
      findUnique: vi.fn(),
    },
    user: { findUnique: vi.fn() },
    invitation: { findFirst: vi.fn(), findUnique: vi.fn() },
    $transaction: vi.fn(),
  };
}

function stubMembership(
  service: WorkspacesService,
  resolve: (workspaceId: string, userId: string) => Membership | Promise<Membership>,
) {
  vi.spyOn(
    service as unknown as {
      getMembership: (workspaceId: string, userId: string) => Promise<Membership>;
    },
    'getMembership',
  ).mockImplementation(async (workspaceId, userId) => resolve(workspaceId, userId));
}

describe('WorkspacesService.updateMemberRole authz', () => {
  let prisma: ReturnType<typeof makePrisma>;
  let service: WorkspacesService;

  beforeEach(() => {
    prisma = makePrisma();
    service = new WorkspacesService(
      prisma as never,
      { record: vi.fn() } as never,
      {} as never,
      { getClient: () => ({ get: vi.fn(), setex: vi.fn(), del: vi.fn() }) } as never,
    );

    stubMembership(service, async (_workspaceId, userId) => {
      if (userId === 'admin-user') {
        return { role: WorkspaceRole.ADMIN, userId: 'admin-user' };
      }
      if (userId === 'owner-user') {
        return { role: WorkspaceRole.OWNER, userId: 'owner-user' };
      }
      return { role: WorkspaceRole.MEMBER, userId };
    });
  });

  it('forbids ADMIN from demoting an OWNER', async () => {
    prisma.workspaceMember.findFirst.mockResolvedValue({
      id: 'member-owner',
      workspaceId: 'ws-1',
      userId: 'owner-user',
      role: WorkspaceRole.OWNER,
    });

    await expect(
      service.updateMemberRole('ws-1', 'admin-user', 'member-owner', {
        role: WorkspaceRole.MEMBER,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('forbids ADMIN from changing a peer ADMIN', async () => {
    prisma.workspaceMember.findFirst.mockResolvedValue({
      id: 'member-admin-2',
      workspaceId: 'ws-1',
      userId: 'other-admin',
      role: WorkspaceRole.ADMIN,
    });

    await expect(
      service.updateMemberRole('ws-1', 'admin-user', 'member-admin-2', {
        role: WorkspaceRole.MEMBER,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows OWNER to demote an ADMIN', async () => {
    prisma.workspaceMember.findFirst.mockResolvedValue({
      id: 'member-admin',
      workspaceId: 'ws-1',
      userId: 'admin-user',
      role: WorkspaceRole.ADMIN,
    });
    prisma.$transaction.mockImplementation(async (callback) =>
      callback({
        workspaceMember: {
          update: vi.fn().mockResolvedValue({
            id: 'member-admin',
            userId: 'admin-user',
            role: WorkspaceRole.MEMBER,
            joinedAt: new Date(),
            user: { id: 'admin-user', email: 'a@x.com', name: 'Admin', avatarUrl: null },
          }),
        },
        workspace: { update: vi.fn() },
      }),
    );

    const result = await service.updateMemberRole('ws-1', 'owner-user', 'member-admin', {
      role: WorkspaceRole.MEMBER,
    });

    expect(result.role).toBe(WorkspaceRole.MEMBER);
  });
});

describe('WorkspacesService.createInvitation authz', () => {
  let prisma: ReturnType<typeof makePrisma>;
  let service: WorkspacesService;

  beforeEach(() => {
    prisma = makePrisma();
    service = new WorkspacesService(
      prisma as never,
      { record: vi.fn() } as never,
      { emit: vi.fn() } as never,
      { getClient: () => ({ get: vi.fn(), setex: vi.fn(), del: vi.fn() }) } as never,
    );

    stubMembership(service, async (_workspaceId, userId) => {
      if (userId === 'admin-user') {
        return { role: WorkspaceRole.ADMIN, userId: 'admin-user' };
      }
      return { role: WorkspaceRole.OWNER, userId: 'owner-user' };
    });
  });

  it('forbids ADMIN from inviting another ADMIN', async () => {
    await expect(
      service.createInvitation('ws-1', 'admin-user', {
        email: 'peer@x.com',
        role: WorkspaceRole.ADMIN,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});

describe('WorkspacesService invitation lifecycle', () => {
  it('rejects accept when workspace is deleted or archived', async () => {
    const { NotFoundException } = await import('@nestjs/common');
    const prisma = makePrisma();
    prisma.invitation.findUnique.mockResolvedValue({
      id: 'inv-1',
      workspaceId: 'ws-1',
      email: 'a@x.com',
      role: WorkspaceRole.MEMBER,
      revokedAt: null,
      acceptedAt: null,
      expiresAt: new Date(Date.now() + 86_400_000),
      workspace: {
        id: 'ws-1',
        name: 'Gone',
        slug: 'gone',
        deletedAt: new Date(),
        archivedAt: null,
      },
    });
    const service = new WorkspacesService(
      prisma as never,
      { record: vi.fn() } as never,
      { emit: vi.fn() } as never,
      { getClient: () => ({ get: vi.fn(), setex: vi.fn(), del: vi.fn() }) } as never,
    );

    await expect(service.acceptInvitation('tok', 'user-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prisma.$transaction).not.toHaveBeenCalled();

    prisma.invitation.findUnique.mockResolvedValue({
      id: 'inv-2',
      workspaceId: 'ws-1',
      email: 'a@x.com',
      role: WorkspaceRole.MEMBER,
      revokedAt: null,
      acceptedAt: null,
      expiresAt: new Date(Date.now() + 86_400_000),
      workspace: {
        id: 'ws-1',
        name: 'Frozen',
        slug: 'frozen',
        deletedAt: null,
        archivedAt: new Date(),
      },
    });

    await expect(service.acceptInvitation('tok2', 'user-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
