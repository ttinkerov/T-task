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
  DomainEvents,
  TaskAssignedPayload,
  TaskMovedPayload,
} from '../../common/events/domain-events';
import { TokenExtractorService } from '../../common/auth/services/token-extractor.service';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

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

      const payload = this.tokenExtractor.verifyAccessToken(token);
      client.data.userId = payload.sub;
    } catch (error) {
      this.logger.debug(`WS auth failed: ${error instanceof Error ? error.message : 'unknown'}`);
      client.disconnect(true);
    }
  }

  handleDisconnect(_client: AuthedSocket) {
    // rooms cleaned automatically
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
      select: { id: true },
    });

    if (!membership) {
      return { ok: false };
    }

    await client.join(roomName(workspaceId));
    return { ok: true };
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
}

function roomName(workspaceId: string) {
  return `ws:${workspaceId}`;
}

function parseCookie(header: string, name: string): string | null {
  const parts = header.split(';');
  for (const part of parts) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) {
      return decodeURIComponent(rest.join('='));
    }
  }
  return null;
}
