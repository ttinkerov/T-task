import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { CreateDealTemplateDto } from './dto/create-deal-template.dto';
import { UpdateDealTemplateDto } from './dto/update-deal-template.dto';

export type DealTemplateRecord = {
  id: string;
  workspaceId: string;
  name: string;
  title: string | null;
  description: string | null;
  amount: number | null;
  contactName: string | null;
  companyName: string | null;
  position: number;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class DealTemplatesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspacesService: WorkspacesService,
  ) {}

  async list(workspaceId: string, userId: string) {
    await this.workspacesService.getWorkspaceForMember(workspaceId, userId);
    const templates = await this.prisma.dealTemplate.findMany({
      where: { workspaceId },
      orderBy: { position: 'asc' },
    });
    return templates.map((template) => this.serialize(template));
  }

  async create(workspaceId: string, userId: string, dto: CreateDealTemplateDto) {
    await this.workspacesService.getWorkspaceForMember(workspaceId, userId);
    const last = await this.prisma.dealTemplate.findFirst({
      where: { workspaceId },
      orderBy: { position: 'desc' },
      select: { position: true },
    });

    const template = await this.prisma.dealTemplate.create({
      data: {
        workspaceId,
        name: dto.name.trim(),
        title: trimOrNull(dto.title),
        description: trimOrNull(dto.description),
        amount: dto.amount ?? null,
        contactName: trimOrNull(dto.contactName),
        companyName: trimOrNull(dto.companyName),
        position: (last?.position ?? -1) + 1,
      },
    });
    return this.serialize(template);
  }

  async update(
    workspaceId: string,
    templateId: string,
    userId: string,
    dto: UpdateDealTemplateDto,
  ) {
    await this.requireTemplate(workspaceId, templateId, userId);
    const template = await this.prisma.dealTemplate.update({
      where: { id: templateId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.title !== undefined ? { title: trimOrNull(dto.title) } : {}),
        ...(dto.description !== undefined ? { description: trimOrNull(dto.description) } : {}),
        ...(dto.amount !== undefined ? { amount: dto.amount } : {}),
        ...(dto.contactName !== undefined ? { contactName: trimOrNull(dto.contactName) } : {}),
        ...(dto.companyName !== undefined ? { companyName: trimOrNull(dto.companyName) } : {}),
      },
    });
    return this.serialize(template);
  }

  async remove(workspaceId: string, templateId: string, userId: string) {
    await this.requireTemplate(workspaceId, templateId, userId);
    await this.prisma.dealTemplate.delete({ where: { id: templateId } });
    return { deleted: true };
  }

  async seedDefaults(workspaceId: string, userId: string) {
    await this.workspacesService.getWorkspaceForMember(workspaceId, userId);
    const existing = await this.prisma.dealTemplate.findFirst({
      where: { workspaceId, name: 'Onboarding deal' },
      select: { id: true },
    });
    if (existing) {
      return this.list(workspaceId, userId);
    }

    await this.create(workspaceId, userId, {
      name: 'Onboarding deal',
      title: 'Онбординг клиента',
      description:
        '## Kickoff\n- Цели клиента\n- Стейкхолдеры\n- Срок пилота\n\n## Next steps\n- Доступ к системам\n- Первая демо-сессия\n',
      amount: 0,
      contactName: '',
      companyName: '',
    });
    return this.list(workspaceId, userId);
  }

  async getForApply(workspaceId: string, templateId: string): Promise<DealTemplateRecord> {
    const template = await this.prisma.dealTemplate.findFirst({
      where: { id: templateId, workspaceId },
    });
    if (!template) throw new NotFoundException('Шаблон сделки не найден');
    return template;
  }

  dealFieldDefaults(template: DealTemplateRecord) {
    return {
      title: trimOrNull(template.title),
      description: trimOrNull(template.description),
      amount: template.amount,
      contactName: trimOrNull(template.contactName),
      companyName: trimOrNull(template.companyName),
    };
  }

  fillEmptyDealFields(
    current: {
      title: string;
      description: string | null;
      amount: number | null;
      contactName: string | null;
      companyName: string | null;
    },
    defaults: ReturnType<DealTemplatesService['dealFieldDefaults']>,
  ) {
    return {
      ...(defaults.title && !current.title.trim() ? { title: defaults.title.slice(0, 200) } : {}),
      ...(defaults.description && !current.description?.trim()
        ? { description: defaults.description }
        : {}),
      ...(defaults.amount != null && current.amount == null ? { amount: defaults.amount } : {}),
      ...(defaults.contactName && !current.contactName?.trim()
        ? { contactName: defaults.contactName }
        : {}),
      ...(defaults.companyName && !current.companyName?.trim()
        ? { companyName: defaults.companyName }
        : {}),
    };
  }

  private async requireTemplate(workspaceId: string, templateId: string, userId: string) {
    await this.workspacesService.getWorkspaceForMember(workspaceId, userId);
    const template = await this.prisma.dealTemplate.findFirst({
      where: { id: templateId, workspaceId },
      select: { id: true },
    });
    if (!template) throw new NotFoundException('Шаблон сделки не найден');
    return template;
  }

  private serialize(template: DealTemplateRecord) {
    return {
      id: template.id,
      workspaceId: template.workspaceId,
      name: template.name,
      title: template.title,
      description: template.description,
      amount: template.amount,
      contactName: template.contactName,
      companyName: template.companyName,
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
