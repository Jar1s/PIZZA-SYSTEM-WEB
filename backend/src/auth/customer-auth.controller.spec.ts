import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CustomerAuthController } from './customer-auth.controller';
import { CustomerAuthService } from './customer-auth.service';
import { SmsService } from './sms.service';
import { TenantsService } from '../tenants/tenants.service';

describe('CustomerAuthController', () => {
  let controller: CustomerAuthController;
  let customerAuthService: CustomerAuthService;
  let smsService: SmsService;

  const mockCustomerAuthService = {
    checkEmailExists: jest.fn(),
    registerWithEmail: jest.fn(),
    loginWithEmail: jest.fn(),
    refreshToken: jest.fn(),
    verifySmsAndComplete: jest.fn(),
  };

  const mockSmsService = {
    sendVerificationCode: jest.fn(),
  };
  const mockTenantsService = {
    getTenantBySlug: jest.fn().mockResolvedValue({
      id: 'tenant-1',
      slug: 'pornopizza',
      theme: {},
      subdomain: 'pornopizza',
      domain: 'pornopizza.sk',
    }),
    findTenantByDomain: jest.fn().mockResolvedValue(null),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CustomerAuthController],
      providers: [
        {
          provide: CustomerAuthService,
          useValue: mockCustomerAuthService,
        },
        {
          provide: SmsService,
          useValue: mockSmsService,
        },
        {
          provide: TenantsService,
          useValue: mockTenantsService,
        },
      ],
    }).compile();

    controller = module.get<CustomerAuthController>(CustomerAuthController);
    customerAuthService = module.get<CustomerAuthService>(CustomerAuthService);
    smsService = module.get<SmsService>(SmsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('checkEmail', () => {
    it('should check if email exists', async () => {
      mockCustomerAuthService.checkEmailExists.mockResolvedValue(true);

      const req = { headers: { 'x-tenant': 'pornopizza' } } as any;
      const result = await controller.checkEmail(req, { email: 'test@example.com' });

      expect(result).toEqual({ exists: true });
      expect(mockCustomerAuthService.checkEmailExists).toHaveBeenCalledWith(
        'test@example.com',
        'tenant-1',
      );
    });

    it('should throw explicit error when tenant cannot be resolved', async () => {
      mockTenantsService.getTenantBySlug.mockRejectedValueOnce(new Error('Tenant not found'));
      mockTenantsService.findTenantByDomain.mockResolvedValueOnce(null);

      const req = { headers: {} } as any;

      await expect(controller.checkEmail(req, { email: 'test@example.com' })).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('register', () => {
    it('should register a new customer', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: process.env.TEST_PASSWORD || 'test-password-123',
        name: 'Test User',
      };

      const mockResult = {
        access_token: process.env.TEST_ACCESS_TOKEN || 'test-access-token',
        refresh_token: process.env.TEST_REFRESH_TOKEN || 'test-refresh-token',
        user: {
          id: 'user123',
          email: registerDto.email,
          name: registerDto.name,
          role: 'CUSTOMER',
        },
        needsSmsVerification: true,
      };

      mockCustomerAuthService.registerWithEmail.mockResolvedValue(mockResult);

      const res = {
        cookie: jest.fn(),
      } as any;

      const req = { headers: { 'x-tenant': 'pornopizza' } } as any;
      const result = await controller.register(req, registerDto, res);

      expect(result).toEqual(mockResult);
      expect(mockCustomerAuthService.registerWithEmail).toHaveBeenCalledWith(
        registerDto,
        'tenant-1',
      );
    });
  });

  describe('login', () => {
    it('should login a customer', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: process.env.TEST_PASSWORD || 'test-password-123',
      };

      const mockResult = {
        access_token: process.env.TEST_ACCESS_TOKEN || 'test-access-token',
        refresh_token: process.env.TEST_REFRESH_TOKEN || 'test-refresh-token',
        user: {
          id: 'user123',
          email: loginDto.email,
          name: 'Test User',
          role: 'CUSTOMER',
        },
        needsSmsVerification: false,
      };

      mockCustomerAuthService.loginWithEmail.mockResolvedValue(mockResult);

      const res = {
        cookie: jest.fn(),
      } as any;

      const req = { headers: { 'x-tenant': 'pornopizza' } } as any;
      const result = await controller.login(req, loginDto, res);

      expect(result).toEqual(mockResult);
      expect(mockCustomerAuthService.loginWithEmail).toHaveBeenCalledWith(
        loginDto,
        'tenant-1',
      );
    });
  });

  describe('refresh', () => {
    it('should return rotated refresh token', async () => {
      const req = { headers: {}, body: {} } as any;
      const res = { cookie: jest.fn() } as any;
      mockCustomerAuthService.refreshToken.mockResolvedValue({
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        user: {
          id: 'user123',
          email: 'test@example.com',
          name: 'Test User',
          role: 'CUSTOMER',
        },
      });

      const result = await controller.refresh(req, { refresh_token: 'old-refresh-token' }, res);

      expect(result).toEqual({
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        user: {
          id: 'user123',
          email: 'test@example.com',
          name: 'Test User',
          role: 'CUSTOMER',
        },
      });
      expect(mockCustomerAuthService.refreshToken).toHaveBeenCalledWith('old-refresh-token');
    });
  });

  describe('sendSmsCode', () => {
    it('should send SMS verification code', async () => {
      mockSmsService.sendVerificationCode.mockResolvedValue({
        success: true,
        message: 'Verification code sent successfully',
      });

      const result = await controller.sendSmsCode({
        phone: '+421912345678',
        userId: 'user123',
      });

      expect(result).toEqual({
        success: true,
        message: 'Verification code sent successfully',
      });
      expect(mockSmsService.sendVerificationCode).toHaveBeenCalledWith(
        '+421912345678',
        'user123',
      );
    });
  });

  describe('verifySms', () => {
    it('should verify SMS code and complete registration', async () => {
      const mockResult = {
        access_token: process.env.TEST_ACCESS_TOKEN || 'test-access-token',
        refresh_token: process.env.TEST_REFRESH_TOKEN || 'test-refresh-token',
        user: {
          id: 'user123',
          email: 'test@example.com',
          name: 'Test User',
          role: 'CUSTOMER',
        },
        needsSmsVerification: false,
      };

      mockCustomerAuthService.verifySmsAndComplete.mockResolvedValue(mockResult);

      const res = {
        cookie: jest.fn(),
      } as any;

      const result = await controller.verifySms(
        {
          phone: '+421912345678',
          code: '123456',
          userId: 'user123',
        },
        res,
      );

      expect(result).toEqual(mockResult);
      expect(mockCustomerAuthService.verifySmsAndComplete).toHaveBeenCalledWith(
        '+421912345678',
        '123456',
        'user123',
      );
    });
  });
});
