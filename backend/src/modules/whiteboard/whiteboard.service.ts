import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { UpsertWhiteboardDto } from './dto/upsert-whiteboard.dto';

const MAX_SNAPSHOT_BYTES = 2 * 1024 * 1024;

@Injectable()
export class WhiteboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspacesService: WorkspacesService,
  ) {}

  async get(workspaceId: string, userId: string) {
    await this.workspacesService.getWorkspaceForMember(workspaceId, userId);

    const row = await this.prisma.workspaceWhiteboard.findUnique({
      where: { workspaceId },
      include: {
        updatedBy: { select: { id: true, name: true } },
      },
    });

    if (!row) {
      return {
        snapshot: null as Record<string, unknown> | null,
        updatedAt: null as string | null,
        updatedBy: null as { id: string; name: string } | null,
      };
    }

    return this.serialize(row);
  }

  async upsert(workspaceId: string, userId: string, dto: UpsertWhiteboardDto) {
    await this.workspacesService.getWorkspaceForMember(workspaceId, userId);

    const snapshot = this.assertSnapshot(dto.snapshot);

    const row = await this.prisma.workspaceWhiteboard.upsert({
      where: { workspaceId },
      create: {
        workspaceId,
        snapshot,
        updatedById: userId,
      },
      update: {
        snapshot,
        updatedById: userId,
      },
      include: {
        updatedBy: { select: { id: true, name: true } },
      },
    });

    return this.serialize(row);
  }

  private assertSnapshot(snapshot: Record<string, unknown>): Prisma.InputJsonValue {
    let serialized: string;
    try {
      serialized = JSON.stringify(snapshot);
    } catch {
      throw new BadRequestException('Снимок доски не сериализуется');
    }

    if (serialized.length > MAX_SNAPSHOT_BYTES) {
      throw new BadRequestException(
        `Снимок доски слишком большой (макс. ${Math.floor(MAX_SNAPSHOT_BYTES / (1024 * 1024))} МБ)`,
      );
    }

    return snapshot as Prisma.InputJsonValue;
  }

  private serialize(row: {
    snapshot: Prisma.JsonValue;
    updatedAt: Date;
    updatedBy: { id: string; name: string } | null;
  }) {
    return {
      snapshot:
        row.snapshot && typeof row.snapshot === 'object' && !Array.isArray(row.snapshot)
          ? (row.snapshot as Record<string, unknown>)
          : ({} as Record<string, unknown>),
      updatedAt: row.updatedAt.toISOString(),
      updatedBy: row.updatedBy,
    };
  }
}
