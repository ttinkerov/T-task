import { BadRequestException, NotFoundException } from '@nestjs/common';
import { FormFieldType } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FormsService } from './forms.service';

function makePrisma() {
  return {
    form: {
      findFirst: vi.fn(),
    },
    $transaction: vi.fn(),
  };
}

describe('FormsService — public token surface', () => {
  let prisma: ReturnType<typeof makePrisma>;
  let service: FormsService;
  const workspacesService = { getWorkspaceForMember: vi.fn() };
  const activityService = { record: vi.fn() };
  const rateLimitService = { consume: vi.fn().mockResolvedValue(undefined) };

  beforeEach(() => {
    vi.clearAllMocks();
    prisma = makePrisma();
    service = new FormsService(
      prisma as never,
      workspacesService as never,
      activityService as never,
      rateLimitService as never,
    );
  });

  it('returns a public form by token', async () => {
    prisma.form.findFirst.mockResolvedValue({
      id: 'form-1',
      title: 'Заявка',
      description: 'Описание',
      fields: [
        {
          id: 'field-1',
          type: FormFieldType.SHORT_TEXT,
          label: 'Имя',
          options: [],
          required: true,
          position: 0,
        },
      ],
      workspace: { deletedAt: null, archivedAt: null },
    });

    await expect(service.getPublicForm('public-token')).resolves.toMatchObject({
      id: 'form-1',
      title: 'Заявка',
      fields: [{ id: 'field-1', label: 'Имя', required: true }],
    });
    expect(prisma.form.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { publicToken: 'public-token', isPublic: true },
      }),
    );
  });

  it('hides non-public and deleted workspace forms', async () => {
    prisma.form.findFirst.mockResolvedValue(null);
    await expect(service.getPublicForm('missing')).rejects.toBeInstanceOf(NotFoundException);

    prisma.form.findFirst.mockResolvedValue({
      id: 'form-1',
      title: 'Заявка',
      description: null,
      fields: [],
      workspace: { deletedAt: new Date(), archivedAt: null },
    });
    await expect(service.getPublicForm('token')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('submits answers and stores a response', async () => {
    prisma.form.findFirst.mockResolvedValue({
      id: 'form-1',
      workspaceId: 'ws-1',
      title: 'Заявка',
      createTaskOnSubmit: false,
      fields: [
        {
          id: 'field-1',
          type: FormFieldType.SHORT_TEXT,
          label: 'Имя',
          options: [],
          required: true,
          position: 0,
        },
      ],
      workspace: { deletedAt: null, archivedAt: null },
    });
    prisma.$transaction.mockImplementation(async (fn: (tx: unknown) => unknown) =>
      fn({
        formResponse: {
          create: vi.fn().mockResolvedValue({
            id: 'resp-1',
            createdAt: new Date('2026-08-10T00:00:00.000Z'),
          }),
        },
      }),
    );

    await expect(service.submitPublicForm('public-token', { 'field-1': 'Анна' })).resolves.toEqual({
      id: 'resp-1',
      createdAt: '2026-08-10T00:00:00.000Z',
    });
    expect(rateLimitService.consume).toHaveBeenCalled();
  });

  it('rejects submit when required answer is missing', async () => {
    prisma.form.findFirst.mockResolvedValue({
      id: 'form-1',
      workspaceId: 'ws-1',
      title: 'Заявка',
      createTaskOnSubmit: false,
      fields: [
        {
          id: 'field-1',
          type: FormFieldType.SHORT_TEXT,
          label: 'Имя',
          options: [],
          required: true,
          position: 0,
        },
      ],
      workspace: { deletedAt: null, archivedAt: null },
    });

    await expect(service.submitPublicForm('public-token', {})).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('rejects unknown answer field ids', async () => {
    prisma.form.findFirst.mockResolvedValue({
      id: 'form-1',
      workspaceId: 'ws-1',
      title: 'Заявка',
      createTaskOnSubmit: false,
      fields: [
        {
          id: 'field-1',
          type: FormFieldType.SHORT_TEXT,
          label: 'Имя',
          options: [],
          required: false,
          position: 0,
        },
      ],
      workspace: { deletedAt: null, archivedAt: null },
    });

    await expect(
      service.submitPublicForm('public-token', { 'field-x': 'hack' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
