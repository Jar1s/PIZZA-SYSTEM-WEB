import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { CustomerAuthService } from './customer-auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { SmsService } from './sms.service';
import * as bcrypt from 'bcryptjs';

describe('CustomerAuthService', () => {
  let service: CustomerAuthService;
  let prismaService: PrismaService;
  let jwtService: JwtService;
  let smsService: SmsService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  const mockSmsService = {
    verifyCode: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomerAuthService,
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

    service = module.get<CustomerAuthService>(CustomerAuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
    smsService = module.get<SmsService>(SmsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('registerWithEmail', () => {
    it('should register a new customer successfully', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue({
        id: 'user123',
        email: registerDto.email,
        name: registerDto.name,
        role: 'CUSTOMER',
        phone: null,
        phoneVerified: false,
      });
      mockJwtService.sign.mockReturnValue('access_token');
      mockPrismaService.refreshToken.create.mockResolvedValue({});

      const result = await service.registerWithEmail(registerDto);

      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe(registerDto.email);
      expect(result.needsSmsVerification).toBe(true);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: registerDto.email },
      });
      expect(mockPrismaService.user.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException if email already exists', async () => {
      const registerDto = {
        email: 'existing@example.com',
        password: 'password123',
        name: 'Test User',
      };

      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'existing123',
        email: registerDto.email,
      });

      await expect(service.registerWithEmail(registerDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockPrismaService.user.create).not.toHaveBeenCalled();
    });
  });

  describe('loginWithEmail', () => {
    it('should login customer successfully', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const hashedPassword = await bcrypt.hash(loginDto.password, 10);
      const mockUser = {
        id: 'user123',
        email: loginDto.email,
        password: hashedPassword,
        name: 'Test User',
        role: 'CUSTOMER',
        phone: null,
        phoneVerified: false,
        isActive: true,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('access_token');
      mockPrismaService.refreshToken.create.mockResolvedValue({});

      const result = await service.loginWithEmail(loginDto);

      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe(loginDto.email);
      expect(result.needsSmsVerification).toBe(true);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      const loginDto = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.loginWithEmail(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if password is incorrect', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      const hashedPassword = await bcrypt.hash('correctpassword', 10);
      const mockUser = {
        id: 'user123',
        email: loginDto.email,
        password: hashedPassword,
        name: 'Test User',
        role: 'CUSTOMER',
        phone: null,
        phoneVerified: false,
        isActive: true,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(service.loginWithEmail(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('checkEmailExists', () => {
    it('should return true if email exists', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user123',
        email: 'test@example.com',
      });

      const result = await service.checkEmailExists('test@example.com');

      expect(result).toBe(true);
    });

    it('should return false if email does not exist', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.checkEmailExists('nonexistent@example.com');

      expect(result).toBe(false);
    });
  });

  describe('verifySmsAndComplete', () => {
    it('should verify SMS code and complete registration', async () => {
      const phone = '+421912345678';
      const code = '123456';
      const userId = 'user123';

      mockSmsService.verifyCode.mockResolvedValue({
        valid: true,
        userId,
      });

      mockPrismaService.user.findUnique.mockResolvedValue({
        id: userId,
        email: 'test@example.com',
        name: 'Test User',
        role: 'CUSTOMER',
        phone,
        phoneVerified: true,
      });

      mockJwtService.sign.mockReturnValue('access_token');
      mockPrismaService.refreshToken.create.mockResolvedValue({});

      const result = await service.verifySmsAndComplete(phone, code, userId);

      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
      expect(result).toHaveProperty('user');
      expect(result.needsSmsVerification).toBe(false);
      expect(mockSmsService.verifyCode).toHaveBeenCalledWith(phone, code, userId);
    });

    it('should throw BadRequestException if SMS code is invalid', async () => {
      const phone = '+421912345678';
      const code = 'wrong';
      const userId = 'user123';

      mockSmsService.verifyCode.mockRejectedValue(
        new BadRequestException('Invalid or expired verification code'),
      );

      await expect(
        service.verifySmsAndComplete(phone, code, userId),
      ).rejects.toThrow(BadRequestException);
    });
  });
});

