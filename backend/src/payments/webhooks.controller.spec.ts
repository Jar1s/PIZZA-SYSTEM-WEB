import { WebhooksController } from './webhooks.controller';
import { appConfig } from '../config/app.config';

describe('WebhooksController', () => {
  const mockPaymentsService = {
    handleWepayWebhook: jest.fn(),
  } as any;

  const mockAdyenService = {
    verifyWebhookSignature: jest.fn(),
  } as any;

  const mockGopayService = {
    verifyWebhook: jest.fn(),
  } as any;

  const mockWepayService = {
    verifyWebhook: jest.fn(),
  } as any;

  let controller: WebhooksController;
  let originalSkipWebhookVerification: boolean;

  beforeEach(() => {
    controller = new WebhooksController(
      mockPaymentsService,
      mockAdyenService,
      mockGopayService,
      mockWepayService,
    );
    originalSkipWebhookVerification = appConfig.skipWebhookVerification;
    jest.clearAllMocks();
  });

  afterEach(() => {
    appConfig.skipWebhookVerification = originalSkipWebhookVerification;
  });

  it('should reject WePay webhook without signature when verification is enabled', async () => {
    appConfig.skipWebhookVerification = false;
    const req = {
      rawBody: Buffer.from('{"id":"evt_1"}'),
      headers: {},
    } as any;
    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    } as any;

    await controller.handleWepayWebhook({ tenant_id: 'tenant-1' }, undefined as any, req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith('Missing signature');
    expect(mockPaymentsService.handleWepayWebhook).not.toHaveBeenCalled();
  });

  it('should reject WePay webhook with invalid signature when verification is enabled', async () => {
    appConfig.skipWebhookVerification = false;
    mockWepayService.verifyWebhook.mockReturnValue(false);

    const req = {
      rawBody: Buffer.from('{"id":"evt_2"}'),
      headers: {},
    } as any;
    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    } as any;

    await controller.handleWepayWebhook({ tenant_id: 'tenant-1' }, 'bad-signature', req, res);

    expect(mockWepayService.verifyWebhook).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith('Invalid signature');
    expect(mockPaymentsService.handleWepayWebhook).not.toHaveBeenCalled();
  });
});
