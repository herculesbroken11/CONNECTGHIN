import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { DiscoveryQueryDto } from './dto/discovery-query.dto';
import { Prisma } from '@prisma/client';

function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

@Injectable()
export class DiscoveryService {
  constructor(private readonly prisma: PrismaService) {}

  async candidates(userId: string, query: DiscoveryQueryDto) {
    const limit = query.limit ?? 20;

    const blocks = await this.prisma.block.findMany({
      where: {
        OR: [{ blockerUserId: userId }, { blockedUserId: userId }],
      },
    });
    const blockedIds = new Set<string>();
    for (const b of blocks) {
      if (b.blockerUserId === userId) blockedIds.add(b.blockedUserId);
      else blockedIds.add(b.blockerUserId);
    }

    const swiped = await this.prisma.swipe.findMany({
      where: { fromUserId: userId },
      select: { toUserId: true },
    });
    const swipedIds = new Set(swiped.map((s) => s.toUserId));

    const me = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    const exclude = [...blockedIds, ...swipedIds, userId];

    const profileWhere: Prisma.ProfileWhereInput = {};
    if (query.verifiedOnly) profileWhere.isGHINVerified = true;
    if (query.ageMin != null || query.ageMax != null) {
      const age: Prisma.IntFilter = {};
      if (query.ageMin != null) age.gte = query.ageMin;
      if (query.ageMax != null) age.lte = query.ageMax;
      profileWhere.age = age;
    }
    if (query.drinkingPreference) {
      profileWhere.drinkingPreference = query.drinkingPreference;
    }
    if (query.smokingPreference) {
      profileWhere.smokingPreference = query.smokingPreference;
    }
    if (query.musicPreference) {
      profileWhere.musicPreference = query.musicPreference;
    }

    const users = await this.prisma.user.findMany({
      where: {
        id: { notIn: exclude },
        isActive: true,
        isSuspended: false,
        profile: { is: profileWhere },
      },
      take: limit * 3,
      include: {
        profile: true,
        profilePhotos: { orderBy: { sortOrder: 'asc' }, take: 3 },
      },
    });

    let list = users;
    const maxKm = query.distance;
    if (
      maxKm != null &&
      me?.profile?.locationLat != null &&
      me?.profile?.locationLng != null
    ) {
      list = users.filter((u) => {
        const lat = u.profile?.locationLat;
        const lng = u.profile?.locationLng;
        if (lat == null || lng == null) return false;
        return (
          haversineKm(
            me.profile!.locationLat!,
            me.profile!.locationLng!,
            lat,
            lng,
          ) <= maxKm
        );
      });
    }

    return {
      items: list.slice(0, limit).map((u) => ({
        userId: u.id,
        username: u.username,
        profile: u.profile,
        photos: u.profilePhotos,
      })),
    };
  }
}
