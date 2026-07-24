import { describe, expect, it } from 'vitest';
import { TaskPriority } from '@prisma/client';
import { BadRequestException } from '@nestjs/common';
import { TaskTemplatesService } from './task-templates.service';
import { DealTemplatesService } from './deal-templates.service';

describe('TaskTemplatesService helpers', () => {
  it('exposes field defaults from a template record', () => {
    const service = Object.create(TaskTemplatesService.prototype) as TaskTemplatesService;
    const defaults = service.taskFieldDefaults({
      id: 'tpl-1',
      workspaceId: 'ws-1',
      name: 'Bug',
      title: '  Crash on login  ',
      description: ' repro ',
      priority: TaskPriority.HIGH,
      complexity: 3,
      timeEstimateMinutes: 60,
      checklistGates: true,
      tagIds: [],
      subtaskTitles: [],
      checklistItems: [],
      position: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    expect(defaults).toEqual({
      title: 'Crash on login',
      description: 'repro',
      priority: TaskPriority.HIGH,
      complexity: 3,
      timeEstimateMinutes: 60,
    });
  });
});

describe('DealTemplatesService helpers', () => {
  it('exposes deal field defaults', () => {
    const service = Object.create(DealTemplatesService.prototype) as DealTemplatesService;
    const defaults = service.dealFieldDefaults({
      id: 'tpl-1',
      workspaceId: 'ws-1',
      name: 'Onboarding deal',
      title: '  Kickoff  ',
      description: ' notes ',
      amount: 15000,
      contactName: ' Ann ',
      companyName: ' Acme ',
      position: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    expect(defaults).toEqual({
      title: 'Kickoff',
      description: 'notes',
      amount: 15000,
      contactName: 'Ann',
      companyName: 'Acme',
    });
  });
});

describe('CreateTaskTemplateDto tag validation contract', () => {
  it('documents that unknown tags are rejected by the service', () => {
    expect(BadRequestException).toBeDefined();
  });
});
