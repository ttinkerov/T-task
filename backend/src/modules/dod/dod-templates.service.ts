import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { CreateDodTemplateDto } from './dto/create-dod-template.dto';
import { UpdateDodTemplateDto } from './dto/update-dod-template.dto';

@Injectable()
export class DodTemplatesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspacesService: WorkspacesService,
  ) {}

  async list(workspaceId: string, userId: string) {
    await this.workspacesService.getWorkspaceForMember(workspaceId, userId);
    const templates = await this.prisma.dodTemplate.findMany({
      where: { workspaceId },
      orderBy: { position: 'asc' },
      include: { items: { orderBy: { position: 'asc' } } },
    });
    return templates.map((template) => this.serialize(template));
  }

  async create(workspaceId: string, userId: string, dto: CreateDodTemplateDto) {
    await this.workspacesService.getWorkspaceForMember(workspaceId, userId);
    const last = await this.prisma.dodTemplate.findFirst({
      where: { workspaceId },
      orderBy: { position: 'desc' },
      select: { position: true },
    });

    const items = normalizeItems(dto.items ?? []);
    const template = await this.prisma.dodTemplate.create({
      data: {
        workspaceId,
        name: dto.name.trim(),
        gatesCompletion: dto.gatesCompletion ?? true,
        position: (last?.position ?? -1) + 1,
        items: {
          create: items.map((text, index) => ({ text, position: index })),
        },
      },
      include: { items: { orderBy: { position: 'asc' } } },
    });
    return this.serialize(template);
  }

  async update(workspaceId: string, templateId: string, userId: string, dto: UpdateDodTemplateDto) {
    await this.requireTemplate(workspaceId, templateId, userId);

    const template = await this.prisma.$transaction(async (tx) => {
      if (dto.items !== undefined) {
        await tx.dodTemplateItem.deleteMany({ where: { templateId } });
        const items = normalizeItems(dto.items);
        if (items.length > 0) {
          await tx.dodTemplateItem.createMany({
            data: items.map((text, index) => ({ templateId, text, position: index })),
          });
        }
      }

      return tx.dodTemplate.update({
        where: { id: templateId },
        data: {
          ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
          ...(dto.gatesCompletion !== undefined ? { gatesCompletion: dto.gatesCompletion } : {}),
        },
        include: { items: { orderBy: { position: 'asc' } } },
      });
    });

    return this.serialize(template);
  }

  async remove(workspaceId: string, templateId: string, userId: string) {
    await this.requireTemplate(workspaceId, templateId, userId);
    await this.prisma.dodTemplate.delete({ where: { id: templateId } });
    return { deleted: true };
  }

  private async requireTemplate(workspaceId: string, templateId: string, userId: string) {
    await this.workspacesService.getWorkspaceForMember(workspaceId, userId);
    const template = await this.prisma.dodTemplate.findFirst({
      where: { id: templateId, workspaceId },
      select: { id: true },
    });
    if (!template) throw new NotFoundException('Шаблон DoD не найден');
    return template;
  }

  private serialize(template: {
    id: string;
    workspaceId: string;
    name: string;
    gatesCompletion: boolean;
    position: number;
    createdAt: Date;
    updatedAt: Date;
    items: Array<{ id: string; text: string; position: number }>;
  }) {
    return {
      id: template.id,
      workspaceId: template.workspaceId,
      name: template.name,
      gatesCompletion: template.gatesCompletion,
      position: template.position,
      createdAt: template.createdAt.toISOString(),
      updatedAt: template.updatedAt.toISOString(),
      items: template.items.map((item) => ({
        id: item.id,
        text: item.text,
        position: item.position,
      })),
    };
  }
}

function normalizeItems(items: string[]) {
  return items.map((item) => item.trim()).filter(Boolean);
}
