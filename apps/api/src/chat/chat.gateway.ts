import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '@/prisma/prisma.service';
import { JwtPayload } from '@/auth/types/jwt-payload.type';

export type ChatMessagePayload = {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: Date;
  messageType: string;
};

@WebSocketGateway({ namespace: '/chat' })
export class ChatGateway implements OnGatewayInit {
  private readonly logger = new Logger(ChatGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  afterInit(server: Server) {
    server.use(async (socket, next) => {
      try {
        const raw =
          (socket.handshake.auth as { token?: string })?.token ??
          (socket.handshake.query?.token as string | undefined);
        if (!raw || typeof raw !== 'string') {
          return next(new Error('Unauthorized'));
        }
        const token = raw.replace(/^Bearer\s+/i, '');
        const payload = this.jwt.verify<JwtPayload>(token, {
          secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        });
        const user = await this.prisma.user.findUnique({
          where: { id: payload.sub },
          select: {
            id: true,
            isActive: true,
            isSuspended: true,
            refreshTokenVersion: true,
          },
        });
        if (!user?.isActive || user.isSuspended) {
          return next(new Error('Unauthorized'));
        }
        if (
          payload.rtv == null ||
          payload.rtv !== user.refreshTokenVersion
        ) {
          return next(new Error('Unauthorized'));
        }
        socket.data.userId = payload.sub;
        return next();
      } catch (e) {
        this.logger.debug(`WS auth failed: ${(e as Error).message}`);
        return next(new Error('Unauthorized'));
      }
    });
  }

  @OnEvent('chat.message')
  handleChatMessage(event: { conversationId: string; message: ChatMessagePayload }) {
    this.server
      .to(`conv:${event.conversationId}`)
      .emit('message', event.message);
  }

  @SubscribeMessage('join')
  async join(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { conversationId: string },
  ) {
    const userId = client.data.userId as string | undefined;
    if (!userId || !body?.conversationId) {
      return { ok: false, error: 'bad_request' };
    }
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { isActive: true, isSuspended: true },
    });
    if (!user?.isActive || user.isSuspended) {
      return { ok: false, error: 'forbidden' };
    }
    const part = await this.prisma.conversationParticipant.findFirst({
      where: { conversationId: body.conversationId, userId },
    });
    if (!part) {
      return { ok: false, error: 'forbidden' };
    }
    await client.join(`conv:${body.conversationId}`);
    return { ok: true };
  }

  @SubscribeMessage('leave')
  async leave(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { conversationId: string },
  ) {
    if (body?.conversationId) {
      await client.leave(`conv:${body.conversationId}`);
    }
    return { ok: true };
  }
}
