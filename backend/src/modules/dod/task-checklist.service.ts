import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { ApplyDodTemplateDto } from './dto/apply-dod-template.dto';
import { CreateChecklistItemDto } from './dto/create-checklist-item.dto';
import { UpdateChecklistItemDto } from './dto/update-checklist-item.dto';

type DbClient = Prisma.TransactionClient | PrismaService;

@Injectable()
export class TaskChecklistService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspacesService: WorkspacesService,
  ) {}

  async list(workspaceId: string, taskId: string, userId: string) {
    await this.requireTask(workspaceId, taskId, userId);
    return this.prisma.taskChecklistItem.findMany({
      where: { taskId },
      orderBy: { position: 'asc' },
      select: {
        id: true,
        text: true,
        completed: true,
        required: true,
        position: true,
        sourceTemplateId: true,
      },
    });
  }

  async create(workspaceId: string, taskId: string, userId: string, dto: CreateChecklistItemDto) {
    await this.requireTask(workspaceId, taskId, userId);
    const last = await this.prisma.taskChecklistItem.findFirst({
      where: { taskId },
      orderBy: { position: 'desc' },
      select: { position: true },
    });

    return this.prisma.taskChecklistItem.create({
      data: {
        taskId,
        text: dto.text.trim(),
        required: dto.required ?? true,
        position: (last?.position ?? -1) + 1,
      },
      select: {
        id: true,
        text: true,
        completed: true,
        required: true,
        position: true,
        sourceTemplateId: true,
      },
    });
  }

  async update(
    workspaceId: string,
    taskId: string,
    itemId: string,
    userId: string,
    dto: UpdateChecklistItemDto,
  ) {
    await this.requireTask(workspaceId, taskId, userId);
    const item = await this.prisma.taskChecklistItem.findFirst({
      where: { id: itemId, taskId },
    });
    if (!item) throw new NotFoundException('Пункт DoD не найден');

    return this.prisma.taskChecklistItem.update({
      where: { id: itemId },
      data: {
        ...(dto.text !== undefined ? { text: dto.text.trim() } : {}),
        ...(dto.completed !== undefined ? { completed: dto.completed } : {}),
        ...(dto.required !== undefined ? { required: dto.required } : {}),
      },
      select: {
        id: true,
        text: true,
        completed: true,
        required: true,
        position: true,
        sourceTemplateId: true,
      },
    });
  }

  async remove(workspaceId: string, taskId: string, itemId: string, userId: string) {
    await this.requireTask(workspaceId, taskId, userId);
    const item = await this.prisma.taskChecklistItem.findFirst({
      where: { id: itemId, taskId },
      select: { id: true },
    });
    if (!item) throw new NotFoundException('Пункт DoD не найден');
    await this.prisma.taskChecklistItem.delete({ where: { id: itemId } });
    return { deleted: true };
  }

  async applyTemplate(
    workspaceId: string,
    taskId: string,
    userId: string,
    dto: ApplyDodTemplateDto,
  ) {
    await this.requireTask(workspaceId, taskId, userId);
    const template = await this.prisma.dodTemplate.findFirst({
      where: { id: dto.templateId, workspaceId },
      include: { items: { orderBy: { position: 'asc' } } },
    });
    if (!template) throw new NotFoundException('Шаблон DoD не найден');

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.taskChecklistItem.findMany({
        where: { taskId },
        select: { text: true, position: true },
      });
      const existingTexts = new Set(existing.map((item) => item.text.trim().toLowerCase()));
      const lastPosition = existing.reduce((max, item) => Math.max(max, item.position), -1);

      const toCreate = template.items
        .filter((item) => !existingTexts.has(item.text.trim().toLowerCase()))
        .map((item, index) => ({
          taskId,
          text: item.text,
          required: template.gatesCompletion,
          completed: false,
          position: lastPosition + 1 + index,
          sourceTemplateId: template.id,
        }));

      if (toCreate.length > 0) {
        await tx.taskChecklistItem.createMany({ data: toCreate });
      }

      return tx.taskChecklistItem.findMany({
        where: { taskId },
        orderBy: { position: 'asc' },
        select: {
          id: true,
          text: true,
          completed: true,
          required: true,
          position: true,
          sourceTemplateId: true,
        },
      });
    });
  }

  async assertDoDSatisfied(taskId: string, client: DbClient = this.prisma) {
    const pending = await client.taskChecklistItem.findMany({
      where: { taskId, required: true, completed: false },
      orderBy: { position: 'asc' },
      select: { text: true },
      take: 5,
    });
    if (pending.length === 0) return;

    const shown = pending.slice(0, 3).map((item) => item.text);
    const extra = pending.length > 3 ? ` и ещё ${pending.length - 3}` : '';
    throw new ConflictException(
      `Не выполнены пункты критериев готовности: ${shown.join(', ')}${extra}`,
    );
  }

  private async requireTask(workspaceId: string, taskId: string, userId: string) {
    await this.workspacesService.getWorkspaceForMember(workspaceId, userId);
    const task = await this.prisma.task.findFirst({
      where: {
        id: taskId,
        deletedAt: null,
        column: { board: { workspaceId } },
      },
      select: { id: true },
    });
    if (!task) throw new NotFoundException('Задача не найдена');
    return task;
  }
}
