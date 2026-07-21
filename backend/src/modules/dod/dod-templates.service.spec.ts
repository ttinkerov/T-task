import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DodTemplatesService } from './dod-templates.service';

function makePrisma() {
  const prisma = {
    dodTemplate: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    dodTemplateItem: {
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
    $transaction: vi.fn(),
  };
  prisma.$transaction.mockImplementation(
    async (callback: (tx: typeof prisma) => Promise<unknown>) => callback(prisma),
  );
  return prisma;
}

describe('DodTemplatesService', () => {
  let prisma: ReturnType<typeof makePrisma>;
  let service: DodTemplatesService;

  beforeEach(() => {
    prisma = makePrisma();
    service = new DodTemplatesService(
      prisma as never,
      { getWorkspaceForMember: vi.fn().mockResolvedValue({ id: 'workspace-1' }) } as never,
    );
  });

  it('creates a template with normalized items', async () => {
    prisma.dodTemplate.findFirst.mockResolvedValue(null);
    prisma.dodTemplate.create.mockResolvedValue({
      id: 'tpl-1',
      workspaceId: 'workspace-1',
      name: 'Default DoD',
      gatesCompletion: true,
      position: 0,
      createdAt: new Date('2026-07-21T00:00:00.000Z'),
      updatedAt: new Date('2026-07-21T00:00:00.000Z'),
      items: [
        { id: 'i1', text: 'Tests', position: 0 },
        { id: 'i2', text: 'Review', position: 1 },
      ],
    });

    const result = await service.create('workspace-1', 'user-1', {
      name: 'Default DoD',
      items: [' Tests ', '', 'Review'],
    });

    expect(prisma.dodTemplate.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: 'Default DoD',
          items: {
            create: [
              { text: 'Tests', position: 0 },
              { text: 'Review', position: 1 },
            ],
          },
        }),
      }),
    );
    expect(result.items).toHaveLength(2);
  });

  it('replaces template items on update', async () => {
    prisma.dodTemplate.findFirst.mockResolvedValue({ id: 'tpl-1' });
    prisma.dodTemplate.update.mockResolvedValue({
      id: 'tpl-1',
      workspaceId: 'workspace-1',
      name: 'Updated',
      gatesCompletion: false,
      position: 0,
      createdAt: new Date('2026-07-21T00:00:00.000Z'),
      updatedAt: new Date('2026-07-21T00:00:00.000Z'),
      items: [{ id: 'i1', text: 'Docs', position: 0 }],
    });

    const result = await service.update('workspace-1', 'tpl-1', 'user-1', {
      name: 'Updated',
      gatesCompletion: false,
      items: ['Docs'],
    });

    expect(prisma.dodTemplateItem.deleteMany).toHaveBeenCalledWith({
      where: { templateId: 'tpl-1' },
    });
    expect(prisma.dodTemplateItem.createMany).toHaveBeenCalledWith({
      data: [{ templateId: 'tpl-1', text: 'Docs', position: 0 }],
    });
    expect(result.gatesCompletion).toBe(false);
  });
});
