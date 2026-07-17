import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CustomFieldType } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CustomFieldsService } from './custom-fields.service';

function makePrisma() {
  return {
    customFieldDefinition: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    customFieldValue: {
      upsert: vi.fn(),
      deleteMany: vi.fn(),
    },
    task: {
      findFirst: vi.fn(),
    },
    workspaceMember: {
      findFirst: vi.fn(),
    },
  };
}

function makeWorkspacesService() {
  return {
    getWorkspaceForMember: vi.fn().mockResolvedValue({ id: 'workspace-1' }),
  };
}

function makeActivityService() {
  return { record: vi.fn().mockResolvedValue(undefined) };
}

const CREATED_AT = new Date('2026-07-17T00:00:00.000Z');
const UPDATED_AT = new Date('2026-07-17T01:00:00.000Z');

describe('CustomFieldsService', () => {
  let prisma: ReturnType<typeof makePrisma>;
  let workspacesService: ReturnType<typeof makeWorkspacesService>;
  let activityService: ReturnType<typeof makeActivityService>;
  let service: CustomFieldsService;

  beforeEach(() => {
    prisma = makePrisma();
    workspacesService = makeWorkspacesService();
    activityService = makeActivityService();
    service = new CustomFieldsService(
      prisma as never,
      workspacesService as never,
      activityService as never,
    );
    prisma.customFieldDefinition.create.mockImplementation(({ data }) => ({
      id: 'field-1',
      createdAt: CREATED_AT,
      updatedAt: UPDATED_AT,
      ...data,
    }));
    prisma.task.findFirst.mockResolvedValue({ id: 'task-1' });
    prisma.customFieldValue.upsert.mockImplementation(({ create }) => ({
      id: 'value-1',
      updatedAt: UPDATED_AT,
      ...create,
    }));
    prisma.customFieldValue.deleteMany.mockResolvedValue({ count: 1 });
  });

  it('creates a definition with a trimmed name appended to the end', async () => {
    prisma.customFieldDefinition.findFirst.mockResolvedValue({ position: 2 });

    const result = await service.createDefinition('workspace-1', 'user-1', {
      name: '  Бюджет  ',
      type: 'NUMBER',
    });

    expect(prisma.customFieldDefinition.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          workspaceId: 'workspace-1',
          name: 'Бюджет',
          type: CustomFieldType.NUMBER,
          options: [],
          position: 3,
        }),
      }),
    );
    expect(result).toEqual(
      expect.objectContaining({ id: 'field-1', name: 'Бюджет', type: 'NUMBER' }),
    );
    expect(activityService.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'CUSTOM_FIELD_CREATED' }),
    );
  });

  it('requires at least two options for choice fields and forbids them otherwise', async () => {
    prisma.customFieldDefinition.findFirst.mockResolvedValue(null);

    await expect(
      service.createDefinition('workspace-1', 'user-1', {
        name: 'Статус',
        type: 'SELECT',
        options: ['Один'],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    await expect(
      service.createDefinition('workspace-1', 'user-1', {
        name: 'Заметка',
        type: 'TEXT',
        options: ['Лишнее'],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('normalizes and validates values per field type when setting them', async () => {
    prisma.customFieldDefinition.findFirst.mockResolvedValue({
      id: 'field-1',
      workspaceId: 'workspace-1',
      type: CustomFieldType.SELECT,
      options: ['Низкий', 'Высокий'],
    });

    await service.setValue('workspace-1', 'task-1', 'field-1', 'user-1', { value: 'Высокий' });

    expect(prisma.customFieldValue.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { fieldId_taskId: { fieldId: 'field-1', taskId: 'task-1' } },
        create: expect.objectContaining({ value: 'Высокий' }),
        update: { value: 'Высокий' },
      }),
    );

    await expect(
      service.setValue('workspace-1', 'task-1', 'field-1', 'user-1', { value: 'Неизвестно' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects a number value that is not finite', async () => {
    prisma.customFieldDefinition.findFirst.mockResolvedValue({
      id: 'field-1',
      workspaceId: 'workspace-1',
      type: CustomFieldType.NUMBER,
      options: [],
    });

    await expect(
      service.setValue('workspace-1', 'task-1', 'field-1', 'user-1', { value: 'нечисло' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('validates that a USER value references a workspace member', async () => {
    prisma.customFieldDefinition.findFirst.mockResolvedValue({
      id: 'field-1',
      workspaceId: 'workspace-1',
      type: CustomFieldType.USER,
      options: [],
    });
    prisma.workspaceMember.findFirst.mockResolvedValue(null);

    await expect(
      service.setValue('workspace-1', 'task-1', 'field-1', 'user-1', { value: 'user-x' }),
    ).rejects.toBeInstanceOf(BadRequestException);

    prisma.workspaceMember.findFirst.mockResolvedValue({ id: 'member-1' });
    await expect(
      service.setValue('workspace-1', 'task-1', 'field-1', 'user-1', { value: 'user-2' }),
    ).resolves.toEqual(expect.objectContaining({ fieldId: 'field-1', value: 'user-2' }));
  });

  it('accepts a subset of options for multi-select fields', async () => {
    prisma.customFieldDefinition.findFirst.mockResolvedValue({
      id: 'field-1',
      workspaceId: 'workspace-1',
      type: CustomFieldType.MULTI_SELECT,
      options: ['A', 'B', 'C'],
    });

    await expect(
      service.setValue('workspace-1', 'task-1', 'field-1', 'user-1', { value: ['A', 'C'] }),
    ).resolves.toEqual(expect.objectContaining({ value: ['A', 'C'] }));

    await expect(
      service.setValue('workspace-1', 'task-1', 'field-1', 'user-1', { value: ['A', 'Z'] }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('clears the value when an empty payload is provided', async () => {
    prisma.customFieldDefinition.findFirst.mockResolvedValue({
      id: 'field-1',
      workspaceId: 'workspace-1',
      type: CustomFieldType.TEXT,
      options: [],
    });

    await expect(
      service.setValue('workspace-1', 'task-1', 'field-1', 'user-1', { value: '   ' }),
    ).resolves.toEqual({ fieldId: 'field-1', value: null });
    expect(prisma.customFieldValue.deleteMany).toHaveBeenCalledWith({
      where: { fieldId: 'field-1', taskId: 'task-1' },
    });
    expect(prisma.customFieldValue.upsert).not.toHaveBeenCalled();
  });

  it('rejects setting a value for a field outside the workspace', async () => {
    prisma.customFieldDefinition.findFirst.mockResolvedValue(null);

    await expect(
      service.setValue('workspace-1', 'task-1', 'field-x', 'user-1', { value: 'x' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects setting a value for a task outside the workspace', async () => {
    prisma.customFieldDefinition.findFirst.mockResolvedValue({
      id: 'field-1',
      workspaceId: 'workspace-1',
      type: CustomFieldType.TEXT,
      options: [],
    });
    prisma.task.findFirst.mockResolvedValue(null);

    await expect(
      service.setValue('workspace-1', 'task-x', 'field-1', 'user-1', { value: 'x' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('removes a definition scoped to the workspace and logs it', async () => {
    prisma.customFieldDefinition.findFirst.mockResolvedValue({ id: 'field-1', name: 'Бюджет' });

    await expect(service.removeDefinition('workspace-1', 'field-1', 'user-1')).resolves.toEqual({
      success: true,
    });
    expect(prisma.customFieldDefinition.delete).toHaveBeenCalledWith({
      where: { id: 'field-1' },
    });
    expect(activityService.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'CUSTOM_FIELD_DELETED', entityId: 'field-1' }),
    );
  });
});
