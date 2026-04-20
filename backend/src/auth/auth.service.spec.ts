import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { SmsService } from './sms.service';

describe('AuthService', () => {
  let service: AuthService;

  const mockPrismaService = {
    refreshToken: {
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  const mockSmsService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: SmsService,
          useValue: mockSmsService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('refreshToken', () => {
    it('should rotate refresh token and issue new access token', async () => {
      mockPrismaService.refreshToken.findUnique.mockResolvedValue({
        id: 'rt-1',
        userId: 'user-1',
        token: 'old-refresh-token',
        isRevoked: false,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        user: {
          id: 'user-1',
          username: 'admin',
          name: 'Admin User',
          role: 'ADMIN',
          isActive: true,
        },
      });
      mockPrismaService.refreshToken.update.mockResolvedValue({});
      mockPrismaService.refreshToken.create.mockResolvedValue({});
      mockJwtService.sign.mockReturnValue('new-access-token');

      const result = await service.refreshToken({ refresh_token: 'old-refresh-token' });

      expect(result.access_token).toBe('new-access-token');
      expect(result.refresh_token).toBeDefined();
      expect(result.refresh_token).not.toBe('old-refresh-token');
      expect(mockPrismaService.refreshToken.update).toHaveBeenCalledWith({
        where: { id: 'rt-1' },
        data: { isRevoked: true },
      });
      expect(mockPrismaService.refreshToken.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-1',
          token: expect.any(String),
          expiresAt: expect.any(Date),
        }),
      });
    });

    it('should block revoked refresh token reuse', async () => {
      mockPrismaService.refreshToken.findUnique.mockResolvedValue({
        id: 'rt-1',
        userId: 'user-1',
        token: 'used-refresh-token',
        isRevoked: true,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        user: {
          id: 'user-1',
          username: 'admin',
          name: 'Admin User',
          role: 'ADMIN',
          isActive: true,
        },
      });

      await expect(
        service.refreshToken({ refresh_token: 'used-refresh-token' }),
      ).rejects.toThrow(UnauthorizedException);
      expect(mockPrismaService.refreshToken.update).not.toHaveBeenCalled();
      expect(mockPrismaService.refreshToken.create).not.toHaveBeenCalled();
    });
  });
});
