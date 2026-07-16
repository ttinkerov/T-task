import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

const MAX_ANSWER_LENGTH = 5000;
const MAX_MULTIPLE_CHOICE_OPTIONS = 20;
import { FormFieldType, Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { ActivityService } from '../activity/activity.service';
import { ActivityAction, ActivityEntityType } from '../activity/activity.types';
import { CreateFormFieldDto } from './dto/create-form-field.dto';
import { CreateFormDto } from './dto/create-form.dto';
import { UpdateFormDto } from './dto/update-form.dto';
import { UpdateFormFieldDto } from './dto/update-form-field.dto';

@Injectable()
export class FormsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspacesService: WorkspacesService,
    private readonly activityService: ActivityService,
  ) {}

  async list(workspaceId: string, userId: string) {
    await this.workspacesService.getWorkspaceForMember(workspaceId, userId);

    const forms = await this.prisma.form.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { responses: true, fields: true } },
      },
    });

    return forms.map((form) => ({
      id: form.id,
      title: form.title,
      description: form.description,
      publicToken: form.publicToken,
      isPublic: form.isPublic,
      createTaskOnSubmit: form.createTaskOnSubmit,
      responseCount: form._count.responses,
      fieldCount: form._count.fields,
      createdAt: form.createdAt.toISOString(),
    }));
  }

  async create(workspaceId: string, userId: string, dto: CreateFormDto) {
    await this.workspacesService.getWorkspaceForMember(workspaceId, userId);

    const form = await this.prisma.$transaction(async (tx) => {
      const created = await tx.form.create({
        data: {
          workspaceId,
          title: dto.title.trim(),
          description: dto.description?.trim() || null,
          publicToken: randomUUID(),
          createTaskOnSubmit: dto.createTaskOnSubmit ?? false,
        },
      });
      await this.activityService.record({
        workspaceId,
        actorId: userId,
        action: ActivityAction.FORM_CREATED,
        entityType: ActivityEntityType.FORM,
        entityId: created.id,
        entityName: created.title,
      });
      return created;
    });

    return this.getForm(workspaceId, form.id, userId);
  }

  async getForm(workspaceId: string, formId: string, userId: string) {
    await this.workspacesService.getWorkspaceForMember(workspaceId, userId);
    const form = await this.findFormInWorkspace(workspaceId, formId);

    return this.serializeForm(form);
  }

  async update(workspaceId: string, formId: string, userId: string, dto: UpdateFormDto) {
    await this.workspacesService.getWorkspaceForMember(workspaceId, userId);
    const existing = await this.findFormInWorkspace(workspaceId, formId);

    await this.prisma.$transaction(async (tx) => {
      const updated = await tx.form.update({
        where: { id: formId },
        data: {
          ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
          ...(dto.description !== undefined
            ? { description: dto.description?.trim() || null }
            : {}),
          ...(dto.isPublic !== undefined ? { isPublic: dto.isPublic } : {}),
          ...(dto.createTaskOnSubmit !== undefined
            ? { createTaskOnSubmit: dto.createTaskOnSubmit }
            : {}),
        },
      });
      await this.activityService.record({
        workspaceId,
        actorId: userId,
        action: ActivityAction.FORM_UPDATED,
        entityType: ActivityEntityType.FORM,
        entityId: updated.id,
        entityName: updated.title,
        metadata: {
          titleChanged: dto.title !== undefined && dto.title.trim() !== existing.title,
          accessChanged: dto.isPublic !== undefined,
          taskCreationChanged: dto.createTaskOnSubmit !== undefined,
        },
      });
    });

    return this.getForm(workspaceId, formId, userId);
  }

  async remove(workspaceId: string, formId: string, userId: string) {
    await this.workspacesService.getWorkspaceForMember(workspaceId, userId);
    const form = await this.findFormInWorkspace(workspaceId, formId);
    await this.prisma.$transaction(async (tx) => {
      await tx.form.delete({ where: { id: formId } });
      await this.activityService.record({
        workspaceId,
        actorId: userId,
        action: ActivityAction.FORM_DELETED,
        entityType: ActivityEntityType.FORM,
        entityId: form.id,
        entityName: form.title,
      });
    });
    return { success: true };
  }

  async addField(workspaceId: string, formId: string, userId: string, dto: CreateFormFieldDto) {
    await this.workspacesService.getWorkspaceForMember(workspaceId, userId);
    await this.findFormInWorkspace(workspaceId, formId);
    this.validateFieldOptions(dto.type, dto.options ?? []);

    const lastField = await this.prisma.formField.findFirst({
      where: { formId },
      orderBy: { position: 'desc' },
    });

    await this.prisma.formField.create({
      data: {
        formId,
        type: dto.type,
        label: dto.label.trim(),
        options: dto.options ?? [],
        required: dto.required ?? false,
        position: (lastField?.position ?? -1) + 1,
      },
    });

    return this.getForm(workspaceId, formId, userId);
  }

  async updateField(
    workspaceId: string,
    formId: string,
    fieldId: string,
    userId: string,
    dto: UpdateFormFieldDto,
  ) {
    await this.workspacesService.getWorkspaceForMember(workspaceId, userId);
    await this.assertFieldInForm(workspaceId, formId, fieldId);

    const field = await this.prisma.formField.findUniqueOrThrow({ where: { id: fieldId } });
    const nextType = dto.type ?? field.type;
    const nextOptions = dto.options ?? field.options;
    this.validateFieldOptions(nextType, nextOptions);

    await this.prisma.formField.update({
      where: { id: fieldId },
      data: {
        ...(dto.type !== undefined ? { type: dto.type } : {}),
        ...(dto.label !== undefined ? { label: dto.label.trim() } : {}),
        ...(dto.options !== undefined ? { options: dto.options } : {}),
        ...(dto.required !== undefined ? { required: dto.required } : {}),
      },
    });

    return this.getForm(workspaceId, formId, userId);
  }

  async removeField(workspaceId: string, formId: string, fieldId: string, userId: string) {
    await this.workspacesService.getWorkspaceForMember(workspaceId, userId);
    await this.assertFieldInForm(workspaceId, formId, fieldId);

    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const field = await tx.formField.findUniqueOrThrow({ where: { id: fieldId } });
      await tx.formField.delete({ where: { id: fieldId } });

      const remaining = await tx.formField.findMany({
        where: { formId },
        orderBy: { position: 'asc' },
      });

      await Promise.all(
        remaining.map((item, index) =>
          tx.formField.update({
            where: { id: item.id },
            data: { position: index },
          }),
        ),
      );

      if (field.position !== remaining.length) {
        // positions normalized above
      }
    });

    return this.getForm(workspaceId, formId, userId);
  }

  async getResponses(workspaceId: string, formId: string, userId: string) {
    await this.workspacesService.getWorkspaceForMember(workspaceId, userId);
    const form = await this.findFormInWorkspace(workspaceId, formId);

    const responses = await this.prisma.formResponse.findMany({
      where: { formId },
      orderBy: { createdAt: 'desc' },
    });

    return {
      total: responses.length,
      stats: this.buildStats(form.fields, responses),
      responses: responses.map((response) => ({
        id: response.id,
        answers: response.answers,
        createdAt: response.createdAt.toISOString(),
      })),
    };
  }

  async getPublicForm(token: string) {
    const form = await this.prisma.form.findFirst({
      where: { publicToken: token, isPublic: true },
      include: {
        fields: { orderBy: { position: 'asc' } },
      },
    });

    if (!form) {
      throw new NotFoundException('Form not found');
    }

    return {
      id: form.id,
      title: form.title,
      description: form.description,
      fields: form.fields.map((field) => ({
        id: field.id,
        type: field.type,
        label: field.label,
        options: field.options,
        required: field.required,
        position: field.position,
      })),
    };
  }

  async submitPublicForm(token: string, answers: Record<string, string | string[]>) {
    const form = await this.prisma.form.findFirst({
      where: { publicToken: token, isPublic: true },
      include: {
        fields: { orderBy: { position: 'asc' } },
      },
    });

    if (!form) {
      throw new NotFoundException('Form not found');
    }

    const normalized = this.validateAnswers(form.fields, answers);

    const response = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const created = await tx.formResponse.create({
        data: {
          formId: form.id,
          answers: normalized,
        },
      });

      if (form.createTaskOnSubmit) {
        await this.createTaskFromResponse(
          tx,
          form.workspaceId,
          form.title,
          form.fields,
          normalized,
        );
      }

      return created;
    });

    return {
      id: response.id,
      createdAt: response.createdAt.toISOString(),
    };
  }

  private async createTaskFromResponse(
    tx: Prisma.TransactionClient,
    workspaceId: string,
    formTitle: string,
    fields: { id: string; type: FormFieldType; label: string }[],
    answers: Record<string, string | string[]>,
  ) {
    const board = await tx.board.findFirst({
      where: { workspaceId },
      include: {
        columns: { orderBy: { position: 'asc' }, take: 1 },
      },
    });

    if (!board?.columns[0]) {
      return;
    }

    const columnId = board.columns[0].id;
    const titleField = fields.find((field) => field.type === FormFieldType.SHORT_TEXT) ?? fields[0];
    const rawTitle = titleField ? answers[titleField.id] : null;
    const taskTitle =
      typeof rawTitle === 'string' && rawTitle.trim() ? rawTitle.trim() : `Ответ: ${formTitle}`;

    const descriptionParts = fields
      .map((field) => {
        const value = answers[field.id];
        if (value === undefined || value === null || value === '') return null;
        const rendered = Array.isArray(value) ? value.join(', ') : String(value);
        return `${field.label}: ${rendered}`;
      })
      .filter(Boolean);

    const lastTask = await tx.task.findFirst({
      where: { columnId },
      orderBy: { position: 'desc' },
    });

    await tx.task.create({
      data: {
        columnId,
        title: taskTitle.slice(0, 200),
        description:
          descriptionParts.length > 0 ? descriptionParts.join('\n').slice(0, 2000) : null,
        position: (lastTask?.position ?? -1) + 1,
      },
    });
  }

  private validateAnswers(
    fields: {
      id: string;
      type: FormFieldType;
      label: string;
      options: string[];
      required: boolean;
    }[],
    answers: Record<string, string | string[]>,
  ) {
    const normalized: Record<string, string | string[]> = {};
    const allowedFieldIds = new Set(fields.map((field) => field.id));

    for (const key of Object.keys(answers)) {
      if (!allowedFieldIds.has(key)) {
        throw new BadRequestException('Unknown form field in answers');
      }
    }

    for (const field of fields) {
      const value = answers[field.id];

      if (
        value === undefined ||
        value === null ||
        value === '' ||
        (Array.isArray(value) && value.length === 0)
      ) {
        if (field.required) {
          throw new BadRequestException(`Поле «${field.label}» обязательно`);
        }
        continue;
      }

      if (field.type === FormFieldType.MULTIPLE_CHOICE) {
        if (!Array.isArray(value)) {
          throw new BadRequestException(`Поле «${field.label}» должно быть массивом`);
        }
        if (value.length > MAX_MULTIPLE_CHOICE_OPTIONS) {
          throw new BadRequestException(`Слишком много вариантов в поле «${field.label}»`);
        }
        for (const option of value) {
          if (!field.options.includes(option)) {
            throw new BadRequestException(`Недопустимый вариант в поле «${field.label}»`);
          }
        }
        normalized[field.id] = value;
        continue;
      }

      if (field.type === FormFieldType.SINGLE_CHOICE) {
        const option = String(value);
        if (!field.options.includes(option)) {
          throw new BadRequestException(`Недопустимый вариант в поле «${field.label}»`);
        }
        normalized[field.id] = option;
        continue;
      }

      const text = String(value).trim();
      if (text.length > MAX_ANSWER_LENGTH) {
        throw new BadRequestException(`Поле «${field.label}» слишком длинное`);
      }
      normalized[field.id] = text;
    }

    return normalized;
  }

  private buildStats(
    fields: { id: string; type: FormFieldType; label: string; options: string[] }[],
    responses: { answers: Prisma.JsonValue }[],
  ) {
    return fields
      .filter(
        (field) =>
          field.type === FormFieldType.SINGLE_CHOICE ||
          field.type === FormFieldType.MULTIPLE_CHOICE,
      )
      .map((field) => {
        const counts = new Map<string, number>();
        for (const option of field.options) {
          counts.set(option, 0);
        }

        for (const response of responses) {
          const answers = response.answers as Record<string, string | string[]>;
          const value = answers[field.id];
          if (!value) continue;

          if (Array.isArray(value)) {
            for (const option of value) {
              counts.set(option, (counts.get(option) ?? 0) + 1);
            }
          } else {
            counts.set(value, (counts.get(value) ?? 0) + 1);
          }
        }

        return {
          fieldId: field.id,
          label: field.label,
          options: field.options.map((option) => ({
            option,
            count: counts.get(option) ?? 0,
          })),
        };
      });
  }

  private validateFieldOptions(type: FormFieldType, options: string[]) {
    const needsOptions =
      type === FormFieldType.SINGLE_CHOICE || type === FormFieldType.MULTIPLE_CHOICE;

    if (needsOptions && options.length < 2) {
      throw new BadRequestException('Для выбора нужно минимум 2 варианта ответа');
    }

    if (!needsOptions && options.length > 0) {
      throw new BadRequestException('Варианты ответа допустимы только для полей выбора');
    }
  }

  private async findFormInWorkspace(workspaceId: string, formId: string) {
    const form = await this.prisma.form.findFirst({
      where: { id: formId, workspaceId },
      include: {
        fields: { orderBy: { position: 'asc' } },
        _count: { select: { responses: true } },
      },
    });

    if (!form) {
      throw new NotFoundException('Form not found');
    }

    return form;
  }

  private async assertFieldInForm(workspaceId: string, formId: string, fieldId: string) {
    const field = await this.prisma.formField.findFirst({
      where: {
        id: fieldId,
        formId,
        form: { workspaceId },
      },
    });

    if (!field) {
      throw new NotFoundException('Field not found');
    }

    return field;
  }

  private serializeForm(form: {
    id: string;
    workspaceId: string;
    title: string;
    description: string | null;
    publicToken: string;
    isPublic: boolean;
    createTaskOnSubmit: boolean;
    createdAt: Date;
    fields: {
      id: string;
      type: FormFieldType;
      label: string;
      options: string[];
      required: boolean;
      position: number;
    }[];
    _count?: { responses: number };
  }) {
    return {
      id: form.id,
      workspaceId: form.workspaceId,
      title: form.title,
      description: form.description,
      publicToken: form.publicToken,
      isPublic: form.isPublic,
      createTaskOnSubmit: form.createTaskOnSubmit,
      responseCount: form._count?.responses ?? 0,
      createdAt: form.createdAt.toISOString(),
      fields: form.fields.map((field) => ({
        id: field.id,
        type: field.type,
        label: field.label,
        options: field.options,
        required: field.required,
        position: field.position,
      })),
    };
  }
}
