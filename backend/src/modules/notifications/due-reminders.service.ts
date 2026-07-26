import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotificationType, Prisma } from '@prisma/client';
import { DomainEvents } from '../../common/events/domain-events';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { RedisService } from '../../infrastructure/redis/redis.service';
import { countOverdueDays, isTaskOverdue, nextRolledDueDate } from '../boards/utils/overdue.util';

const DUE_REMINDER_WINDOW_MS = 24 * 60 * 60 * 1000;
const TICK_INTERVAL_MS = 60_000;
const TICK_LOCK_KEY = 'jobs:due-reminders:tick';
const TICK_LOCK_TTL_SECONDS = 55;
const BATCH_SIZE = 200;

@Injectable()
export class DueRemindersService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DueRemindersService.name);
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  onModuleInit() {
    this.timer = setInterval(() => {
      void this.tick();
    }, TICK_INTERVAL_MS);
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  async tick() {
    const locked = await this.tryLock();
    if (!locked) return;

    try {
      const reminders = await this.syncBatch();
      const rolled = await this.rollOverdueBatch();
      if (reminders > 0 || rolled > 0) {
        this.logger.log(`due-jobs: reminders=${reminders} overdueRolled=${rolled}`);
      }
    } catch (error) {
      this.logger.error('due-jobs tick failed', error instanceof Error ? error.stack : error);
    }
  }

  async syncBatch(limit = BATCH_SIZE) {
    const now = new Date();
    const until = new Date(now.getTime() + DUE_REMINDER_WINDOW_MS);

    const tasks = await this.prisma.task.findMany({
      where: {
        deletedAt: null,
        completedAt: null,
        assigneeId: { not: null },
        dueDate: { gte: now, lte: until },
        dueReminderSentAt: null,
        assignee: { deletedAt: null },
        column: {
          board: {
            workspace: { deletedAt: null, archivedAt: null },
          },
        },
      },
      select: {
        id: true,
        title: true,
        assigneeId: true,
        dueDate: true,
        column: { select: { board: { select: { workspaceId: true } } } },
      },
      take: limit,
      orderBy: { dueDate: 'asc' },
    });

    if (tasks.length === 0) return 0;

    const memberships = await this.prisma.workspaceMember.findMany({
      where: {
        OR: tasks.map((task) => ({
          workspaceId: task.column.board.workspaceId,
          userId: task.assigneeId!,
        })),
      },
      select: { workspaceId: true, userId: true },
    });
    const memberKeys = new Set(memberships.map((row) => `${row.workspaceId}:${row.userId}`));
    const eligible = tasks.filter((task) =>
      memberKeys.has(`${task.column.board.workspaceId}:${task.assigneeId}`),
    );

    if (eligible.length === 0) return 0;

    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.notification.createMany({
        data: eligible.map((task) => ({
          workspaceId: task.column.board.workspaceId,
          recipientId: task.assigneeId!,
          actorId: null,
          taskId: task.id,
          type: NotificationType.DUE_REMINDER,
          sourceType: null,
          preview: `Скоро дедлайн: ${task.title}`,
        })),
        skipDuplicates: true,
      });

      await tx.task.updateMany({
        where: { id: { in: eligible.map((task) => task.id) } },
        data: { dueReminderSentAt: now },
      });
    });

    const assignees = await this.prisma.user.findMany({
      where: { id: { in: [...new Set(eligible.map((task) => task.assigneeId!))] } },
      select: { id: true, email: true, name: true },
    });
    const byId = new Map(assignees.map((user) => [user.id, user]));

    for (const task of eligible) {
      const assignee = byId.get(task.assigneeId!);
      if (!assignee || !task.dueDate) continue;
      this.eventEmitter.emit(DomainEvents.DUE_REMINDER, {
        workspaceId: task.column.board.workspaceId,
        taskId: task.id,
        taskTitle: task.title,
        recipientEmail: assignee.email,
        recipientName: assignee.name,
        dueDate: task.dueDate.toISOString(),
      });
    }

    return eligible.length;
  }

  async rollOverdueBatch(limit = BATCH_SIZE) {
    const workspaces = await this.prisma.workspace.findMany({
      where: {
        autoRollOverdue: true,
        deletedAt: null,
        archivedAt: null,
      },
      select: { id: true },
      take: 50,
    });
    if (workspaces.length === 0) return 0;

    let rolled = 0;
    for (const workspace of workspaces) {
      const boards = await this.prisma.board.findMany({
        where: { workspaceId: workspace.id },
        select: {
          columns: {
            orderBy: { position: 'asc' },
            select: {
              id: true,
              name: true,
              position: true,
              tasks: {
                where: { deletedAt: null, dueDate: { not: null }, completedAt: null },
                select: { id: true, dueDate: true },
                take: limit,
              },
            },
          },
        },
      });

      for (const board of boards) {
        const columns = board.columns;
        const updates: Array<ReturnType<typeof this.prisma.task.update>> = [];
        for (const column of columns) {
          for (const task of column.tasks) {
            if (!isTaskOverdue(task, column, columns)) continue;
            updates.push(
              this.prisma.task.update({
                where: { id: task.id },
                data: {
                  dueDate: nextRolledDueDate(),
                  overdueDays: countOverdueDays(task.dueDate!),
                },
              }),
            );
          }
        }
        if (updates.length > 0) {
          await Promise.all(updates);
          rolled += updates.length;
        }
      }
    }

    return rolled;
  }

  private async tryLock(): Promise<boolean> {
    try {
      const client = this.redisService.getClient();
      if (client.status !== 'ready') {
        await client.connect().catch(() => undefined);
      }
      const result = await client.set(TICK_LOCK_KEY, '1', 'EX', TICK_LOCK_TTL_SECONDS, 'NX');
      return result === 'OK';
    } catch {
      return true;
    }
  }
}
