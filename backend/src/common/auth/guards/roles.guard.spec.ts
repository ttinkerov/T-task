import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { WorkspaceRole } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RolesGuard } from './roles.guard';

describe('RolesGuard archive/delete gates', () => {
  let findUnique: ReturnType<typeof vi.fn>;
  let guard: RolesGuard;
  let reflector: { getAllAndOverride: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    findUnique = vi.fn();
    reflector = {
      getAllAndOverride: vi.fn().mockReturnValue([WorkspaceRole.MEMBER, WorkspaceRole.ADMIN]),
    };
    guard = new RolesGuard(
      reflector as unknown as Reflector,
      {
        workspaceMember: { findUnique },
      } as never,
    );
  });

  function context(roleNeeded = true) {
    if (!roleNeeded) {
      reflector.getAllAndOverride.mockReturnValue(undefined);
    }
    const request = {
      user: { id: 'u1' },
      params: { workspaceId: 'ws1' },
      headers: {},
    };
    return {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({ getRequest: () => request }),
      request,
    };
  }

  it('rejects members of archived workspaces', async () => {
    findUnique.mockResolvedValue({
      role: WorkspaceRole.MEMBER,
      scopes: [],
      workspace: { deletedAt: null, archivedAt: new Date() },
    });
    await expect(guard.canActivate(context() as never)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows admins on archived workspaces', async () => {
    findUnique.mockResolvedValue({
      role: WorkspaceRole.ADMIN,
      scopes: [],
      workspace: { deletedAt: null, archivedAt: new Date() },
    });
    reflector.getAllAndOverride.mockReturnValue([
      WorkspaceRole.ADMIN,
      WorkspaceRole.OWNER,
      WorkspaceRole.MEMBER,
    ]);
    await expect(guard.canActivate(context() as never)).resolves.toBe(true);
  });

  it('rejects deleted workspaces', async () => {
    findUnique.mockResolvedValue({
      role: WorkspaceRole.OWNER,
      scopes: [],
      workspace: { deletedAt: new Date(), archivedAt: null },
    });
    await expect(guard.canActivate(context() as never)).rejects.toBeInstanceOf(ForbiddenException);
  });
});
