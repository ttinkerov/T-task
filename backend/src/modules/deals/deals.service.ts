import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { FunnelsService } from '../funnels/funnels.service';
import { DealTemplatesService } from '../templates/deal-templates.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { CreateDealDto } from './dto/create-deal.dto';
import { MoveDealDto } from './dto/move-deal.dto';
import { UpdateDealDto } from './dto/update-deal.dto';

const dealWithAssignee = {
  assignee: {
    select: { id: true, name: true, email: true, avatarUrl: true },
  },
} as const;

@Injectable()
export class DealsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspacesService: WorkspacesService,
    private readonly funnelsService: FunnelsService,
    private readonly dealTemplatesService: DealTemplatesService,
  ) {}

  async create(workspaceId: string, userId: string, dto: CreateDealDto) {
    await this.workspacesService.getWorkspaceForMember(workspaceId, userId);

    const stage = await this.prisma.funnelStage.findFirst({
      where: {
        id: dto.stageId,
        funnel: { workspaceId },
      },
    });

    if (!stage) {
      throw new NotFoundException('Этап не найден');
    }

    const template = dto.templateId
      ? await this.dealTemplatesService.getForApply(workspaceId, dto.templateId)
      : null;
    const defaults = template ? this.dealTemplatesService.dealFieldDefaults(template) : null;

    const lastDeal = await this.prisma.deal.findFirst({
      where: { stageId: stage.id, deletedAt: null },
      orderBy: { position: 'desc' },
    });

    const position = (lastDeal?.position ?? -1) + 1;
    const title = (dto.title.trim() || defaults?.title || 'Новая сделка').slice(0, 200);

    const deal = await this.prisma.deal.create({
      data: {
        stageId: stage.id,
        title,
        description: dto.description?.trim() || defaults?.description || null,
        amount: defaults?.amount ?? null,
        contactName: defaults?.contactName ?? null,
        companyName: defaults?.companyName ?? null,
        position,
      },
      include: dealWithAssignee,
    });

    return this.funnelsService.serializeDeal(deal);
  }

  async update(workspaceId: string, dealId: string, userId: string, dto: UpdateDealDto) {
    const deal = await this.assertDealInWorkspace(workspaceId, dealId, userId);

    if (dto.assigneeId !== undefined && dto.assigneeId !== null) {
      const membership = await this.prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: { workspaceId, userId: dto.assigneeId },
        },
      });

      if (!membership) {
        throw new BadRequestException('Исполнитель должен быть участником пространства');
      }
    }

    const updated = await this.prisma.deal.update({
      where: { id: deal.id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
        ...(dto.description !== undefined ? { description: dto.description?.trim() || null } : {}),
        ...(dto.amount !== undefined ? { amount: dto.amount } : {}),
        ...(dto.contactName !== undefined ? { contactName: dto.contactName?.trim() || null } : {}),
        ...(dto.companyName !== undefined ? { companyName: dto.companyName?.trim() || null } : {}),
        ...(dto.assigneeId !== undefined ? { assigneeId: dto.assigneeId } : {}),
      },
      include: dealWithAssignee,
    });

    return this.funnelsService.serializeDeal(updated);
  }

  async move(workspaceId: string, dealId: string, userId: string, dto: MoveDealDto) {
    const deal = await this.assertDealInWorkspace(workspaceId, dealId, userId);

    const targetStage = await this.prisma.funnelStage.findFirst({
      where: {
        id: dto.stageId,
        funnel: { workspaceId },
      },
    });

    if (!targetStage) {
      throw new NotFoundException('Этап не найден');
    }

    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      if (deal.stageId === dto.stageId) {
        await this.reorderWithinStage(tx, deal.stageId, dealId, dto.position);
        return;
      }

      await this.closeGap(tx, deal.stageId, deal.position);
      await this.makeSpace(tx, dto.stageId, dto.position);
      await tx.deal.update({
        where: { id: dealId },
        data: {
          stageId: dto.stageId,
          position: dto.position,
        },
      });
    });

    const updated = await this.prisma.deal.findUniqueOrThrow({
      where: { id: dealId },
      include: dealWithAssignee,
    });

    return this.funnelsService.serializeDeal(updated);
  }

  async remove(workspaceId: string, dealId: string, userId: string) {
    const deal = await this.assertDealInWorkspace(workspaceId, dealId, userId);

    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.deal.update({
        where: { id: dealId },
        data: { deletedAt: new Date() },
      });
      await this.closeGap(tx, deal.stageId, deal.position);
    });

    return { success: true };
  }

  async applyTemplate(workspaceId: string, dealId: string, userId: string, templateId: string) {
    const deal = await this.assertDealInWorkspace(workspaceId, dealId, userId);
    const template = await this.dealTemplatesService.getForApply(workspaceId, templateId);
    const defaults = this.dealTemplatesService.dealFieldDefaults(template);
    const fieldPatch = this.dealTemplatesService.fillEmptyDealFields(deal, defaults);

    const updated = await this.prisma.deal.update({
      where: { id: dealId },
      data: fieldPatch,
      include: dealWithAssignee,
    });

    return this.funnelsService.serializeDeal(updated);
  }

  private async assertDealInWorkspace(workspaceId: string, dealId: string, userId: string) {
    await this.workspacesService.getWorkspaceForMember(workspaceId, userId);

    const deal = await this.prisma.deal.findFirst({
      where: {
        id: dealId,
        deletedAt: null,
        stage: { funnel: { workspaceId } },
      },
    });

    if (!deal) {
      throw new NotFoundException('Сделка не найдена');
    }

    return deal;
  }

  private async reorderWithinStage(
    tx: Prisma.TransactionClient,
    stageId: string,
    dealId: string,
    newPosition: number,
  ) {
    const deals = await tx.deal.findMany({
      where: { stageId, deletedAt: null },
      orderBy: { position: 'asc' },
    });

    const moving = deals.find((item) => item.id === dealId);
    if (!moving) return;

    const without = deals.filter((item) => item.id !== dealId);
    without.splice(newPosition, 0, moving);

    await Promise.all(
      without.map((item, index) =>
        tx.deal.update({
          where: { id: item.id },
          data: { position: index },
        }),
      ),
    );
  }

  private async closeGap(tx: Prisma.TransactionClient, stageId: string, removedPosition: number) {
    await tx.deal.updateMany({
      where: { stageId, deletedAt: null, position: { gt: removedPosition } },
      data: { position: { decrement: 1 } },
    });
  }

  private async makeSpace(tx: Prisma.TransactionClient, stageId: string, position: number) {
    await tx.deal.updateMany({
      where: { stageId, deletedAt: null, position: { gte: position } },
      data: { position: { increment: 1 } },
    });
  }
}
