import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { CreateFunnelDto } from './dto/create-funnel.dto';
import { CreateStageDto } from './dto/create-stage.dto';
import { MoveStageDto } from './dto/move-stage.dto';
import { UpdateStageDto } from './dto/update-stage.dto';
import { createDefaultFunnel } from './utils/create-default-funnel.util';

const dealWithAssignee = {
  assignee: {
    select: { id: true, name: true, email: true, avatarUrl: true },
  },
} as const;

@Injectable()
export class FunnelsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspacesService: WorkspacesService,
  ) {}

  async listFunnels(workspaceId: string, userId: string) {
    await this.workspacesService.getWorkspaceForMember(workspaceId, userId);
    await this.ensureDefaultFunnel(workspaceId);

    const funnels = await this.prisma.funnel.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'asc' },
      select: { id: true, name: true, createdAt: true },
    });

    return funnels.map((funnel) => ({
      id: funnel.id,
      name: funnel.name,
      createdAt: funnel.createdAt.toISOString(),
    }));
  }

  async createFunnel(workspaceId: string, userId: string, dto: CreateFunnelDto) {
    await this.workspacesService.getWorkspaceForMember(workspaceId, userId);

    const funnel = await this.prisma.$transaction(async (tx) =>
      createDefaultFunnel(tx, workspaceId, dto.name.trim()),
    );

    return { id: funnel.id, name: funnel.name };
  }

  async getFunnel(workspaceId: string, funnelId: string, userId: string) {
    await this.workspacesService.getWorkspaceForMember(workspaceId, userId);

    const funnel = await this.prisma.funnel.findFirst({
      where: { id: funnelId, workspaceId },
      include: {
        stages: {
          orderBy: { position: 'asc' },
          include: {
            deals: {
              orderBy: { position: 'asc' },
              include: dealWithAssignee,
            },
          },
        },
      },
    });

    if (!funnel) {
      throw new NotFoundException('Funnel not found');
    }

    return {
      id: funnel.id,
      workspaceId: funnel.workspaceId,
      name: funnel.name,
      stages: funnel.stages.map((stage) => ({
        id: stage.id,
        name: stage.name,
        position: stage.position,
        deals: stage.deals.map((deal) => this.serializeDeal(deal)),
      })),
    };
  }

  async getFunnelForWorkspace(workspaceId: string, funnelId: string) {
    const funnel = await this.prisma.funnel.findFirst({
      where: { id: funnelId, workspaceId },
      select: { id: true },
    });

    if (!funnel) {
      throw new NotFoundException('Funnel not found');
    }

    return funnel;
  }

  async createStage(workspaceId: string, funnelId: string, userId: string, dto: CreateStageDto) {
    await this.workspacesService.getWorkspaceForMember(workspaceId, userId);
    await this.getFunnelForWorkspace(workspaceId, funnelId);

    const lastStage = await this.prisma.funnelStage.findFirst({
      where: { funnelId },
      orderBy: { position: 'desc' },
    });

    const stage = await this.prisma.funnelStage.create({
      data: {
        funnelId,
        name: dto.name.trim(),
        position: (lastStage?.position ?? -1) + 1,
      },
    });

    return {
      id: stage.id,
      name: stage.name,
      position: stage.position,
      deals: [],
    };
  }

  async updateStage(
    workspaceId: string,
    funnelId: string,
    stageId: string,
    userId: string,
    dto: UpdateStageDto,
  ) {
    await this.workspacesService.getWorkspaceForMember(workspaceId, userId);
    await this.getFunnelForWorkspace(workspaceId, funnelId);

    const stage = await this.prisma.funnelStage.findFirst({
      where: { id: stageId, funnelId },
    });

    if (!stage) {
      throw new NotFoundException('Stage not found');
    }

    const updated = await this.prisma.funnelStage.update({
      where: { id: stageId },
      data: { name: dto.name.trim() },
    });

    return {
      id: updated.id,
      name: updated.name,
      position: updated.position,
    };
  }

  async deleteStage(workspaceId: string, funnelId: string, stageId: string, userId: string) {
    await this.workspacesService.getWorkspaceForMember(workspaceId, userId);
    await this.getFunnelForWorkspace(workspaceId, funnelId);

    const stage = await this.prisma.funnelStage.findFirst({
      where: { id: stageId, funnelId },
    });

    if (!stage) {
      throw new NotFoundException('Stage not found');
    }

    const stageCount = await this.prisma.funnelStage.count({ where: { funnelId } });
    if (stageCount <= 1) {
      throw new BadRequestException('Cannot delete the last stage');
    }

    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.funnelStage.delete({ where: { id: stageId } });

      const remaining = await tx.funnelStage.findMany({
        where: { funnelId },
        orderBy: { position: 'asc' },
      });

      await Promise.all(
        remaining.map((item, index) =>
          tx.funnelStage.update({
            where: { id: item.id },
            data: { position: index },
          }),
        ),
      );
    });

    return { success: true };
  }

  async moveStage(
    workspaceId: string,
    funnelId: string,
    stageId: string,
    userId: string,
    dto: MoveStageDto,
  ) {
    await this.workspacesService.getWorkspaceForMember(workspaceId, userId);
    await this.getFunnelForWorkspace(workspaceId, funnelId);

    const stage = await this.prisma.funnelStage.findFirst({
      where: { id: stageId, funnelId },
    });

    if (!stage) {
      throw new NotFoundException('Stage not found');
    }

    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await this.reorderStages(tx, funnelId, stageId, dto.position);
    });

    const updated = await this.prisma.funnelStage.findUniqueOrThrow({ where: { id: stageId } });

    return {
      id: updated.id,
      name: updated.name,
      position: updated.position,
    };
  }

  serializeDeal(deal: {
    id: string;
    title: string;
    description: string | null;
    amount: number | null;
    contactName: string | null;
    companyName: string | null;
    assigneeId: string | null;
    position: number;
    stageId: string;
    createdAt: Date;
    assignee?: {
      id: string;
      name: string;
      email: string;
      avatarUrl: string | null;
    } | null;
  }) {
    return {
      id: deal.id,
      title: deal.title,
      description: deal.description,
      amount: deal.amount,
      contactName: deal.contactName,
      companyName: deal.companyName,
      assigneeId: deal.assigneeId ?? null,
      assignee: deal.assignee
        ? {
            id: deal.assignee.id,
            name: deal.assignee.name,
            email: deal.assignee.email,
            avatarUrl: deal.assignee.avatarUrl,
          }
        : null,
      position: deal.position,
      stageId: deal.stageId,
      createdAt: deal.createdAt.toISOString(),
    };
  }

  private async ensureDefaultFunnel(workspaceId: string) {
    const count = await this.prisma.funnel.count({ where: { workspaceId } });
    if (count > 0) {
      return;
    }

    await this.prisma.$transaction(async (tx) => createDefaultFunnel(tx, workspaceId));
  }

  private async reorderStages(
    tx: Prisma.TransactionClient,
    funnelId: string,
    stageId: string,
    newPosition: number,
  ) {
    const stages = await tx.funnelStage.findMany({
      where: { funnelId },
      orderBy: { position: 'asc' },
    });

    const moving = stages.find((item) => item.id === stageId);
    if (!moving) return;

    const without = stages.filter((item) => item.id !== stageId);
    without.splice(newPosition, 0, moving);

    await Promise.all(
      without.map((item, index) =>
        tx.funnelStage.update({
          where: { id: item.id },
          data: { position: index },
        }),
      ),
    );
  }
}
