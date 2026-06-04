import { BadRequestException } from '@nestjs/common';
import { SmsService } from './sms.service';

describe('SmsService', () => {
  let service: SmsService;
  let prisma: any;
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    process.env.NODE_ENV = 'test';
    delete process.env.TWILIO_ACCOUNT_SID;
    delete process.env.TWILIO_AUTH_TOKEN;
    delete process.env.TWILIO_PHONE_NUMBER;

    prisma = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      smsVerificationCode: {
        findFirst: jest.fn(),
        updateMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        deleteMany: jest.fn(),
      },
    };

    service = new SmsService(prisma);
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    jest.restoreAllMocks();
  });

  it('rejects sending a user-bound SMS code when the phone does not match the account', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      phone: '+421900000000',
      isActive: true,
    });

    await expect(
      service.sendVerificationCode('+421912345678', 'user-1'),
    ).rejects.toThrow(BadRequestException);

    expect(prisma.smsVerificationCode.create).not.toHaveBeenCalled();
  });

  it('rejects verification when the requested phone is not already bound to the user', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      phone: null,
      isActive: true,
    });

    await expect(
      service.verifyCode('+421912345678', '123456', 'user-1'),
    ).rejects.toThrow(BadRequestException);

    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('does not log SMS codes in production when Twilio is missing', async () => {
    process.env.NODE_ENV = 'production';
    prisma.smsVerificationCode.findFirst.mockResolvedValue(null);
    prisma.smsVerificationCode.updateMany.mockResolvedValue({ count: 0 });
    prisma.smsVerificationCode.create.mockResolvedValue({});

    await expect(
      service.sendVerificationCode('+421912345678'),
    ).rejects.toThrow(BadRequestException);

    expect(prisma.smsVerificationCode.create).not.toHaveBeenCalled();
  });
});
