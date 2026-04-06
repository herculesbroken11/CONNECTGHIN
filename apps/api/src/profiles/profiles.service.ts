import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { RequestGhinVerificationDto } from './dto/request-ghin-verification.dto';
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

  async requestGhinVerification(
    userId: string,
    dto: RequestGhinVerificationDto,
  ) {
    const profile = await this.prisma.profile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Profile not found');
    if (profile.isGHINVerified) {
      throw new BadRequestException('Already GHIN verified');
    }
    const raw = dto.note?.trim();
    const note =
      raw && raw.length > 0 ? raw.slice(0, 500) : null;
    return this.prisma.profile.update({
      where: { userId },
      data: {
        ghinVerificationRequestedAt: new Date(),
        ghinVerificationRequestNote: note,
      },
    });
  }

  async updateMine(userId: string, dto: UpdateProfileDto) {
    const profile = await this.prisma.profile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Profile not found');

    const photoCount = await this.prisma.profilePhoto.count({
      where: { userId },
    });
    const merged = this.mergeProfilePatch(profile, dto);
    this.assertRequiredProfileFields(merged, photoCount);

    const patchEntries = Object.entries(dto as Record<string, unknown>).filter(
      ([, v]) => v !== undefined,
    );
    if (patchEntries.length === 0) {
      const percent = await this.computeCompletion(userId);
      return this.prisma.profile.update({
        where: { userId },
        data: { profileCompletionPercent: percent },
      });
    }

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

  private mergeProfilePatch(profile: Profile, dto: UpdateProfileDto): Profile {
    const patch = dto as Record<string, unknown>;
    const next = { ...profile };
    for (const key of Object.keys(patch)) {
      const v = patch[key];
      if (v !== undefined) {
        (next as Record<string, unknown>)[key] = v;
      }
    }
    return next;
  }

  /**
   * Same minimums as mobile onboarding: display, bio, city, handicap,
   * preference enums, and at least one profile photo.
   */
  private assertRequiredProfileFields(
    profile: Profile,
    photoCount: number,
  ): void {
    const missing: string[] = [];

    const displayName = profile.displayName?.trim() ?? '';
    if (displayName.length < 2) missing.push('displayName');
    if (!profile.bio?.trim()) missing.push('bio');
    if (!profile.city?.trim()) missing.push('city');

    if (profile.handicap == null) {
      missing.push('handicap');
    } else if (profile.handicap < -10 || profile.handicap > 60) {
      throw new BadRequestException('Handicap must be between -10 and 60');
    }

    if (!profile.drinkingPreference?.trim()) {
      missing.push('drinkingPreference');
    }
    if (!profile.smokingPreference?.trim()) {
      missing.push('smokingPreference');
    }
    if (!profile.musicPreference?.trim()) {
      missing.push('musicPreference');
    }

    if (photoCount < 1) missing.push('photo');

    if (missing.length > 0) {
      throw new BadRequestException({
        message: 'Profile is missing required fields',
        missing,
      });
    }
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
    // Onboarding only asks for a profile photo, so any uploaded photo should
    // fully satisfy the photo portion of completion.
    const photoScore = photos > 0 ? 1 : 0;
    const base = filled / (fields.length + 2);
    return Math.min(100, Math.round((base * 0.75 + photoScore * 0.25) * 100));
  }
}
