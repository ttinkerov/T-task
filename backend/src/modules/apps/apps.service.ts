import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, WorkspaceRole } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { ActivityService } from '../activity/activity.service';
import { ActivityAction, ActivityEntityType } from '../activity/activity.types';
import { CreateExternalAppDto } from './dto/create-external-app.dto';
import { normalizeExternalAppUrl } from './utils/external-app-url.util';

const MAX_APPS_PER_WORKSPACE = 50;

@Injectable()
export class AppsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspacesService: WorkspacesService,
    private readonly activityService: ActivityService,
  ) {}

  async list(workspaceId: string, userId: string) {
    await this.workspacesService.getWorkspaceForMember(workspaceId, userId);

    const apps = await this.prisma.workspaceExternalApp.findMany({
      where: { workspaceId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: {
          select: { id: true, name: true },
        },
      },
    });

    return apps.map((app) => this.serialize(app));
  }

  async create(workspaceId: string, userId: string, dto: CreateExternalAppDto) {
    await this.workspacesService.getWorkspaceForMember(workspaceId, userId);

    const appCount = await this.prisma.workspaceExternalApp.count({
      where: { workspaceId, deletedAt: null },
    });
    if (appCount >= MAX_APPS_PER_WORKSPACE) {
      throw new BadRequestException(
        `В рабочем пространстве можно добавить до ${MAX_APPS_PER_WORKSPACE} приложений`,
      );
    }

    let normalized: ReturnType<typeof normalizeExternalAppUrl>;
    try {
      normalized = normalizeExternalAppUrl(dto.url);
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : 'Некорректная ссылка');
    }

    try {
      const app = await this.prisma.$transaction(async (tx) => {
        const created = await tx.workspaceExternalApp.create({
          data: {
            workspaceId,
            createdById: userId,
            provider: normalized.provider,
            title: dto.title.trim(),
            sourceUrl: normalized.sourceUrl,
            embedUrl: normalized.embedUrl,
          },
          include: {
            createdBy: {
              select: { id: true, name: true },
            },
          },
        });
        await this.activityService.record({
          workspaceId,
          actorId: userId,
          action: ActivityAction.APP_CREATED,
          entityType: ActivityEntityType.APP,
          entityId: created.id,
          entityName: created.title,
          metadata: { provider: created.provider },
        });
        return created;
      });

      return this.serialize(app);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Это приложение уже добавлено');
      }
      throw error;
    }
  }

  async remove(workspaceId: string, appId: string, userId: string) {
    const membership = await this.workspacesService.getWorkspaceForMember(workspaceId, userId);
    const app = await this.prisma.workspaceExternalApp.findFirst({
      where: { id: appId, workspaceId, deletedAt: null },
    });

    if (!app) {
      throw new NotFoundException('Приложение не найдено');
    }

    const canDelete =
      app.createdById === userId ||
      membership.role === WorkspaceRole.ADMIN ||
      membership.role === WorkspaceRole.OWNER;

    if (!canDelete) {
      throw new ForbiddenException('Удалить приложение может автор или администратор');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.workspaceExternalApp.update({
        where: { id: app.id },
        data: { deletedAt: new Date() },
      });
      await this.activityService.record({
        workspaceId,
        actorId: userId,
        action: ActivityAction.APP_DELETED,
        entityType: ActivityEntityType.APP,
        entityId: app.id,
        entityName: app.title,
        metadata: { provider: app.provider },
      });
    });
    return { success: true };
  }

  private serialize(app: {
    id: string;
    provider: import('@prisma/client').ExternalAppProvider;
    title: string;
    sourceUrl: string;
    embedUrl: string;
    createdAt: Date;
    createdById: string | null;
    createdBy: { id: string; name: string } | null;
  }) {
    return {
      id: app.id,
      provider: app.provider,
      title: app.title,
      sourceUrl: app.sourceUrl,
      embedUrl: app.embedUrl,
      createdAt: app.createdAt.toISOString(),
      createdBy: app.createdBy,
    };
  }
}
