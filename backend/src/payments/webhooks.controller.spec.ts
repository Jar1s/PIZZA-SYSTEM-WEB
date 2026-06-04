import { WebhooksController } from './webhooks.controller';
import { NotFoundException } from '@nestjs/common';

describe('WebhooksController', () => {
  let controller: WebhooksController;

  const paymentsService = {
    handleAdyenWebhook: jest.fn(),
    handleGopayWebhook: jest.fn(),
    handleWepayWebhook: jest.fn(),
    syncGopayPaymentById: jest.fn(),
  } as any;

  const adyenService = {
    verifyWebhookSignature: jest.fn(),
  } as any;

  const wepayService = {
    verifyWebhook: jest.fn(),
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new WebhooksController(
      paymentsService,
      adyenService,
      wepayService,
    );
  });

  it('rejects WePay webhooks without a signature when verification is enabled', async () => {
    const previousSkip = process.env.SKIP_WEBHOOK_VERIFICATION;
    const previousHmac = process.env.WEPAY_HMAC_KEY;
    delete process.env.SKIP_WEBHOOK_VERIFICATION;
    process.env.WEPAY_HMAC_KEY = 'secret';

    const req = { rawBody: Buffer.from('{}') } as any;
    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    } as any;

    await controller.handleWepayWebhook({}, '', req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith('Missing signature');

    if (previousSkip === undefined) {
      delete process.env.SKIP_WEBHOOK_VERIFICATION;
    } else {
      process.env.SKIP_WEBHOOK_VERIFICATION = previousSkip;
    }

    if (previousHmac === undefined) {
      delete process.env.WEPAY_HMAC_KEY;
    } else {
      process.env.WEPAY_HMAC_KEY = previousHmac;
    }
  });

  it('requests retry for unresolved GoPay GET notifications', async () => {
    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    } as any;
    paymentsService.syncGopayPaymentById.mockRejectedValueOnce(new NotFoundException('missing'));

    await controller.handleGopayNotification('payment-1', res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith('Order not found yet');
  });
});
