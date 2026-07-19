import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, SavedFilterView } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { CreateSavedFilterDto } from './dto/create-saved-filter.dto';
import { UpdateSavedFilterDto } from './dto/update-saved-filter.dto';

@Injectable()
export class SavedFiltersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspacesService: WorkspacesService,
  ) {}

  async list(workspaceId: string, userId: string, view?: SavedFilterView) {
    await this.workspacesService.getWorkspaceForMember(workspaceId, userId);
    return this.prisma.savedFilter.findMany({
      where: { workspaceId, userId, ...(view ? { view } : {}) },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
      select: {
        id: true,
        view: true,
        name: true,
        filters: true,
        isDefault: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async create(workspaceId: string, userId: string, dto: CreateSavedFilterDto) {
    await this.workspacesService.getWorkspaceForMember(workspaceId, userId);
    const name = dto.name.trim();
    if (!name) throw new BadRequestException('Название фильтра обязательно');
    this.assertFiltersSize(dto.filters);

    return this.prisma.$transaction(async (tx) => {
      if (dto.isDefault) {
        await tx.savedFilter.updateMany({
          where: { workspaceId, userId, view: dto.view, isDefault: true },
          data: { isDefault: false },
        });
      }

      return tx.savedFilter.create({
        data: {
          workspaceId,
          userId,
          view: dto.view,
          name,
          filters: dto.filters as Prisma.InputJsonValue,
          isDefault: Boolean(dto.isDefault),
        },
        select: {
          id: true,
          view: true,
          name: true,
          filters: true,
          isDefault: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    });
  }

  async update(workspaceId: string, filterId: string, userId: string, dto: UpdateSavedFilterDto) {
    await this.requireOwnFilter(workspaceId, filterId, userId);
    if (dto.filters !== undefined) this.assertFiltersSize(dto.filters);

    return this.prisma.$transaction(async (tx) => {
      if (dto.isDefault) {
        const current = await tx.savedFilter.findUniqueOrThrow({ where: { id: filterId } });
        await tx.savedFilter.updateMany({
          where: {
            workspaceId,
            userId,
            view: current.view,
            isDefault: true,
            id: { not: filterId },
          },
          data: { isDefault: false },
        });
      }

      return tx.savedFilter.update({
        where: { id: filterId },
        data: {
          ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
          ...(dto.filters !== undefined ? { filters: dto.filters as Prisma.InputJsonValue } : {}),
          ...(dto.isDefault !== undefined ? { isDefault: dto.isDefault } : {}),
        },
        select: {
          id: true,
          view: true,
          name: true,
          filters: true,
          isDefault: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    });
  }

  async remove(workspaceId: string, filterId: string, userId: string) {
    await this.requireOwnFilter(workspaceId, filterId, userId);
    await this.prisma.savedFilter.delete({ where: { id: filterId } });
    return { deleted: true };
  }

  private async requireOwnFilter(workspaceId: string, filterId: string, userId: string) {
    await this.workspacesService.getWorkspaceForMember(workspaceId, userId);
    const filter = await this.prisma.savedFilter.findFirst({
      where: { id: filterId, workspaceId, userId },
    });
    if (!filter) throw new NotFoundException('Фильтр не найден');
    return filter;
  }

  private assertFiltersSize(filters: Record<string, unknown>) {
    const size = Buffer.byteLength(JSON.stringify(filters), 'utf8');
    if (size > 8_192) {
      throw new BadRequestException('Фильтр слишком большой');
    }
  }
}
