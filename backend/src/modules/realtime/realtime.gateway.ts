import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { OnEvent } from '@nestjs/event-emitter';
import { Server, Socket } from 'socket.io';
import {
  CommentCreatedPayload,
  DealCreatedPayload,
  DealMovedPayload,
  DomainEvents,
  TaskAssignedPayload,
  TaskMovedPayload,
  UserAccessRevokedPayload,
  WorkspaceMemberRemovedPayload,
} from '../../common/events/domain-events';
import { TokenExtractorService } from '../../common/auth/services/token-extractor.service';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { WorkspaceRole } from '@prisma/client';

type AuthedSocket = Socket & {
  data: {
    userId?: string;
  };
};

function resolveWsCorsOrigins(): string[] {
  return (process.env.CORS_ORIGIN ?? 'http://localhost')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

@WebSocketGateway({
  cors: {
    origin: resolveWsCorsOrigins(),
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(RealtimeGateway.name);
  private readonly socketsByUser = new Map<string, Set<string>>();

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly tokenExtractor: TokenExtractorService,
    private readonly prisma: PrismaService,
  ) {}

  async handleConnection(client: AuthedSocket) {
    try {
      const cookieHeader = client.handshake.headers.cookie ?? '';
      const token = parseCookie(cookieHeader, 'access_token');
      if (!token) {
        client.disconnect(true);
        return;
      }

      const payload = await this.tokenExtractor.verifyAccessTokenAsync(token);
      client.data.userId = payload.sub;
      this.trackSocket(payload.sub, client.id);
    } catch (error) {
      this.logger.debug(`WS auth failed: ${error instanceof Error ? error.message : 'unknown'}`);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: AuthedSocket) {
    const userId = client.data.userId;
    if (!userId) return;
    const sockets = this.socketsByUser.get(userId);
    if (!sockets) return;
    sockets.delete(client.id);
    if (sockets.size === 0) {
      this.socketsByUser.delete(userId);
    }
  }

  @SubscribeMessage('workspace:join')
  async joinWorkspace(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() body: { workspaceId?: string },
  ) {
    const userId = client.data.userId;
    const workspaceId = body?.workspaceId?.trim();
    if (!userId || !workspaceId) {
      return { ok: false };
    }

    const membership = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
      include: {
        workspace: { select: { deletedAt: true, archivedAt: true } },
      },
    });

    if (!membership || membership.workspace.deletedAt) {
      return { ok: false };
    }

    if (membership.workspace.archivedAt) {
      const isAdmin =
        membership.role === WorkspaceRole.OWNER || membership.role === WorkspaceRole.ADMIN;
      if (!isAdmin) {
        return { ok: false };
      }
    }

    await client.join(roomName(workspaceId));

    const stillMember = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
      select: { id: true },
    });
    if (!stillMember) {
      await client.leave(roomName(workspaceId));
      return { ok: false };
    }

    return { ok: true };
  }

  @OnEvent(DomainEvents.USER_ACCESS_REVOKED)
  onUserAccessRevoked(payload: UserAccessRevokedPayload) {
    const sockets = this.socketsByUser.get(payload.userId);
    if (!sockets?.size) return;
    for (const socketId of sockets) {
      this.server.in(socketId).disconnectSockets(true);
    }
    this.socketsByUser.delete(payload.userId);
  }

  @OnEvent(DomainEvents.WORKSPACE_MEMBER_REMOVED)
  onWorkspaceMemberRemoved(payload: WorkspaceMemberRemovedPayload) {
    const sockets = this.socketsByUser.get(payload.userId);
    if (!sockets?.size) return;
    const room = roomName(payload.workspaceId);
    for (const socketId of sockets) {
      this.server.in(socketId).socketsLeave(room);
    }
  }

  @OnEvent(DomainEvents.TASK_MOVED)
  onTaskMoved(payload: TaskMovedPayload) {
    this.server.to(roomName(payload.workspaceId)).emit(DomainEvents.TASK_MOVED, payload);
  }

  @OnEvent(DomainEvents.TASK_ASSIGNED)
  onTaskAssigned(payload: TaskAssignedPayload) {
    this.server.to(roomName(payload.workspaceId)).emit(DomainEvents.TASK_ASSIGNED, payload);
  }

  @OnEvent(DomainEvents.COMMENT_CREATED)
  onCommentCreated(payload: CommentCreatedPayload) {
    this.server.to(roomName(payload.workspaceId)).emit(DomainEvents.COMMENT_CREATED, payload);
  }

  @OnEvent(DomainEvents.DEAL_CREATED)
  onDealCreated(payload: DealCreatedPayload) {
    this.server.to(roomName(payload.workspaceId)).emit(DomainEvents.DEAL_CREATED, payload);
  }

  @OnEvent(DomainEvents.DEAL_MOVED)
  onDealMoved(payload: DealMovedPayload) {
    this.server.to(roomName(payload.workspaceId)).emit(DomainEvents.DEAL_MOVED, payload);
  }

  private trackSocket(userId: string, socketId: string) {
    const existing = this.socketsByUser.get(userId) ?? new Set<string>();
    existing.add(socketId);
    this.socketsByUser.set(userId, existing);
  }
}

function roomName(workspaceId: string) {
  return `ws:${workspaceId}`;
}

function parseCookie(header: string, name: string): string | null {
  const parts = header.split(';');
  for (const part of parts) {
    const [rawKey, ...rest] = part.trim().split('=');
    if (rawKey === name) {
      return decodeURIComponent(rest.join('='));
    }
  }
  return null;
}
