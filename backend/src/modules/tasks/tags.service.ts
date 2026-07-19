import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { SetTaskTagsDto } from './dto/set-task-tags.dto';
import { UpdateTagDto } from './dto/update-tag.dto';

const TAG_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;

@Injectable()
export class TagsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspacesService: WorkspacesService,
  ) {}

  async list(workspaceId: string, userId: string) {
    await this.workspacesService.getWorkspaceForMember(workspaceId, userId);
    return this.prisma.tag.findMany({
      where: { workspaceId },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, color: true },
    });
  }

  async create(workspaceId: string, userId: string, dto: CreateTagDto) {
    await this.workspacesService.getWorkspaceForMember(workspaceId, userId);
    const name = dto.name.trim();
    const color = this.normalizeColor(dto.color);

    const existing = await this.prisma.tag.findFirst({
      where: { workspaceId, name: { equals: name, mode: 'insensitive' } },
    });
    if (existing) {
      throw new ConflictException('Тег с таким названием уже существует');
    }

    return this.prisma.tag.create({
      data: { workspaceId, name, color },
      select: { id: true, name: true, color: true },
    });
  }

  async update(workspaceId: string, tagId: string, userId: string, dto: UpdateTagDto) {
    await this.workspacesService.getWorkspaceForMember(workspaceId, userId);
    const tag = await this.requireTag(workspaceId, tagId);

    const name = dto.name?.trim();
    if (name && name.toLowerCase() !== tag.name.toLowerCase()) {
      const existing = await this.prisma.tag.findFirst({
        where: {
          workspaceId,
          id: { not: tagId },
          name: { equals: name, mode: 'insensitive' },
        },
      });
      if (existing) {
        throw new ConflictException('Тег с таким названием уже существует');
      }
    }

    return this.prisma.tag.update({
      where: { id: tagId },
      data: {
        ...(name ? { name } : {}),
        ...(dto.color ? { color: this.normalizeColor(dto.color) } : {}),
      },
      select: { id: true, name: true, color: true },
    });
  }

  async remove(workspaceId: string, tagId: string, userId: string) {
    await this.workspacesService.getWorkspaceForMember(workspaceId, userId);
    await this.requireTag(workspaceId, tagId);
    await this.prisma.tag.delete({ where: { id: tagId } });
    return { deleted: true };
  }

  async setTaskTags(workspaceId: string, taskId: string, userId: string, dto: SetTaskTagsDto) {
    await this.workspacesService.getWorkspaceForMember(workspaceId, userId);

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

    const uniqueIds = [...new Set(dto.tagIds)];
    const tags = uniqueIds.length
      ? await this.prisma.tag.findMany({
          where: { workspaceId, id: { in: uniqueIds } },
          select: { id: true },
        })
      : [];

    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.taskTag.deleteMany({ where: { taskId } });
      if (tags.length > 0) {
        await tx.taskTag.createMany({
          data: tags.map((tag) => ({ taskId, tagId: tag.id })),
        });
      }
    });

    const assigned = await this.prisma.taskTag.findMany({
      where: { taskId },
      include: { tag: { select: { id: true, name: true, color: true } } },
      orderBy: { tag: { name: 'asc' } },
    });

    return assigned.map((entry) => entry.tag);
  }

  private async requireTag(workspaceId: string, tagId: string) {
    const tag = await this.prisma.tag.findFirst({ where: { id: tagId, workspaceId } });
    if (!tag) {
      throw new NotFoundException('Тег не найден');
    }
    return tag;
  }

  private normalizeColor(color?: string) {
    const value = (color ?? '#3B82F6').trim();
    if (!TAG_COLOR_PATTERN.test(value)) {
      throw new BadRequestException('Цвет тега должен быть в формате #RRGGBB');
    }
    return value.toUpperCase();
  }
}
