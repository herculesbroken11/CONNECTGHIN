import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { SwipesService } from './swipes.service';
import { PrismaService } from '@/prisma/prisma.service';
import { AppSettingsService } from '@/app-settings/app-settings.service';
import { MembershipService } from '@/membership/membership.service';
import { PushService } from '@/push/push.service';
import { SwipeAction } from '@prisma/client';

describe('SwipesService', () => {
  let service: SwipesService;
  const prisma = {
    user: { findUnique: jest.fn() },
    block: { findFirst: jest.fn() },
    swipe: {
      findUnique: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
    },
    match: { upsert: jest.fn() },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SwipesService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: AppSettingsService,
          useValue: { freeDailySwipeLimit: jest.fn().mockResolvedValue(10) },
        },
        {
          provide: MembershipService,
          useValue: { isPremiumEffective: jest.fn().mockResolvedValue(false) },
        },
        { provide: PushService, useValue: { notifyUser: jest.fn() } },
      ],
    }).compile();
    service = module.get(SwipesService);
  });

  it('throws ConflictException on duplicate swipe', async () => {
    prisma.user.findUnique.mockImplementation(({ where: { id } }: { where: { id: string } }) =>
      Promise.resolve(
        id === 'from'
          ? { id: 'from', isActive: true, isSuspended: false, username: 'a' }
          : { id: 'to', isActive: true, isSuspended: false, username: 'b' },
      ),
    );
    prisma.block.findFirst.mockResolvedValue(null);
    prisma.swipe.findUnique.mockResolvedValue({ id: 's' } as never);
    prisma.swipe.count.mockResolvedValue(0);

    await expect(
      service.create('from', {
        targetUserId: 'to',
        action: SwipeAction.LIKE,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
