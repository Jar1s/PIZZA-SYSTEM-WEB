import { WepayService } from './wepay.service';

describe('WepayService', () => {
  let service: WepayService;

  beforeEach(() => {
    service = new WepayService();
  });

  it('rejects missing webhook signature', () => {
    expect(service.verifyWebhook('', '{"ok":true}', 'secret')).toBe(false);
  });

  it('rejects verification when the HMAC secret is missing', () => {
    expect(service.verifyWebhook('signature', '{"ok":true}', '')).toBe(false);
  });

  it('validates a correct webhook signature', () => {
    const payload = JSON.stringify({ status: 'captured' });
    const secret = 'super-secret';
    const signature = require('crypto').createHmac('sha256', secret).update(payload).digest('hex');

    expect(service.verifyWebhook(signature, payload, secret)).toBe(true);
  });
});
