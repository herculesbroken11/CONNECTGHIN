import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { PrismaService } from '@/prisma/prisma.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findFirst: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
          },
        },
        {
          provide: JwtService,
          useValue: { signAsync: jest.fn().mockResolvedValue('token') },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((k: string) => {
              if (k === 'JWT_ACCESS_EXPIRES_IN') return '15m';
              if (k === 'JWT_REFRESH_EXPIRES_IN') return '7d';
              return undefined;
            }),
            getOrThrow: jest.fn((k: string) => {
              if (k === 'JWT_ACCESS_SECRET') return 'a'.repeat(32);
              if (k === 'JWT_REFRESH_SECRET') return 'b'.repeat(32);
              throw new Error(k);
            }),
          },
        },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
