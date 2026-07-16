import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { WorkspaceRole } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { sanitizeActivityMetadata } from './activity-metadata.util';
import { RecordActivityInput } from './activity.types';
import { ListActivityQueryDto } from './dto/list-activity-query.dto';

@Injectable()
export class ActivityService {
  private readonly logger = new Logger(ActivityService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Best-effort append-only write. Never throws — audit failure must not
   * abort the primary business operation.
   */
  async record(input: RecordActivityInput): Promise<void> {
    try {
      const actorName =
        input.actorName?.trim() ||
        (input.actorId
          ? (
              await this.prisma.user.findUnique({
                where: { id: input.actorId },
                select: { name: true },
              })
            )?.name
          : null) ||
        'Удалённый пользователь';

      await this.prisma.activityLog.create({
        data: {
          workspaceId: input.workspaceId,
          actorId: input.actorId ?? null,
          actorName,
          action: input.action,
          entityType: input.entityType,
          entityId: input.entityId ?? null,
          entityName: input.entityName?.slice(0, 200) ?? null,
          metadata: sanitizeActivityMetadata(input.metadata),
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to record activity ${input.action} for workspace ${input.workspaceId}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  async list(workspaceId: string, userId: string, query: ListActivityQueryDto) {
    const membership = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId, userId },
      },
      include: {
        workspace: {
          select: { deletedAt: true },
        },
      },
    });

    if (!membership || membership.workspace.deletedAt) {
      throw new NotFoundException('Workspace not found');
    }

    if (membership.role !== WorkspaceRole.OWNER && membership.role !== WorkspaceRole.ADMIN) {
      throw new ForbiddenException('Activity log is available to workspace administrators');
    }

    const page = query.page;
    const limit = query.limit;
    const where = { workspaceId };
    const [items, total] = await Promise.all([
      this.prisma.activityLog.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.activityLog.count({ where }),
    ]);

    return {
      items: items.map((item) => ({
        id: item.id,
        action: item.action,
        entityType: item.entityType,
        entityId: item.entityId,
        entityName: item.entityName,
        actorName: item.actorName,
        metadata: item.metadata,
        createdAt: item.createdAt.toISOString(),
      })),
      meta: { total, page, limit },
    };
  }
}
