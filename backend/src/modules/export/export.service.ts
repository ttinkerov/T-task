import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { toCsv } from './csv.util';

const EXPORT_ROW_CAP = 5000;

@Injectable()
export class ExportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspacesService: WorkspacesService,
  ) {}

  async tasksCsv(workspaceId: string, userId: string): Promise<string> {
    await this.workspacesService.getWorkspaceForMember(workspaceId, userId);

    const tasks = await this.prisma.task.findMany({
      where: {
        deletedAt: null,
        column: { board: { workspaceId } },
      },
      select: {
        id: true,
        title: true,
        priority: true,
        dueDate: true,
        completedAt: true,
        createdAt: true,
        assignee: { select: { email: true, name: true } },
        column: { select: { name: true, board: { select: { name: true } } } },
      },
      orderBy: { updatedAt: 'desc' },
      take: EXPORT_ROW_CAP,
    });

    return toCsv(
      [
        'id',
        'title',
        'board',
        'column',
        'assignee',
        'priority',
        'dueDate',
        'completedAt',
        'createdAt',
      ],
      tasks.map((task) => [
        task.id,
        task.title,
        task.column.board.name,
        task.column.name,
        task.assignee?.email ?? '',
        task.priority ?? '',
        task.dueDate?.toISOString() ?? '',
        task.completedAt?.toISOString() ?? '',
        task.createdAt.toISOString(),
      ]),
    );
  }

  async dealsCsv(workspaceId: string, userId: string): Promise<string> {
    await this.workspacesService.getWorkspaceForMember(workspaceId, userId);

    const deals = await this.prisma.deal.findMany({
      where: {
        deletedAt: null,
        stage: { funnel: { workspaceId } },
      },
      select: {
        id: true,
        title: true,
        amount: true,
        contactName: true,
        companyName: true,
        createdAt: true,
        assignee: { select: { email: true } },
        stage: { select: { name: true, funnel: { select: { name: true } } } },
      },
      orderBy: { updatedAt: 'desc' },
      take: EXPORT_ROW_CAP,
    });

    return toCsv(
      ['id', 'title', 'funnel', 'stage', 'amount', 'contact', 'company', 'assignee', 'createdAt'],
      deals.map((deal) => [
        deal.id,
        deal.title,
        deal.stage.funnel.name,
        deal.stage.name,
        deal.amount?.toString() ?? '',
        deal.contactName ?? '',
        deal.companyName ?? '',
        deal.assignee?.email ?? '',
        deal.createdAt.toISOString(),
      ]),
    );
  }
}
