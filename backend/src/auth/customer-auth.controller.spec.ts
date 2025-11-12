import { Test, TestingModule } from '@nestjs/testing';
import { CustomerAuthController } from './customer-auth.controller';
import { CustomerAuthService } from './customer-auth.service';
import { SmsService } from './sms.service';

describe('CustomerAuthController', () => {
  let controller: CustomerAuthController;
  let customerAuthService: CustomerAuthService;
  let smsService: SmsService;

  const mockCustomerAuthService = {
    checkEmailExists: jest.fn(),
    registerWithEmail: jest.fn(),
    loginWithEmail: jest.fn(),
    verifySmsAndComplete: jest.fn(),
  };

  const mockSmsService = {
    sendVerificationCode: jest.fn(),
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

      const result = await controller.checkEmail({ email: 'test@example.com' });

      expect(result).toEqual({ exists: true });
      expect(mockCustomerAuthService.checkEmailExists).toHaveBeenCalledWith(
        'test@example.com',
      );
    });
  });

  describe('register', () => {
    it('should register a new customer', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      const mockResult = {
        access_token: 'token',
        refresh_token: 'refresh',
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

      const result = await controller.register(registerDto, res);

      expect(result).toEqual(mockResult);
      expect(mockCustomerAuthService.registerWithEmail).toHaveBeenCalledWith(
        registerDto,
      );
    });
  });

  describe('login', () => {
    it('should login a customer', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockResult = {
        access_token: 'token',
        refresh_token: 'refresh',
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

      const result = await controller.login(loginDto, res);

      expect(result).toEqual(mockResult);
      expect(mockCustomerAuthService.loginWithEmail).toHaveBeenCalledWith(
        loginDto,
      );
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
        access_token: 'token',
        refresh_token: 'refresh',
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

