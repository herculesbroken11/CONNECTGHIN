import {
  Injectable,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { AppSettingsService } from '@/app-settings/app-settings.service';
import { MembershipService } from '@/membership/membership.service';
import { PushService } from '@/push/push.service';
import { CreateSwipeDto } from './dto/create-swipe.dto';
import { SwipeAction } from '@prisma/client';
import { orderedUserPair } from '@/common/utils/pair.util';

@Injectable()
export class SwipesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: AppSettingsService,
    private readonly membership: MembershipService,
    private readonly push: PushService,
  ) {}

  async create(fromUserId: string, dto: CreateSwipeDto) {
    if (fromUserId === dto.targetUserId) {
      throw new BadRequestException('Cannot swipe yourself');
    }

    const [fromUser, target] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: fromUserId } }),
      this.prisma.user.findUnique({ where: { id: dto.targetUserId } }),
    ]);
    if (!target?.isActive || target.isSuspended) {
      throw new NotFoundException('User not found');
    }
    if (!fromUser) throw new NotFoundException();

    const block = await this.prisma.block.findFirst({
      where: {
        OR: [
          { blockerUserId: fromUserId, blockedUserId: dto.targetUserId },
          { blockerUserId: dto.targetUserId, blockedUserId: fromUserId },
        ],
      },
    });
    if (block) throw new ForbiddenException('Blocked');

    const existing = await this.prisma.swipe.findUnique({
      where: {
        fromUserId_toUserId: {
          fromUserId,
          toUserId: dto.targetUserId,
        },
      },
    });
    if (existing) {
      throw new ConflictException('Already swiped this golfer');
    }

    const premium = await this.membership.isPremiumEffective(fromUser);
    if (!premium) {
      const limit = await this.settings.freeDailySwipeLimit();
      const start = new Date();
      start.setUTCHours(0, 0, 0, 0);
      const count = await this.prisma.swipe.count({
        where: { fromUserId, createdAt: { gte: start } },
      });
      if (count >= limit) {
        throw new ForbiddenException('Daily swipe limit reached. Upgrade to Premium.');
      }
    }

    const swipe = await this.prisma.swipe.create({
      data: {
        fromUserId,
        toUserId: dto.targetUserId,
        action: dto.action,
      },
    });

    let match = null;
    if (dto.action === SwipeAction.LIKE) {
      const reciprocal = await this.prisma.swipe.findUnique({
        where: {
          fromUserId_toUserId: {
            fromUserId: dto.targetUserId,
            toUserId: fromUserId,
          },
        },
      });
      if (reciprocal?.action === SwipeAction.LIKE) {
        const [a, b] = orderedUserPair(fromUserId, dto.targetUserId);
        match = await this.prisma.match.upsert({
          where: {
            userOneId_userTwoId: { userOneId: a, userTwoId: b },
          },
          create: {
            userOneId: a,
            userTwoId: b,
            isActive: true,
            matchedAt: new Date(),
          },
          update: { isActive: true, matchedAt: new Date() },
        });

        await Promise.all([
          this.push.notifyUser(
            fromUserId,
            'MATCH',
            'New match',
            `You matched with ${target.username}`,
            { matchId: match.id, userId: dto.targetUserId },
          ),
          this.push.notifyUser(
            dto.targetUserId,
            'MATCH',
            'New match',
            `You matched with ${fromUser.username}`,
            { matchId: match.id, userId: fromUserId },
          ),
        ]);
      }
    }

    return { swipe, match };
  }
}
