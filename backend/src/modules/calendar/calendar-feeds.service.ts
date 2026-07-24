import { createHash, randomBytes } from 'node:crypto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { ActivityService } from '../activity/activity.service';
import { ActivityAction, ActivityEntityType } from '../activity/activity.types';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { buildTaskCalendar, CalendarTask } from './utils/icalendar.util';

const FEED_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const MAX_FEED_TASKS = 2000;
const FEED_NOT_FOUND_MESSAGE = 'Calendar feed not found';

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

@Injectable()
export class CalendarFeedsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspacesService: WorkspacesService,
    private readonly activityService: ActivityService,
  ) {}

  async getStatus(workspaceId: string, userId: string) {
    await this.workspacesService.getWorkspaceForMember(workspaceId, userId);
    const feed = await this.prisma.calendarFeed.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
      select: {
        tokenPrefix: true,
        createdAt: true,
        updatedAt: true,
        revokedAt: true,
      },
    });

    if (!feed || feed.revokedAt) {
      return {
        enabled: false,
        tokenPrefix: null,
        createdAt: null,
        updatedAt: null,
      };
    }

    return {
      enabled: true,
      tokenPrefix: feed.tokenPrefix,
      createdAt: feed.createdAt.toISOString(),
      updatedAt: feed.updatedAt.toISOString(),
    };
  }

  async createOrRotate(workspaceId: string, userId: string) {
    await this.workspacesService.getWorkspaceForMember(workspaceId, userId);
    const token = randomBytes(32).toString('base64url');
    const tokenHash = hashToken(token);
    const tokenPrefix = token.slice(0, 8);
    const feed = await this.prisma.calendarFeed.upsert({
      where: { workspaceId_userId: { workspaceId, userId } },
      create: {
        workspaceId,
        userId,
        tokenHash,
        tokenPrefix,
      },
      update: {
        tokenHash,
        tokenPrefix,
        revokedAt: null,
      },
    });

    await this.activityService.record({
      workspaceId,
      actorId: userId,
      action: ActivityAction.CALENDAR_FEED_ROTATED,
      entityType: ActivityEntityType.CALENDAR,
      entityId: feed.id,
      entityName: 'Личный календарь',
    });

    return {
      enabled: true,
      tokenPrefix,
      feedPath: `/api/v1/calendar/feeds/${token}/calendar.ics`,
      createdAt: feed.createdAt.toISOString(),
      updatedAt: feed.updatedAt.toISOString(),
    };
  }

  async revoke(workspaceId: string, userId: string) {
    await this.workspacesService.getWorkspaceForMember(workspaceId, userId);
    const feed = await this.prisma.calendarFeed.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
      select: { id: true },
    });
    const revoked = await this.prisma.calendarFeed.updateMany({
      where: { workspaceId, userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    if (revoked.count > 0) {
      await this.activityService.record({
        workspaceId,
        actorId: userId,
        action: ActivityAction.CALENDAR_FEED_REVOKED,
        entityType: ActivityEntityType.CALENDAR,
        entityId: feed?.id,
        entityName: 'Личный календарь',
      });
    }

    return { success: true };
  }

  async getCalendar(token: string) {
    if (!FEED_TOKEN_PATTERN.test(token)) {
      throw new NotFoundException(FEED_NOT_FOUND_MESSAGE);
    }

    const feed = await this.prisma.calendarFeed.findUnique({
      where: { tokenHash: hashToken(token) },
      select: {
        workspaceId: true,
        userId: true,
        updatedAt: true,
        revokedAt: true,
        workspace: { select: { name: true, deletedAt: true, archivedAt: true } },
        user: { select: { name: true, deletedAt: true } },
      },
    });

    if (
      !feed ||
      feed.revokedAt ||
      feed.workspace.deletedAt ||
      feed.workspace.archivedAt ||
      feed.user.deletedAt
    ) {
      throw new NotFoundException(FEED_NOT_FOUND_MESSAGE);
    }

    const membership = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: feed.workspaceId,
          userId: feed.userId,
        },
      },
      select: { id: true },
    });

    if (!membership) {
      throw new NotFoundException(FEED_NOT_FOUND_MESSAGE);
    }

    const tasks = await this.prisma.task.findMany({
      where: {
        assigneeId: feed.userId,
        dueDate: { not: null },
        deletedAt: null,
        column: { board: { workspaceId: feed.workspaceId } },
      },
      orderBy: [{ dueDate: 'asc' }, { id: 'asc' }],
      take: MAX_FEED_TASKS,
      select: {
        id: true,
        title: true,
        description: true,
        dueDate: true,
        updatedAt: true,
        completedAt: true,
        column: { select: { board: { select: { name: true } } } },
      },
    });
    const calendarTasks: CalendarTask[] = tasks.flatMap((task) =>
      task.dueDate
        ? [
            {
              id: task.id,
              title: task.title,
              description: task.description,
              dueDate: task.dueDate,
              updatedAt: task.updatedAt,
              completedAt: task.completedAt,
              boardName: task.column.board.name,
            },
          ]
        : [],
    );
    const latestUpdate = calendarTasks.reduce(
      (latest, task) => (task.updatedAt > latest ? task.updatedAt : latest),
      feed.updatedAt,
    );

    return {
      content: buildTaskCalendar({
        calendarName: `T-task — ${feed.user.name} / ${feed.workspace.name}`,
        tasks: calendarTasks,
      }),
      lastModified: latestUpdate,
    };
  }
}
