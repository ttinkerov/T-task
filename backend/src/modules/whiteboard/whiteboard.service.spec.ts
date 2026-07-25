import { BadRequestException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WhiteboardService } from './whiteboard.service';

function makePrisma() {
  return {
    workspaceWhiteboard: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
  };
}

describe('WhiteboardService', () => {
  let prisma: ReturnType<typeof makePrisma>;
  let service: WhiteboardService;
  const workspacesService = {
    getWorkspaceForMember: vi.fn().mockResolvedValue({ id: 'workspace-1' }),
  };

  beforeEach(() => {
    prisma = makePrisma();
    workspacesService.getWorkspaceForMember.mockClear();
    service = new WhiteboardService(prisma as never, workspacesService as never);
  });

  it('returns empty payload when whiteboard does not exist', async () => {
    prisma.workspaceWhiteboard.findUnique.mockResolvedValue(null);

    await expect(service.get('workspace-1', 'user-1')).resolves.toEqual({
      snapshot: null,
      updatedAt: null,
      updatedBy: null,
    });
    expect(workspacesService.getWorkspaceForMember).toHaveBeenCalledWith('workspace-1', 'user-1');
  });

  it('upserts snapshot for members', async () => {
    const updatedAt = new Date('2026-07-26T00:00:00.000Z');
    prisma.workspaceWhiteboard.upsert.mockResolvedValue({
      snapshot: { document: { store: {} } },
      updatedAt,
      updatedBy: { id: 'user-1', name: 'Ada' },
    });

    const result = await service.upsert('workspace-1', 'user-1', {
      snapshot: { document: { store: {} } },
    });

    expect(prisma.workspaceWhiteboard.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { workspaceId: 'workspace-1' },
        create: expect.objectContaining({
          workspaceId: 'workspace-1',
          updatedById: 'user-1',
        }),
        update: expect.objectContaining({
          updatedById: 'user-1',
        }),
      }),
    );
    expect(result).toEqual({
      snapshot: { document: { store: {} } },
      updatedAt: updatedAt.toISOString(),
      updatedBy: { id: 'user-1', name: 'Ada' },
    });
  });

  it('rejects oversized snapshots', async () => {
    const huge = { blob: 'x'.repeat(2 * 1024 * 1024 + 1) };

    await expect(
      service.upsert('workspace-1', 'user-1', { snapshot: huge }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.workspaceWhiteboard.upsert).not.toHaveBeenCalled();
  });
});
