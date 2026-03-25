import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class MatchesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string) {
    const rows = await this.prisma.match.findMany({
      where: {
        isActive: true,
        OR: [{ userOneId: userId }, { userTwoId: userId }],
      },
      orderBy: { matchedAt: 'desc' },
    });

    const otherIds = rows.map((m) =>
      m.userOneId === userId ? m.userTwoId : m.userOneId,
    );
    const users = await this.prisma.user.findMany({
      where: { id: { in: otherIds } },
      include: {
        profile: true,
        profilePhotos: { where: { isPrimary: true }, take: 1 },
      },
    });
    const byId = new Map(users.map((u) => [u.id, u]));

    return {
      items: rows.map((m) => {
        const oid = m.userOneId === userId ? m.userTwoId : m.userOneId;
        const u = byId.get(oid);
        return {
          matchId: m.id,
          matchedAt: m.matchedAt,
          user: u
            ? {
                id: u.id,
                username: u.username,
                profile: u.profile,
                primaryPhoto: u.profilePhotos[0] ?? null,
              }
            : null,
        };
      }),
    };
  }

  async getOne(userId: string, matchId: string) {
    const m = await this.prisma.match.findFirst({
      where: {
        id: matchId,
        isActive: true,
        OR: [{ userOneId: userId }, { userTwoId: userId }],
      },
    });
    if (!m) throw new NotFoundException('Match not found');
    const oid = m.userOneId === userId ? m.userTwoId : m.userOneId;
    const u = await this.prisma.user.findUnique({
      where: { id: oid },
      include: {
        profile: true,
        profilePhotos: { orderBy: { sortOrder: 'asc' } },
      },
    });
    return { match: m, user: u };
  }

  async unmatch(userId: string, matchId: string) {
    const m = await this.prisma.match.findFirst({
      where: {
        id: matchId,
        OR: [{ userOneId: userId }, { userTwoId: userId }],
      },
    });
    if (!m) throw new NotFoundException('Match not found');
    await this.prisma.match.update({
      where: { id: matchId },
      data: { isActive: false },
    });
    return { ok: true };
  }
}
