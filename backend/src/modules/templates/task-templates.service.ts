import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, TaskPriority } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { CreateTaskTemplateDto } from './dto/create-task-template.dto';
import { UpdateTaskTemplateDto } from './dto/update-task-template.dto';

export type TaskTemplateRecord = {
  id: string;
  workspaceId: string;
  name: string;
  title: string | null;
  description: string | null;
  priority: TaskPriority | null;
  complexity: number | null;
  timeEstimateMinutes: number | null;
  checklistGates: boolean;
  tagIds: string[];
  subtaskTitles: string[];
  checklistItems: string[];
  position: number;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class TaskTemplatesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspacesService: WorkspacesService,
  ) {}

  async list(workspaceId: string, userId: string) {
    await this.workspacesService.getWorkspaceForMember(workspaceId, userId);
    const templates = await this.prisma.taskTemplate.findMany({
      where: { workspaceId },
      orderBy: { position: 'asc' },
    });
    return templates.map((template) => this.serialize(template));
  }

  async create(workspaceId: string, userId: string, dto: CreateTaskTemplateDto) {
    await this.workspacesService.getWorkspaceForMember(workspaceId, userId);
    const tagIds = await this.resolveTagIds(workspaceId, dto.tagIds ?? []);
    const last = await this.prisma.taskTemplate.findFirst({
      where: { workspaceId },
      orderBy: { position: 'desc' },
      select: { position: true },
    });

    const template = await this.prisma.taskTemplate.create({
      data: {
        workspaceId,
        name: dto.name.trim(),
        title: trimOrNull(dto.title),
        description: trimOrNull(dto.description),
        priority: dto.priority ?? null,
        complexity: dto.complexity ?? null,
        timeEstimateMinutes: dto.timeEstimateMinutes ?? null,
        checklistGates: dto.checklistGates ?? true,
        tagIds,
        subtaskTitles: normalizeLines(dto.subtaskTitles ?? []),
        checklistItems: normalizeLines(dto.checklistItems ?? []),
        position: (last?.position ?? -1) + 1,
      },
    });
    return this.serialize(template);
  }

  async update(
    workspaceId: string,
    templateId: string,
    userId: string,
    dto: UpdateTaskTemplateDto,
  ) {
    await this.requireTemplate(workspaceId, templateId, userId);
    const tagIds =
      dto.tagIds !== undefined ? await this.resolveTagIds(workspaceId, dto.tagIds) : undefined;

    const template = await this.prisma.taskTemplate.update({
      where: { id: templateId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.title !== undefined ? { title: trimOrNull(dto.title) } : {}),
        ...(dto.description !== undefined ? { description: trimOrNull(dto.description) } : {}),
        ...(dto.priority !== undefined ? { priority: dto.priority } : {}),
        ...(dto.complexity !== undefined ? { complexity: dto.complexity } : {}),
        ...(dto.timeEstimateMinutes !== undefined
          ? { timeEstimateMinutes: dto.timeEstimateMinutes }
          : {}),
        ...(dto.checklistGates !== undefined ? { checklistGates: dto.checklistGates } : {}),
        ...(tagIds !== undefined ? { tagIds } : {}),
        ...(dto.subtaskTitles !== undefined
          ? { subtaskTitles: normalizeLines(dto.subtaskTitles) }
          : {}),
        ...(dto.checklistItems !== undefined
          ? { checklistItems: normalizeLines(dto.checklistItems) }
          : {}),
      },
    });
    return this.serialize(template);
  }

  async remove(workspaceId: string, templateId: string, userId: string) {
    await this.requireTemplate(workspaceId, templateId, userId);
    await this.prisma.taskTemplate.delete({ where: { id: templateId } });
    return { deleted: true };
  }

  async seedDefaults(workspaceId: string, userId: string) {
    await this.workspacesService.getWorkspaceForMember(workspaceId, userId);
    const existing = await this.prisma.taskTemplate.findFirst({
      where: { workspaceId, name: 'Bug' },
      select: { id: true },
    });
    if (existing) {
      return this.list(workspaceId, userId);
    }

    const bugTag = await this.ensureTag(workspaceId, 'bug', '#ef4444');
    await this.create(workspaceId, userId, {
      name: 'Bug',
      title: '',
      description: '## Steps to reproduce\n\n1.\n\n## Expected\n\n## Actual\n\n## Environment\n',
      priority: TaskPriority.HIGH,
      checklistGates: true,
      tagIds: [bugTag.id],
      subtaskTitles: ['Написать failing-тест', 'Исправить баг', 'Проверить на staging'],
      checklistItems: ['Воспроизвести баг', 'Найти причину', 'Исправление', 'Тесты', 'Code review'],
    });
    return this.list(workspaceId, userId);
  }

  async getForApply(workspaceId: string, templateId: string): Promise<TaskTemplateRecord> {
    const template = await this.prisma.taskTemplate.findFirst({
      where: { id: templateId, workspaceId },
    });
    if (!template) throw new NotFoundException('Шаблон задачи не найден');
    return template;
  }

  async applyInTransaction(
    tx: Prisma.TransactionClient,
    workspaceId: string,
    taskId: string,
    template: TaskTemplateRecord,
  ) {
    const tagIds = await this.resolveTagIds(workspaceId, template.tagIds, tx);
    if (tagIds.length > 0) {
      await tx.taskTag.createMany({
        data: tagIds.map((tagId) => ({ taskId, tagId })),
        skipDuplicates: true,
      });
    }

    const subtasks = normalizeLines(template.subtaskTitles);
    if (subtasks.length > 0) {
      const lastSubtask = await tx.subtask.findFirst({
        where: { taskId },
        orderBy: { position: 'desc' },
        select: { position: true },
      });
      const base = (lastSubtask?.position ?? -1) + 1;
      await tx.subtask.createMany({
        data: subtasks.map((title, index) => ({
          taskId,
          title,
          completed: false,
          position: base + index,
        })),
      });
    }

    const checklist = normalizeLines(template.checklistItems);
    if (checklist.length > 0) {
      const lastItem = await tx.taskChecklistItem.findFirst({
        where: { taskId },
        orderBy: { position: 'desc' },
        select: { position: true },
      });
      const base = (lastItem?.position ?? -1) + 1;
      await tx.taskChecklistItem.createMany({
        data: checklist.map((text, index) => ({
          taskId,
          text,
          completed: false,
          required: template.checklistGates,
          position: base + index,
        })),
      });
    }
  }

  fillEmptyTaskFields(
    current: {
      title: string;
      description: string | null;
      priority: TaskPriority | null;
      complexity: number | null;
      timeEstimateMinutes: number | null;
    },
    defaults: ReturnType<TaskTemplatesService['taskFieldDefaults']>,
  ) {
    return {
      ...(defaults.title && !current.title.trim() ? { title: defaults.title.slice(0, 200) } : {}),
      ...(defaults.description && !current.description?.trim()
        ? { description: defaults.description }
        : {}),
      ...(defaults.priority != null && current.priority == null
        ? { priority: defaults.priority }
        : {}),
      ...(defaults.complexity != null && current.complexity == null
        ? { complexity: defaults.complexity }
        : {}),
      ...(defaults.timeEstimateMinutes != null && current.timeEstimateMinutes == null
        ? { timeEstimateMinutes: defaults.timeEstimateMinutes }
        : {}),
    };
  }

  taskFieldDefaults(template: TaskTemplateRecord) {
    return {
      title: trimOrNull(template.title),
      description: trimOrNull(template.description),
      priority: template.priority,
      complexity: template.complexity,
      timeEstimateMinutes: template.timeEstimateMinutes,
    };
  }

  private async requireTemplate(workspaceId: string, templateId: string, userId: string) {
    await this.workspacesService.getWorkspaceForMember(workspaceId, userId);
    const template = await this.prisma.taskTemplate.findFirst({
      where: { id: templateId, workspaceId },
      select: { id: true },
    });
    if (!template) throw new NotFoundException('Шаблон задачи не найден');
    return template;
  }

  private async resolveTagIds(
    workspaceId: string,
    tagIds: string[],
    tx: Prisma.TransactionClient | PrismaService = this.prisma,
  ) {
    const unique = [...new Set(tagIds)];
    if (unique.length === 0) return [];
    const tags = await tx.tag.findMany({
      where: { workspaceId, id: { in: unique } },
      select: { id: true },
    });
    if (tags.length !== unique.length) {
      throw new BadRequestException('Некоторые теги шаблона не найдены');
    }
    return tags.map((tag) => tag.id);
  }

  private async ensureTag(workspaceId: string, name: string, color: string) {
    const existing = await this.prisma.tag.findFirst({
      where: { workspaceId, name: { equals: name, mode: 'insensitive' } },
      select: { id: true },
    });
    if (existing) return existing;
    return this.prisma.tag.create({
      data: { workspaceId, name, color },
      select: { id: true },
    });
  }

  private serialize(template: TaskTemplateRecord) {
    return {
      id: template.id,
      workspaceId: template.workspaceId,
      name: template.name,
      title: template.title,
      description: template.description,
      priority: template.priority,
      complexity: template.complexity,
      timeEstimateMinutes: template.timeEstimateMinutes,
      checklistGates: template.checklistGates,
      tagIds: template.tagIds,
      subtaskTitles: template.subtaskTitles,
      checklistItems: template.checklistItems,
      position: template.position,
      createdAt: template.createdAt.toISOString(),
      updatedAt: template.updatedAt.toISOString(),
    };
  }
}

function trimOrNull(value: string | null | undefined) {
  if (value === undefined || value === null) return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function normalizeLines(items: string[]) {
  return items.map((item) => item.trim()).filter(Boolean);
}
