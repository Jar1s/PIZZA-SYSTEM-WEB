import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { CustomerAuthService } from './customer-auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { SmsService } from './sms.service';
import * as bcrypt from 'bcryptjs';
import { EmailService } from '../email/email.service';
import { TenantsService } from '../tenants/tenants.service';

describe('CustomerAuthService', () => {
  let service: CustomerAuthService;
  let prismaService: PrismaService;
  let jwtService: JwtService;
  let smsService: SmsService;
  let emailService: EmailService;
  let tenantsService: TenantsService;
  const tenantId = 'tenant123';

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
      deleteMany: jest.fn().mockResolvedValue({}),
    },
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  const mockSmsService = {
    verifyCode: jest.fn(),
  };

  const mockEmailService = {
    sendPasswordResetEmail: jest.fn(),
    sendOrderConfirmation: jest.fn(),
    sendPasswordSetupEmail: jest.fn(),
  };

  const mockTenantsService = {
    getTenantBySlug: jest.fn().mockResolvedValue({ id: 'tenant-1', slug: 'tenant-1', isActive: true }),
    getTenantById: jest.fn().mockResolvedValue({
      id: 'tenant-1',
      name: 'Tenant 1',
      slug: 'tenant-1',
      subdomain: 'tenant-1',
      domain: 'tenant-1.local',
      theme: {},
    }),
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
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
        {
          provide: TenantsService,
          useValue: mockTenantsService,
        },
      ],
    }).compile();

    service = module.get<CustomerAuthService>(CustomerAuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
    smsService = module.get<SmsService>(SmsService);
    emailService = module.get<EmailService>(EmailService);
    tenantsService = module.get<TenantsService>(TenantsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('registerWithEmail', () => {
    it('should register a new customer successfully', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: process.env.TEST_PASSWORD || 'test-password-123',
        name: 'Test User',
      };

      mockPrismaService.user.findFirst.mockResolvedValue(null);
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

      const result = await service.registerWithEmail(registerDto, tenantId);

      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe(registerDto.email);
      expect(result.needsSmsVerification).toBe(false); // SMS verification disabled
      expect(mockPrismaService.user.findFirst).toHaveBeenCalledWith({
        where: { email: registerDto.email.toLowerCase().trim(), tenantId },
      });
      expect(mockPrismaService.user.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException if email already exists', async () => {
      const registerDto = {
        email: 'existing@example.com',
        password: process.env.TEST_PASSWORD || 'test-password-123',
        name: 'Test User',
      };

      mockPrismaService.user.findFirst.mockResolvedValue({
        id: 'existing123',
        email: registerDto.email,
      });

      await expect(service.registerWithEmail(registerDto, tenantId)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockPrismaService.user.create).not.toHaveBeenCalled();
    });
  });

  describe('loginWithEmail', () => {
    it('should login customer successfully', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: process.env.TEST_PASSWORD || 'test-password-123',
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

      mockPrismaService.user.findFirst.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('access_token');
      mockPrismaService.refreshToken.create.mockResolvedValue({});

      const result = await service.loginWithEmail(loginDto, tenantId);

      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe(loginDto.email);
      expect(result.needsSmsVerification).toBe(false); // SMS verification disabled
    });

    it('should throw UnauthorizedException if user not found', async () => {
      const loginDto = {
        email: 'nonexistent@example.com',
        password: process.env.TEST_PASSWORD || 'test-password-123',
      };

      mockPrismaService.user.findFirst.mockResolvedValue(null);

      await expect(service.loginWithEmail(loginDto, tenantId)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if password is incorrect', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: process.env.TEST_WRONG_PASSWORD || 'test-wrong-password',
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

      mockPrismaService.user.findFirst.mockResolvedValue(mockUser);

      await expect(service.loginWithEmail(loginDto, tenantId)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('checkEmailExists', () => {
    it('should return true if email exists', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue({
        id: 'user123',
        email: 'test@example.com',
      });

      const result = await service.checkEmailExists('test@example.com', tenantId);

      expect(result).toBe(true);
    });

    it('should return false if email does not exist', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(null);

      const result = await service.checkEmailExists('nonexistent@example.com', tenantId);

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

      mockPrismaService.user.findFirst.mockResolvedValue({
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
