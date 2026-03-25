import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateReportDto } from './dto/create-report.dto';

@Injectable()
export class SafetyService {
  constructor(private readonly prisma: PrismaService) {}

  async report(userId: string, dto: CreateReportDto) {
    if (userId === dto.targetUserId) {
      throw new BadRequestException('Invalid report');
    }
    const target = await this.prisma.user.findUnique({
      where: { id: dto.targetUserId },
    });
    if (!target) throw new NotFoundException('User not found');
    return this.prisma.report.create({
      data: {
        reportedByUserId: userId,
        targetUserId: dto.targetUserId,
        reason: dto.reason,
        details: dto.details,
      },
    });
  }

  async block(userId: string, blockedUserId: string) {
    if (userId === blockedUserId) {
      throw new BadRequestException('Invalid block');
    }
    try {
      await this.prisma.block.create({
        data: { blockerUserId: userId, blockedUserId },
      });
    } catch {
      throw new ConflictException('Already blocked');
    }
    return { ok: true };
  }

  async unblock(userId: string, blockedUserId: string) {
    await this.prisma.block.deleteMany({
      where: { blockerUserId: userId, blockedUserId },
    });
    return { ok: true };
  }

  async listBlocks(userId: string) {
    const rows = await this.prisma.block.findMany({
      where: { blockerUserId: userId },
      include: {
        blockedUser: {
          include: {
            profile: true,
            profilePhotos: { where: { isPrimary: true }, take: 1 },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return {
      items: rows.map((r) => ({
        blockedUserId: r.blockedUserId,
        createdAt: r.createdAt,
        user: {
          id: r.blockedUser.id,
          username: r.blockedUser.username,
          profile: r.blockedUser.profile,
          primaryPhoto: r.blockedUser.profilePhotos[0] ?? null,
        },
      })),
    };
  }
}
