import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { BoardsService } from '../boards/boards.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { ImportColumnMappingDto, ImportTasksDto } from './dto/import-tasks.dto';

export type ImportRowResult = {
  index: number;
  title: string;
  status: 'created' | 'skipped';
  reason?: string;
  warnings: string[];
};

@Injectable()
export class ImportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspacesService: WorkspacesService,
    private readonly boardsService: BoardsService,
  ) {}

  async importTasks(workspaceId: string, userId: string, dto: ImportTasksDto) {
    await this.workspacesService.getWorkspaceForMember(workspaceId, userId);

    const defaultBoard = await this.boardsService.getBoardForWorkspace(workspaceId);
    const boardId = dto.boardId ?? defaultBoard.id;

    if (dto.boardId) {
      const owned = await this.prisma.board.findFirst({
        where: { id: dto.boardId, workspaceId },
        select: { id: true },
      });
      if (!owned) {
        throw new BadRequestException('Доска не найдена в этом пространстве');
      }
    }

    const members = await this.prisma.workspaceMember.findMany({
      where: { workspaceId, user: { deletedAt: null } },
      select: {
        userId: true,
        user: { select: { email: true, name: true } },
      },
    });

    const results: ImportRowResult[] = [];
    let created = 0;
    let skipped = 0;

    await this.prisma.$transaction(
      async (tx) => {
        const columns = await tx.boardColumn.findMany({
          where: { boardId },
          orderBy: { position: 'asc' },
          select: { id: true, name: true, position: true },
        });

        const statusToColumn = await this.resolveColumnMappings(
          tx,
          boardId,
          columns,
          dto.columnMappings,
        );

        const existingTags = await tx.tag.findMany({
          where: { workspaceId },
          select: { id: true, name: true },
        });
        const tagByName = new Map(existingTags.map((tag) => [tag.name.toLowerCase(), tag.id]));

        const neededLabels = new Set<string>();
        for (const row of dto.rows) {
          for (const label of row.labels ?? []) {
            const name = label.trim();
            if (name) neededLabels.add(name);
          }
        }

        for (const label of neededLabels) {
          const key = label.toLowerCase();
          if (tagByName.has(key)) continue;
          try {
            const tag = await tx.tag.create({
              data: { workspaceId, name: label, color: '#3B82F6' },
              select: { id: true, name: true },
            });
            tagByName.set(tag.name.toLowerCase(), tag.id);
          } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
              const existing = await tx.tag.findFirst({
                where: { workspaceId, name: { equals: label, mode: 'insensitive' } },
                select: { id: true, name: true },
              });
              if (existing) {
                tagByName.set(existing.name.toLowerCase(), existing.id);
                continue;
              }
            }
            throw error;
          }
        }

        const nextPositionByColumn = new Map<string, number>();
        for (const columnId of new Set(statusToColumn.values())) {
          const last = await tx.task.findFirst({
            where: { columnId, deletedAt: null },
            orderBy: { position: 'desc' },
            select: { position: true },
          });
          nextPositionByColumn.set(columnId, (last?.position ?? -1) + 1);
        }

        for (const [index, row] of dto.rows.entries()) {
          const warnings: string[] = [];
          const title = row.title.trim();
          if (!title) {
            skipped += 1;
            results.push({
              index,
              title: '',
              status: 'skipped',
              reason: 'Пустой заголовок',
              warnings,
            });
            continue;
          }

          const columnId = statusToColumn.get(row.status.trim().toLowerCase());
          if (!columnId) {
            skipped += 1;
            results.push({
              index,
              title,
              status: 'skipped',
              reason: `Статус «${row.status}» не сопоставлен с колонкой`,
              warnings,
            });
            continue;
          }

          const assigneeId = this.resolveAssignee(row.assignee, members, warnings);
          let dueDate: Date | null = null;
          if (row.dueDate) {
            const parsed = new Date(row.dueDate);
            if (Number.isNaN(parsed.getTime())) {
              warnings.push('Некорректная дата — пропущена');
            } else {
              dueDate = parsed;
            }
          }

          const position = nextPositionByColumn.get(columnId) ?? 0;
          nextPositionByColumn.set(columnId, position + 1);

          const task = await tx.task.create({
            data: {
              columnId,
              title: title.slice(0, 200),
              description: row.description?.trim() ? row.description.trim().slice(0, 2000) : null,
              priority: row.priority ?? null,
              dueDate,
              assigneeId,
              position,
            },
            select: { id: true },
          });

          const labelIds = [
            ...new Set(
              (row.labels ?? [])
                .map((label) => tagByName.get(label.trim().toLowerCase()))
                .filter((id): id is string => Boolean(id)),
            ),
          ];
          if (labelIds.length > 0) {
            await tx.taskTag.createMany({
              data: labelIds.map((tagId) => ({ taskId: task.id, tagId })),
              skipDuplicates: true,
            });
          }

          created += 1;
          results.push({ index, title, status: 'created', warnings });
        }
      },
      { maxWait: 10_000, timeout: 120_000 },
    );

    return {
      boardId,
      created,
      skipped,
      total: dto.rows.length,
      results,
    };
  }

  private async resolveColumnMappings(
    tx: Prisma.TransactionClient,
    boardId: string,
    columns: Array<{ id: string; name: string; position: number }>,
    mappings: ImportColumnMappingDto[],
  ) {
    const columnIds = new Set(columns.map((column) => column.id));
    let nextPosition = columns.reduce((max, column) => Math.max(max, column.position), -1) + 1;
    const resolved = new Map<string, string>();

    for (const mapping of mappings) {
      const status = mapping.status.trim();
      if (!status) continue;

      if (mapping.columnId) {
        if (!columnIds.has(mapping.columnId)) {
          throw new BadRequestException(`Колонка ${mapping.columnId} не найдена на доске`);
        }
        resolved.set(status.toLowerCase(), mapping.columnId);
        continue;
      }

      if (mapping.newColumnName?.trim()) {
        const name = mapping.newColumnName.trim();
        const existing = columns.find((column) => column.name.toLowerCase() === name.toLowerCase());
        if (existing) {
          resolved.set(status.toLowerCase(), existing.id);
          continue;
        }

        const created = await tx.boardColumn.create({
          data: {
            boardId,
            name,
            position: nextPosition,
          },
          select: { id: true, name: true, position: true },
        });
        nextPosition += 1;
        columns.push(created);
        columnIds.add(created.id);
        resolved.set(status.toLowerCase(), created.id);
        continue;
      }

      throw new BadRequestException(`Для статуса «${status}» укажите columnId или newColumnName`);
    }

    return resolved;
  }

  private resolveAssignee(
    assignee: string | undefined,
    members: Array<{ userId: string; user: { email: string; name: string } }>,
    warnings: string[],
  ): string | null {
    if (!assignee?.trim()) return null;
    const query = assignee.trim().toLowerCase();
    const byEmail = members.find((member) => member.user.email.toLowerCase() === query);
    if (byEmail) return byEmail.userId;
    const nameMatches = members.filter((member) => member.user.name.toLowerCase() === query);
    if (nameMatches.length === 1) return nameMatches[0].userId;
    if (nameMatches.length > 1) {
      warnings.push(`Исполнитель «${assignee}» неоднозначен — задача без assignee`);
      return null;
    }
    warnings.push(`Исполнитель «${assignee}» не найден — задача без assignee`);
    return null;
  }
}
