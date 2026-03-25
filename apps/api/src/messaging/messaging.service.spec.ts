import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { MessagingService } from './messaging.service';
import { PrismaService } from '@/prisma/prisma.service';
import { MembershipService } from '@/membership/membership.service';
import { AppSettingsService } from '@/app-settings/app-settings.service';
import { PushService } from '@/push/push.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MembershipType, MembershipStatus } from '@prisma/client';

describe('MessagingService permissions', () => {
  let service: MessagingService;

  const blockFindFirst = jest.fn();
  const matchFindUnique = jest.fn();
  const userFindUnique = jest.fn();

  beforeEach(async () => {
    blockFindFirst.mockReset();
    matchFindUnique.mockReset();
    userFindUnique.mockReset();

    const prisma = {
      block: { findFirst: blockFindFirst },
      match: { findUnique: matchFindUnique },
      user: { findUnique: userFindUnique },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagingService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: MembershipService,
          useValue: { isPremiumEffective: jest.fn().mockResolvedValue(false) },
        },
        {
          provide: AppSettingsService,
          useValue: {
            premiumDirectMessagingEnabled: jest.fn().mockResolvedValue(false),
          },
        },
        { provide: PushService, useValue: { notifyUser: jest.fn() } },
        { provide: EventEmitter2, useValue: { emit: jest.fn() } },
      ],
    }).compile();

    service = module.get(MessagingService);
  });

  it('blocks messaging when no match and free user', async () => {
    blockFindFirst.mockResolvedValue(null);
    matchFindUnique.mockResolvedValue(null);
    userFindUnique.mockResolvedValue({
      id: 'a',
      membershipType: MembershipType.FREE,
      membershipStatus: MembershipStatus.NONE,
    });

    await expect(service.assertCanMessage('a', 'b')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('allows when active match exists', async () => {
    blockFindFirst.mockResolvedValue(null);
    matchFindUnique.mockResolvedValue({
      id: 'm',
      isActive: true,
    });
    userFindUnique.mockResolvedValue({
      id: 'a',
      membershipType: MembershipType.FREE,
      membershipStatus: MembershipStatus.NONE,
    });

    await expect(service.assertCanMessage('a', 'b')).resolves.toBeUndefined();
  });
});
