import { NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FunnelsService } from './funnels.service';

function makePrisma() {
  return {
    funnelStage: {
      findFirst: vi.fn(),
    },
    deal: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
  };
}

describe('FunnelsService — listStageDeals', () => {
  let prisma: ReturnType<typeof makePrisma>;
  let service: FunnelsService;
  const workspacesService = { getWorkspaceForMember: vi.fn().mockResolvedValue({ id: 'ws-1' }) };
  const activityService = { record: vi.fn().mockResolvedValue(undefined) };

  beforeEach(() => {
    vi.clearAllMocks();
    prisma = makePrisma();
    workspacesService.getWorkspaceForMember.mockResolvedValue({ id: 'ws-1' });
    service = new FunnelsService(
      prisma as never,
      workspacesService as never,
      activityService as never,
    );
  });

  it('returns a page of stage deals after offset', async () => {
    prisma.funnelStage.findFirst.mockResolvedValue({ id: 'stage-1' });
    prisma.deal.count.mockResolvedValue(250);
    prisma.deal.findMany.mockResolvedValue([
      {
        id: 'deal-201',
        title: 'Next deal',
        amount: 1000,
        contactName: null,
        companyName: null,
        assigneeId: null,
        position: 200,
        stageId: 'stage-1',
        createdAt: new Date('2026-07-01T00:00:00.000Z'),
        assignee: null,
      },
    ]);

    const result = await service.listStageDeals('ws-1', 'funnel-1', 'stage-1', 'user-1', 200, 100);

    expect(prisma.deal.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { stageId: 'stage-1', deletedAt: null },
        skip: 200,
        take: 100,
      }),
    );
    expect(result).toMatchObject({
      stageId: 'stage-1',
      total: 250,
      offset: 200,
      limit: 100,
      truncated: true,
    });
    expect(result.items).toHaveLength(1);
    expect(result.items[0].id).toBe('deal-201');
  });

  it('throws when stage is missing', async () => {
    prisma.funnelStage.findFirst.mockResolvedValue(null);
    await expect(
      service.listStageDeals('ws-1', 'funnel-1', 'missing', 'user-1', 0, 100),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
