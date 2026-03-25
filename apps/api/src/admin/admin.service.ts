import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '@/prisma/prisma.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { SuspendUserDto } from './dto/suspend-user.dto';
import { ReviewReportDto } from './dto/review-report.dto';
import { JwtPayload } from '@/auth/types/jwt-payload.type';
import { UserRole, ReportStatus, MembershipType } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(dto: AdminLoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (!user || user.role !== UserRole.ADMIN) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const match = await bcrypt.compare(dto.password, user.passwordHash);
    if (!match) throw new UnauthorizedException('Invalid credentials');
    if (!user.isActive) throw new UnauthorizedException('Account unavailable');

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    const accessExpires =
      this.config.get<string>('JWT_ACCESS_EXPIRES_IN') ?? '15m';
    const refreshExpires =
      this.config.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d';
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload, {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: accessExpires as `${number}${'ms' | 's' | 'm' | 'h' | 'd'}`,
      }),
      this.jwt.signAsync(payload, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: refreshExpires as `${number}${'ms' | 's' | 'm' | 'h' | 'd'}`,
      }),
    ]);
    return { accessToken, refreshToken, expiresIn: accessExpires };
  }

  async audit(
    adminId: string,
    actionType: string,
    targetUserId?: string | null,
    metadata?: Record<string, unknown>,
  ) {
    await this.prisma.adminAuditLog.create({
      data: {
        adminUserId: adminId,
        actionType,
        targetUserId: targetUserId ?? undefined,
        metadataJson: metadata ? JSON.stringify(metadata) : undefined,
      },
    });
  }

  /** Profiles that are not GHIN-verified (manual verification queue). */
  async listGhinQueue(skip = 0, take = 50) {
    return this.prisma.user.findMany({
      where: {
        role: UserRole.USER,
        isActive: true,
        profile: { isGHINVerified: false },
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        createdAt: true,
        profile: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
  }

  async listUsers(search?: string, skip = 0, take = 50) {
    return this.prisma.user.findMany({
      where: search
        ? {
            OR: [
              { email: { contains: search, mode: 'insensitive' } },
              { username: { contains: search, mode: 'insensitive' } },
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
            ],
          }
        : undefined,
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        membershipType: true,
        membershipStatus: true,
        isActive: true,
        isSuspended: true,
        createdAt: true,
        profile: { select: { isGHINVerified: true, displayName: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
  }

  async getUser(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        profile: true,
        profilePhotos: true,
        subscriptions: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
    });
    if (!user) throw new NotFoundException();
    const { passwordHash: _, resetTokenHash: __, ...rest } = user;
    return rest;
  }

  async suspend(adminId: string, userId: string, dto: SuspendUserDto) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { isSuspended: true, suspensionReason: dto.reason ?? 'Suspended' },
    });
    await this.audit(adminId, 'USER_SUSPEND', userId, { reason: dto.reason });
    return { ok: true };
  }

  async ban(adminId: string, userId: string, dto: SuspendUserDto) {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        isActive: false,
        isSuspended: true,
        suspensionReason: dto.reason ?? 'Banned',
      },
    });
    await this.audit(adminId, 'USER_BAN', userId, { reason: dto.reason });
    return { ok: true };
  }

  async restore(adminId: string, userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        isActive: true,
        isSuspended: false,
        suspensionReason: null,
      },
    });
    await this.audit(adminId, 'USER_RESTORE', userId);
    return { ok: true };
  }

  async verifyGhin(adminId: string, userId: string) {
    await this.prisma.profile.update({
      where: { userId },
      data: {
        isGHINVerified: true,
        ghinVerifiedAt: new Date(),
        ghinVerifiedByAdminId: adminId,
      },
    });
    await this.audit(adminId, 'GHIN_VERIFY', userId);
    return { ok: true };
  }

  async listReports(status?: ReportStatus) {
    return this.prisma.report.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        reportedByUser: {
          select: { id: true, username: true, email: true },
        },
        targetUser: {
          select: { id: true, username: true, email: true },
        },
      },
      take: 100,
    });
  }

  async reviewReport(
    adminId: string,
    reportId: string,
    dto: ReviewReportDto,
  ) {
    await this.prisma.report.update({
      where: { id: reportId },
      data: {
        status: dto.status,
        reviewedAt: new Date(),
        reviewedByAdminId: adminId,
      },
    });
    await this.audit(adminId, 'REPORT_REVIEW', undefined, {
      reportId,
      status: dto.status,
    });
    return { ok: true };
  }

  async listSubscriptions() {
    return this.prisma.subscription.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 200,
      include: {
        user: { select: { id: true, email: true, username: true } },
      },
    });
  }

  async auditLogs(skip = 0, take = 100) {
    return this.prisma.adminAuditLog.findMany({
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: {
        adminUser: { select: { id: true, email: true, username: true } },
      },
    });
  }

  async dashboardStats() {
    const [
      userCount,
      premiumCount,
      openReports,
      verifiedProfiles,
    ] = await Promise.all([
      this.prisma.user.count({ where: { role: UserRole.USER } }),
      this.prisma.user.count({
        where: { membershipType: MembershipType.PREMIUM },
      }),
      this.prisma.report.count({ where: { status: ReportStatus.OPEN } }),
      this.prisma.profile.count({ where: { isGHINVerified: true } }),
    ]);
    return {
      users: userCount,
      premiumUsers: premiumCount,
      openReports,
      ghinVerifiedProfiles: verifiedProfiles,
    };
  }

  async patchAppSetting(key: string, value: unknown) {
    await this.prisma.appSettings.upsert({
      where: { key },
      create: { key, valueJson: JSON.stringify(value) },
      update: { valueJson: JSON.stringify(value) },
    });
    return { ok: true };
  }

  async getAppSettings() {
    return this.prisma.appSettings.findMany();
  }
}
