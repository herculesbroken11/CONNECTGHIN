import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        profilePhotos: { orderBy: { sortOrder: 'asc' } },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    const { passwordHash: _, resetTokenHash: __, ...rest } = user;
    return rest;
  }

  async updateMe(userId: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
      },
      include: { profile: true },
    });
    const { passwordHash: _, resetTokenHash: __, ...rest } = user;
    return rest;
  }
}
