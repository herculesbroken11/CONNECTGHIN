import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { MembershipService } from '@/membership/membership.service';
import { AppSettingsService } from '@/app-settings/app-settings.service';
import { PushService } from '@/push/push.service';
import { orderedUserPair } from '@/common/utils/pair.util';
import { MessageType } from '@prisma/client';
import { SendMessageDto } from './dto/send-message.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type { ChatMessagePayload } from '@/chat/chat.gateway';

@Injectable()
export class MessagingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly membership: MembershipService,
    private readonly settings: AppSettingsService,
    private readonly push: PushService,
    private readonly events: EventEmitter2,
  ) {}

  async assertCanMessage(senderId: string, recipientId: string) {
    if (senderId === recipientId) {
      throw new BadRequestException('Invalid recipient');
    }

    const block = await this.prisma.block.findFirst({
      where: {
        OR: [
          { blockerUserId: senderId, blockedUserId: recipientId },
          { blockerUserId: recipientId, blockedUserId: senderId },
        ],
      },
    });
    if (block) throw new ForbiddenException('Messaging not allowed');

    const [a, b] = orderedUserPair(senderId, recipientId);
    const match = await this.prisma.match.findUnique({
      where: {
        userOneId_userTwoId: { userOneId: a, userTwoId: b },
      },
    });
    const hasMatch = !!match?.isActive;

    const sender = await this.prisma.user.findUnique({
      where: { id: senderId },
    });
    if (!sender) throw new NotFoundException();

    const premium = await this.membership.isPremiumEffective(sender);
    const direct = await this.settings.premiumDirectMessagingEnabled();

    if (hasMatch) return;

    if (premium && direct) return;

    throw new ForbiddenException(
      'You must match before messaging, or upgrade with direct messaging enabled.',
    );
  }

  async findConversationBetween(
    userA: string,
    userB: string,
  ): Promise<string | null> {
    const partsA = await this.prisma.conversationParticipant.findMany({
      where: { userId: userA },
      select: { conversationId: true },
    });
    const ids = partsA.map((p) => p.conversationId);
    if (!ids.length) return null;
    const common = await this.prisma.conversationParticipant.findFirst({
      where: { conversationId: { in: ids }, userId: userB },
      select: { conversationId: true },
    });
    return common?.conversationId ?? null;
  }

  async startConversation(userId: string, otherUserId: string) {
    await this.assertCanMessage(userId, otherUserId);

    const existing = await this.findConversationBetween(userId, otherUserId);
    if (existing) {
      return { conversationId: existing, created: false };
    }

    const conv = await this.prisma.conversation.create({
      data: {
        participants: {
          create: [{ userId }, { userId: otherUserId }],
        },
      },
    });
    return { conversationId: conv.id, created: true };
  }

  async listConversations(userId: string) {
    const parts = await this.prisma.conversationParticipant.findMany({
      where: { userId },
      include: {
        conversation: {
          include: {
            participants: {
              include: {
                user: {
                  include: {
                    profile: true,
                    profilePhotos: { where: { isPrimary: true }, take: 1 },
                  },
                },
              },
            },
            messages: { orderBy: { createdAt: 'desc' }, take: 1 },
          },
        },
      },
      orderBy: { conversation: { updatedAt: 'desc' } },
    });

    const items = [];
    for (const p of parts) {
      const c = p.conversation;
      const others = c.participants.filter((x) => x.userId !== userId);
      const other = others[0]?.user;
      const last = c.messages[0];
      const unread = await this.prisma.message.count({
        where: {
          conversationId: c.id,
          isRead: false,
          senderId: { not: userId },
        },
      });
      items.push({
        conversationId: c.id,
        updatedAt: c.updatedAt,
        otherUser: other
          ? {
              id: other.id,
              username: other.username,
              profile: other.profile,
              primaryPhoto: other.profilePhotos[0] ?? null,
            }
          : null,
        lastMessage: last
          ? {
              id: last.id,
              body: last.body,
              senderId: last.senderId,
              createdAt: last.createdAt,
            }
          : null,
        unreadCount: unread,
      });
    }
    return { items };
  }

  async getMessages(
    userId: string,
    conversationId: string,
    cursor?: string,
    take = 40,
  ) {
    await this.assertParticipant(userId, conversationId);
    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: take + 1,
      ...(cursor
        ? { cursor: { id: cursor }, skip: 1 }
        : {}),
    });
    const hasMore = messages.length > take;
    const slice = hasMore ? messages.slice(0, take) : messages;
    return {
      items: slice.reverse(),
      nextCursor: hasMore ? slice[slice.length - 1]?.id : undefined,
    };
  }

  async sendMessage(
    userId: string,
    conversationId: string,
    dto: SendMessageDto,
  ) {
    await this.assertParticipant(userId, conversationId);

    const others = await this.prisma.conversationParticipant.findMany({
      where: { conversationId, userId: { not: userId } },
    });
    for (const o of others) {
      await this.assertCanMessage(userId, o.userId);
    }

    const msg = await this.prisma.message.create({
      data: {
        conversationId,
        senderId: userId,
        body: dto.body,
        messageType: dto.messageType ?? MessageType.TEXT,
      },
    });
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    for (const o of others) {
      await this.push.notifyUser(
        o.userId,
        'MESSAGE',
        'New message',
        dto.body.slice(0, 120),
        { conversationId, messageId: msg.id },
      );
    }

    const wsPayload: ChatMessagePayload = {
      id: msg.id,
      conversationId: msg.conversationId,
      senderId: msg.senderId,
      body: msg.body,
      createdAt: msg.createdAt,
      messageType: msg.messageType,
    };
    this.events.emit('chat.message', {
      conversationId,
      message: wsPayload,
    });

    return msg;
  }

  async markRead(userId: string, conversationId: string) {
    await this.assertParticipant(userId, conversationId);
    await this.prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        isRead: false,
      },
      data: { isRead: true, readAt: new Date() },
    });
    return { ok: true };
  }

  private async assertParticipant(userId: string, conversationId: string) {
    const p = await this.prisma.conversationParticipant.findFirst({
      where: { conversationId, userId },
    });
    if (!p) throw new ForbiddenException('Not in conversation');
  }
}
