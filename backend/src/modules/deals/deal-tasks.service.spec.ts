import { ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DealTasksService } from './deal-tasks.service';

function makePrisma() {
  return {
    deal: {
      findFirst: vi.fn(),
    },
    task: {
      findFirst: vi.fn(),
    },
    dealTask: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      deleteMany: vi.fn(),
    },
  };
}

function makeWorkspacesService() {
  return {
    getWorkspaceForMember: vi.fn().mockResolvedValue({ id: 'workspace-1' }),
  };
}

const deal = {
  id: 'deal-1',
  title: 'Enterprise deal',
  amount: 100_000,
  stageId: 'stage-1',
  stage: { name: 'Negotiation', funnelId: 'funnel-1' },
};

const task = {
  id: 'task-1',
  title: 'Prepare proposal',
  columnId: 'column-1',
  completedAt: null,
  column: { name: 'In progress' },
};

describe('DealTasksService', () => {
  let prisma: ReturnType<typeof makePrisma>;
  let workspacesService: ReturnType<typeof makeWorkspacesService>;
  let service: DealTasksService;

  beforeEach(() => {
    prisma = makePrisma();
    workspacesService = makeWorkspacesService();
    service = new DealTasksService(prisma as never, workspacesService as never);

    prisma.deal.findFirst.mockResolvedValue(deal);
    prisma.task.findFirst.mockResolvedValue(task);
    prisma.dealTask.findUnique.mockResolvedValue(null);
    prisma.dealTask.create.mockResolvedValue({
      dealId: 'deal-1',
      taskId: 'task-1',
      createdAt: new Date('2026-07-19T10:00:00.000Z'),
      deal,
      task,
    });
    prisma.dealTask.deleteMany.mockResolvedValue({ count: 1 });
  });

  it('links a deal and task in the same workspace', async () => {
    await expect(
      service.linkFromDeal('workspace-1', 'deal-1', 'task-1', 'user-1'),
    ).resolves.toEqual({
      dealId: 'deal-1',
      taskId: 'task-1',
      createdAt: '2026-07-19T10:00:00.000Z',
      deal: {
        id: 'deal-1',
        title: 'Enterprise deal',
        amount: 100_000,
        stageId: 'stage-1',
        stageName: 'Negotiation',
        funnelId: 'funnel-1',
      },
      task: {
        id: 'task-1',
        title: 'Prepare proposal',
        columnId: 'column-1',
        columnName: 'In progress',
        completed: false,
      },
    });

    expect(prisma.dealTask.create).toHaveBeenCalledWith({
      data: { dealId: 'deal-1', taskId: 'task-1' },
      include: expect.any(Object),
    });
  });

  it('rejects linking when the task is outside the workspace or deleted', async () => {
    prisma.task.findFirst.mockResolvedValueOnce(null);

    await expect(
      service.linkFromDeal('workspace-1', 'deal-1', 'task-external', 'user-1'),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(prisma.dealTask.create).not.toHaveBeenCalled();
  });

  it('rejects linking when the deal is outside the workspace or deleted', async () => {
    prisma.deal.findFirst.mockResolvedValueOnce(null);

    await expect(
      service.linkFromTask('workspace-1', 'task-1', 'deal-external', 'user-1'),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(prisma.dealTask.create).not.toHaveBeenCalled();
  });

  it('rejects duplicate links', async () => {
    prisma.dealTask.findUnique.mockResolvedValueOnce({
      dealId: 'deal-1',
      taskId: 'task-1',
      createdAt: new Date(),
    });

    await expect(
      service.linkFromDeal('workspace-1', 'deal-1', 'task-1', 'user-1'),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(prisma.dealTask.create).not.toHaveBeenCalled();
  });

  it('maps unique constraint races to conflict errors', async () => {
    const uniqueViolation = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
      code: 'P2002',
      clientVersion: 'test',
    });
    prisma.dealTask.create.mockRejectedValueOnce(uniqueViolation);

    await expect(
      service.linkFromTask('workspace-1', 'task-1', 'deal-1', 'user-1'),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('unlinks an existing deal-task pair', async () => {
    await expect(
      service.unlinkFromDeal('workspace-1', 'deal-1', 'task-1', 'user-1'),
    ).resolves.toEqual({ success: true });

    expect(prisma.dealTask.deleteMany).toHaveBeenCalledWith({
      where: { dealId: 'deal-1', taskId: 'task-1' },
    });
  });

  it('rejects unlink when the link does not exist', async () => {
    prisma.dealTask.deleteMany.mockResolvedValueOnce({ count: 0 });

    await expect(
      service.unlinkFromTask('workspace-1', 'task-1', 'deal-1', 'user-1'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
