import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { FunnelsService } from '../funnels/funnels.service';
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
      throw new NotFoundException('Stage not found');
    }

    const lastDeal = await this.prisma.deal.findFirst({
      where: { stageId: stage.id },
      orderBy: { position: 'desc' },
    });

    const position = (lastDeal?.position ?? -1) + 1;

    const deal = await this.prisma.deal.create({
      data: {
        stageId: stage.id,
        title: dto.title.trim(),
        description: dto.description?.trim() || null,
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
        throw new BadRequestException('Assignee must be a workspace member');
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
      throw new NotFoundException('Stage not found');
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
      await tx.deal.delete({ where: { id: dealId } });
      await this.closeGap(tx, deal.stageId, deal.position);
    });

    return { success: true };
  }

  private async assertDealInWorkspace(workspaceId: string, dealId: string, userId: string) {
    await this.workspacesService.getWorkspaceForMember(workspaceId, userId);

    const deal = await this.prisma.deal.findFirst({
      where: {
        id: dealId,
        stage: { funnel: { workspaceId } },
      },
    });

    if (!deal) {
      throw new NotFoundException('Deal not found');
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
      where: { stageId },
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
    const deals = await tx.deal.findMany({
      where: { stageId, position: { gt: removedPosition } },
      orderBy: { position: 'asc' },
    });

    await Promise.all(
      deals.map((item) =>
        tx.deal.update({
          where: { id: item.id },
          data: { position: item.position - 1 },
        }),
      ),
    );
  }

  private async makeSpace(tx: Prisma.TransactionClient, stageId: string, position: number) {
    const deals = await tx.deal.findMany({
      where: { stageId, position: { gte: position } },
      orderBy: { position: 'desc' },
    });

    await Promise.all(
      deals.map((item) =>
        tx.deal.update({
          where: { id: item.id },
          data: { position: item.position + 1 },
        }),
      ),
    );
  }
}
