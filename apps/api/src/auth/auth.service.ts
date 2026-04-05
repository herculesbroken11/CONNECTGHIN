import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { randomBytes, randomUUID } from 'crypto';
import { PrismaService } from '@/prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './types/jwt-payload.type';
import {
  MembershipStatus,
  MembershipType,
  UserRole,
} from '@prisma/client';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const usernameNorm = dto.username.toLowerCase();
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: dto.email.toLowerCase() }, { username: usernameNorm }],
      },
    });
    if (existing) {
      if (existing.email === dto.email.toLowerCase()) {
        throw new ConflictException('Email already registered');
      }
      throw new ConflictException('Username taken');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        username: usernameNorm,
        role: UserRole.USER,
        membershipType: MembershipType.FREE,
        membershipStatus: MembershipStatus.NONE,
        profile: {
          create: {
            displayName: `${dto.firstName} ${dto.lastName}`,
            profileCompletionPercent: 20,
          },
        },
      },
    });

    const tokens = await this.issueTokens(
      user.id,
      user.email,
      user.role,
      user.refreshTokenVersion,
    );
    return { user: this.sanitizeUser(user), ...tokens };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const match = await bcrypt.compare(dto.password, user.passwordHash);
    if (!match) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (!user.isActive || user.isSuspended) {
      throw new UnauthorizedException('Account unavailable');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = await this.issueTokens(
      user.id,
      user.email,
      user.role,
      user.refreshTokenVersion,
    );
    return { user: this.sanitizeUser(user), ...tokens };
  }

  async refresh(refreshToken: string) {
    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user || !user.isActive || user.isSuspended) {
      throw new UnauthorizedException('Account unavailable');
    }
    if (
      payload.rtv == null ||
      payload.rtv !== user.refreshTokenVersion
    ) {
      throw new UnauthorizedException('Refresh token revoked');
    }

    return this.issueTokens(
      user.id,
      user.email,
      user.role,
      user.refreshTokenVersion,
    );
  }

  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenVersion: { increment: 1 } },
    });
    return { ok: true };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });
    if (!user) throw new UnauthorizedException();
    return { user: this.sanitizeUser(user), profile: user.profile };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (!user) {
      return { ok: true };
    }
    const selector = randomUUID();
    const secret = randomBytes(32).toString('hex');
    const resetTokenHash = await bcrypt.hash(secret, 10);
    const exp = new Date(Date.now() + 60 * 60 * 1000);
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetTokenSelector: selector,
        resetTokenHash,
        resetTokenExp: exp,
      },
    });
    const composite = `${selector}.${secret}`;
    if (this.config.get('NODE_ENV') !== 'production') {
      this.logger.warn(
        `Password reset token for ${email} (dev only): ${composite}`,
      );
    }
    return { ok: true };
  }

  async resetPassword(token: string, newPassword: string) {
    const dot = token.indexOf('.');
    if (dot <= 0 || dot === token.length - 1) {
      throw new BadRequestException('Invalid or expired token');
    }
    const selector = token.slice(0, dot);
    const secret = token.slice(dot + 1);
    const user = await this.prisma.user.findUnique({
      where: { resetTokenSelector: selector },
    });
    if (
      !user?.resetTokenHash ||
      !user.resetTokenExp ||
      user.resetTokenExp <= new Date()
    ) {
      throw new BadRequestException('Invalid or expired token');
    }
    const ok = await bcrypt.compare(secret, user.resetTokenHash);
    if (!ok) {
      throw new BadRequestException('Invalid or expired token');
    }
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetTokenHash: null,
        resetTokenExp: null,
        resetTokenSelector: null,
        refreshTokenVersion: { increment: 1 },
      },
    });
    return { ok: true };
  }

  private async issueTokens(
    sub: string,
    email: string,
    role: UserRole,
    refreshTokenVersion?: number,
  ) {
    const payload: JwtPayload = {
      sub,
      email,
      role,
      rtv: refreshTokenVersion ?? 0,
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

  private sanitizeUser(user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    username: string;
    role: UserRole;
    membershipType: MembershipType;
    membershipStatus: MembershipStatus;
    isEmailVerified: boolean;
    createdAt: Date;
  }) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      role: user.role,
      membershipType: user.membershipType,
      membershipStatus: user.membershipStatus,
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt,
    };
  }
}
