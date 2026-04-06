import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { StorageService } from '@/storage/storage.service';
import type { Express } from 'express';
import { Profile } from '@prisma/client';

@Injectable()
export class ProfilesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async getPublicProfile(viewerId: string, targetUserId: string) {
    if (viewerId === targetUserId) {
      return this.getOwnBundle(targetUserId);
    }

    const blocked = await this.prisma.block.findFirst({
      where: {
        OR: [
          { blockerUserId: viewerId, blockedUserId: targetUserId },
          { blockerUserId: targetUserId, blockedUserId: viewerId },
        ],
      },
    });
    if (blocked) throw new NotFoundException('Profile not found');

    const user = await this.prisma.user.findFirst({
      where: {
        id: targetUserId,
        isActive: true,
        isSuspended: false,
      },
      include: {
        profile: true,
        profilePhotos: { orderBy: { sortOrder: 'asc' } },
      },
    });
    if (!user?.profile) throw new NotFoundException('Profile not found');

    return {
      userId: user.id,
      username: user.username,
      profile: user.profile,
      photos: user.profilePhotos.map((p) => ({
        id: p.id,
        imageUrl: p.imageUrl,
        sortOrder: p.sortOrder,
        isPrimary: p.isPrimary,
      })),
    };
  }

  async updateMine(userId: string, dto: UpdateProfileDto) {
    const profile = await this.prisma.profile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Profile not found');

    await this.prisma.profile.update({
      where: { userId },
      data: { ...dto },
    });
    const percent = await this.computeCompletion(userId);
    return this.prisma.profile.update({
      where: { userId },
      data: { profileCompletionPercent: percent },
    });
  }

  async addPhoto(userId: string, file: Express.Multer.File) {
    if (!file?.buffer) {
      throw new BadRequestException('File required');
    }
    const path = await this.storage.saveProfileImageBuffer(
      file.buffer,
      file.mimetype,
    );
    const count = await this.prisma.profilePhoto.count({ where: { userId } });
    // New upload is always the primary avatar so "change photo" persists for
    // clients that read primaryOrFirst / isPrimary (second+ uploads were non-primary before).
    await this.prisma.profilePhoto.updateMany({
      where: { userId },
      data: { isPrimary: false },
    });
    const photo = await this.prisma.profilePhoto.create({
      data: {
        userId,
        imageUrl: path,
        sortOrder: count,
        isPrimary: true,
      },
    });
    await this.prisma.profile.update({
      where: { userId },
      data: { profileCompletionPercent: await this.computeCompletion(userId) },
    });
    return photo;
  }

  async deletePhoto(userId: string, photoId: string) {
    const photo = await this.prisma.profilePhoto.findFirst({
      where: { id: photoId, userId },
    });
    if (!photo) throw new NotFoundException('Photo not found');
    await this.prisma.profilePhoto.delete({ where: { id: photoId } });
    if (photo.isPrimary) {
      const next = await this.prisma.profilePhoto.findFirst({
        where: { userId },
        orderBy: { sortOrder: 'asc' },
      });
      if (next) {
        await this.prisma.profilePhoto.update({
          where: { id: next.id },
          data: { isPrimary: true },
        });
      }
    }
    await this.prisma.profile.update({
      where: { userId },
      data: { profileCompletionPercent: await this.computeCompletion(userId) },
    });
    return { ok: true };
  }

  async setPrimary(userId: string, photoId: string) {
    const photo = await this.prisma.profilePhoto.findFirst({
      where: { id: photoId, userId },
    });
    if (!photo) throw new NotFoundException('Photo not found');
    await this.prisma.profilePhoto.updateMany({
      where: { userId },
      data: { isPrimary: false },
    });
    await this.prisma.profilePhoto.update({
      where: { id: photoId },
      data: { isPrimary: true },
    });
    return { ok: true };
  }

  private async getOwnBundle(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        profilePhotos: { orderBy: { sortOrder: 'asc' } },
      },
    });
    if (!user) throw new NotFoundException();
    const { passwordHash: _, resetTokenHash: __, ...rest } = user;
    return rest;
  }

  private async computeCompletion(userId: string): Promise<number> {
    const profile = await this.prisma.profile.findUnique({ where: { userId } });
    const photos = await this.prisma.profilePhoto.count({ where: { userId } });
    if (!profile) return 0;

    const fields: (keyof Profile)[] = [
      'displayName',
      'bio',
      'age',
      'gender',
      'city',
      'state',
      'country',
      'handicap',
      'golfHomeCourse',
      'drinkingPreference',
      'smokingPreference',
      'musicPreference',
    ];
    let filled = 0;
    for (const k of fields) {
      const v = profile[k];
      if (v !== null && v !== undefined && String(v).trim() !== '') {
        filled++;
      }
    }
    if (profile.favoriteCourses?.length) filled++;
    const loc =
      profile.locationLat != null && profile.locationLng != null ? 1 : 0;
    filled += loc;
    const photoScore = Math.min(photos, 3) / 3;
    const base = filled / (fields.length + 2);
    return Math.min(100, Math.round((base * 0.75 + photoScore * 0.25) * 100));
  }
}
