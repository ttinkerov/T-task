import { BadRequestException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TaskAttachmentsService } from './task-attachments.service';

function makePrisma() {
  return {
    task: { findFirst: vi.fn() },
    taskAttachment: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
  };
}

describe('TaskAttachmentsService', () => {
  let prisma: ReturnType<typeof makePrisma>;
  let service: TaskAttachmentsService;

  beforeEach(() => {
    prisma = makePrisma();
    service = new TaskAttachmentsService(
      prisma as never,
      { getWorkspaceForMember: vi.fn().mockResolvedValue({ id: 'workspace-1' }) } as never,
      { get: vi.fn().mockReturnValue(undefined) } as never,
    );
    prisma.task.findFirst.mockResolvedValue({ id: 'task-1' });
  });

  it('rejects oversized or disallowed mime types', async () => {
    await expect(
      service.upload('workspace-1', 'task-1', 'user-1', {
        originalname: 'virus.exe',
        mimetype: 'application/x-msdownload',
        size: 100,
        buffer: Buffer.from('x'),
      } as Express.Multer.File),
    ).rejects.toBeInstanceOf(BadRequestException);

    await expect(
      service.upload('workspace-1', 'task-1', 'user-1', {
        originalname: 'fake.png',
        mimetype: 'image/png',
        size: 100,
        buffer: Buffer.from('not-a-png'),
      } as Express.Multer.File),
    ).rejects.toBeInstanceOf(BadRequestException);

    await expect(
      service.upload('workspace-1', 'task-1', 'user-1', {
        originalname: 'big.png',
        mimetype: 'image/png',
        size: 6 * 1024 * 1024,
        buffer: Buffer.alloc(10),
      } as Express.Multer.File),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws when task is missing', async () => {
    prisma.task.findFirst.mockResolvedValueOnce(null);
    await expect(service.list('workspace-1', 'missing', 'user-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
