import {
  ConnectedSocket,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Server, Socket } from 'socket.io';
import { JwtPayload } from '@/auth/types/jwt-payload.type';
import { PrismaService } from '@/prisma/prisma.service';

type NotificationRealtimePayload = {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: Date;
};

@WebSocketGateway({ namespace: '/notifications' })
export class NotificationsGateway implements OnGatewayInit {
  private readonly logger = new Logger(NotificationsGateway.name);

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
        if (!user?.isActive || user.isSuspended) return next(new Error('Unauthorized'));
        if (payload.rtv == null || payload.rtv !== user.refreshTokenVersion) {
          return next(new Error('Unauthorized'));
        }
        socket.data.userId = payload.sub;
        return next();
      } catch (e) {
        this.logger.debug(`Notifications WS auth failed: ${(e as Error).message}`);
        return next(new Error('Unauthorized'));
      }
    });

    server.on('connection', (socket: Socket) => {
      const userId = socket.data.userId as string | undefined;
      if (userId) socket.join(`user:${userId}`);
    });
  }

  @OnEvent('notification.created')
  handleNotificationCreated(event: {
    userId: string;
    notification: NotificationRealtimePayload;
  }) {
    this.server.to(`user:${event.userId}`).emit('notification', event.notification);
  }
}
