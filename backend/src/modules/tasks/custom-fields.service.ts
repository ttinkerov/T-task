import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CustomFieldType, Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { ActivityService } from '../activity/activity.service';
import { ActivityAction, ActivityEntityType } from '../activity/activity.types';
import { CreateCustomFieldDto } from './dto/create-custom-field.dto';
import { UpdateCustomFieldDto } from './dto/update-custom-field.dto';
import { SetCustomFieldValueDto } from './dto/set-custom-field-value.dto';

const MAX_TEXT_LENGTH = 2000;
const MAX_URL_LENGTH = 2048;
const MAX_MULTI_SELECT = 50;

type CustomFieldValueJson = string | number | boolean | string[];

const CHOICE_TYPES: CustomFieldType[] = [CustomFieldType.SELECT, CustomFieldType.MULTI_SELECT];

@Injectable()
export class CustomFieldsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspacesService: WorkspacesService,
    private readonly activityService: ActivityService,
  ) {}

  async listDefinitions(workspaceId: string, userId: string) {
    await this.workspacesService.getWorkspaceForMember(workspaceId, userId);

    const definitions = await this.prisma.customFieldDefinition.findMany({
      where: { workspaceId },
      orderBy: { position: 'asc' },
    });

    return definitions.map((definition) => this.serializeDefinition(definition));
  }

  async createDefinition(workspaceId: string, userId: string, dto: CreateCustomFieldDto) {
    await this.workspacesService.getWorkspaceForMember(workspaceId, userId);

    const options = this.sanitizeOptions(dto.type, dto.options ?? []);

    const last = await this.prisma.customFieldDefinition.findFirst({
      where: { workspaceId },
      orderBy: { position: 'desc' },
      select: { position: true },
    });

    const created = await this.prisma.customFieldDefinition.create({
      data: {
        workspaceId,
        name: dto.name.trim(),
        type: dto.type,
        options,
        showOnCard: dto.showOnCard ?? false,
        position: (last?.position ?? -1) + 1,
      },
    });

    await this.activityService.record({
      workspaceId,
      actorId: userId,
      action: ActivityAction.CUSTOM_FIELD_CREATED,
      entityType: ActivityEntityType.CUSTOM_FIELD,
      entityId: created.id,
      entityName: created.name,
      metadata: { type: created.type },
    });

    return this.serializeDefinition(created);
  }

  async updateDefinition(
    workspaceId: string,
    fieldId: string,
    userId: string,
    dto: UpdateCustomFieldDto,
  ) {
    await this.workspacesService.getWorkspaceForMember(workspaceId, userId);
    const existing = await this.findDefinition(workspaceId, fieldId);

    const nextOptions =
      dto.options !== undefined ? this.sanitizeOptions(existing.type, dto.options) : undefined;

    const updated = await this.prisma.customFieldDefinition.update({
      where: { id: fieldId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(nextOptions !== undefined ? { options: nextOptions } : {}),
        ...(dto.showOnCard !== undefined ? { showOnCard: dto.showOnCard } : {}),
      },
    });

    await this.activityService.record({
      workspaceId,
      actorId: userId,
      action: ActivityAction.CUSTOM_FIELD_UPDATED,
      entityType: ActivityEntityType.CUSTOM_FIELD,
      entityId: updated.id,
      entityName: updated.name,
    });

    return this.serializeDefinition(updated);
  }

  async removeDefinition(workspaceId: string, fieldId: string, userId: string) {
    await this.workspacesService.getWorkspaceForMember(workspaceId, userId);
    const existing = await this.findDefinition(workspaceId, fieldId);

    await this.prisma.customFieldDefinition.delete({ where: { id: fieldId } });

    await this.activityService.record({
      workspaceId,
      actorId: userId,
      action: ActivityAction.CUSTOM_FIELD_DELETED,
      entityType: ActivityEntityType.CUSTOM_FIELD,
      entityId: existing.id,
      entityName: existing.name,
    });

    return { success: true };
  }

  async setValue(
    workspaceId: string,
    taskId: string,
    fieldId: string,
    userId: string,
    dto: SetCustomFieldValueDto,
  ) {
    await this.workspacesService.getWorkspaceForMember(workspaceId, userId);

    const definition = await this.findDefinition(workspaceId, fieldId);
    await this.assertTaskInWorkspace(workspaceId, taskId);

    const normalized = await this.normalizeValue(workspaceId, definition, dto.value);

    if (normalized === null) {
      await this.prisma.customFieldValue.deleteMany({ where: { fieldId, taskId } });
      return { fieldId, value: null };
    }

    const value = normalized as Prisma.InputJsonValue;
    await this.prisma.customFieldValue.upsert({
      where: { fieldId_taskId: { fieldId, taskId } },
      create: { fieldId, taskId, value },
      update: { value },
    });

    return { fieldId, value: normalized };
  }

  private async normalizeValue(
    workspaceId: string,
    definition: { type: CustomFieldType; options: string[]; name: string },
    raw: SetCustomFieldValueDto['value'],
  ): Promise<CustomFieldValueJson | null> {
    if (raw === undefined || raw === null) {
      return null;
    }

    switch (definition.type) {
      case CustomFieldType.TEXT: {
        const text = String(raw).trim();
        if (!text) return null;
        if (text.length > MAX_TEXT_LENGTH) {
          throw new BadRequestException(`Значение поля «${definition.name}» слишком длинное`);
        }
        return text;
      }
      case CustomFieldType.URL: {
        const text = String(raw).trim();
        if (!text) return null;
        if (text.length > MAX_URL_LENGTH || !/^https?:\/\/.+/i.test(text)) {
          throw new BadRequestException(
            `Поле «${definition.name}» должно содержать ссылку http(s)`,
          );
        }
        return text;
      }
      case CustomFieldType.NUMBER: {
        if (typeof raw === 'boolean' || Array.isArray(raw) || String(raw).trim() === '') {
          return null;
        }
        const num = Number(raw);
        if (!Number.isFinite(num)) {
          throw new BadRequestException(`Поле «${definition.name}» должно быть числом`);
        }
        return num;
      }
      case CustomFieldType.CHECKBOX: {
        return raw === true || raw === 'true';
      }
      case CustomFieldType.DATE: {
        const text = String(raw).trim();
        if (!text) return null;
        const date = new Date(text);
        if (Number.isNaN(date.getTime())) {
          throw new BadRequestException(`Поле «${definition.name}» содержит недопустимую дату`);
        }
        return date.toISOString();
      }
      case CustomFieldType.SELECT: {
        const text = String(raw).trim();
        if (!text) return null;
        if (!definition.options.includes(text)) {
          throw new BadRequestException(`Недопустимое значение поля «${definition.name}»`);
        }
        return text;
      }
      case CustomFieldType.MULTI_SELECT: {
        if (!Array.isArray(raw)) {
          throw new BadRequestException(`Поле «${definition.name}» должно быть списком`);
        }
        const values = Array.from(new Set(raw.map((item) => String(item).trim()).filter(Boolean)));
        if (values.length === 0) return null;
        if (values.length > MAX_MULTI_SELECT) {
          throw new BadRequestException(`Слишком много значений в поле «${definition.name}»`);
        }
        for (const value of values) {
          if (!definition.options.includes(value)) {
            throw new BadRequestException(`Недопустимое значение поля «${definition.name}»`);
          }
        }
        return values;
      }
      case CustomFieldType.USER: {
        const userValue = String(raw).trim();
        if (!userValue) return null;
        const member = await this.prisma.workspaceMember.findFirst({
          where: { workspaceId, userId: userValue },
          select: { id: true },
        });
        if (!member) {
          throw new BadRequestException(
            `Поле «${definition.name}» ссылается на участника не из команды`,
          );
        }
        return userValue;
      }
      default:
        throw new BadRequestException('Неизвестный тип поля');
    }
  }

  private sanitizeOptions(type: CustomFieldType, options: string[]): string[] {
    const needsOptions = CHOICE_TYPES.includes(type);

    if (!needsOptions) {
      if (options.length > 0) {
        throw new BadRequestException('Варианты допустимы только для полей выбора');
      }
      return [];
    }

    const cleaned = Array.from(new Set(options.map((option) => option.trim()).filter(Boolean)));
    if (cleaned.length < 2) {
      throw new BadRequestException('Для поля выбора нужно минимум 2 варианта');
    }
    return cleaned;
  }

  private async findDefinition(workspaceId: string, fieldId: string) {
    const definition = await this.prisma.customFieldDefinition.findFirst({
      where: { id: fieldId, workspaceId },
    });
    if (!definition) {
      throw new NotFoundException('Поле не найдено');
    }
    return definition;
  }

  private async assertTaskInWorkspace(workspaceId: string, taskId: string) {
    const task = await this.prisma.task.findFirst({
      where: {
        id: taskId,
        deletedAt: null,
        column: { board: { workspaceId } },
      },
      select: { id: true },
    });
    if (!task) {
      throw new NotFoundException('Задача не найдена');
    }
    return task;
  }

  private serializeDefinition(definition: {
    id: string;
    workspaceId: string;
    name: string;
    type: CustomFieldType;
    options: string[];
    showOnCard: boolean;
    position: number;
    createdAt: Date;
  }) {
    return {
      id: definition.id,
      workspaceId: definition.workspaceId,
      name: definition.name,
      type: definition.type,
      options: definition.options,
      showOnCard: definition.showOnCard,
      position: definition.position,
      createdAt: definition.createdAt.toISOString(),
    };
  }
}
