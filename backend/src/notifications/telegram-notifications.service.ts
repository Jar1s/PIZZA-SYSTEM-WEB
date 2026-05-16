import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { OrderStatus } from '@pizza-ecosystem/shared';

type TelegramOrder = {
  id: string;
  orderNumber?: number | string | null;
  status?: string | null;
  paymentStatus?: string | null;
  paymentRef?: string | null;
  subtotalCents?: number | null;
  deliveryFeeCents?: number | null;
  totalCents?: number | null;
  customer?: unknown;
  address?: unknown;
  items?: Array<{
    productName?: string | null;
    quantity?: number | null;
    priceCents?: number | null;
    modifiers?: unknown;
  }>;
  tenant?: {
    name?: string | null;
    slug?: string | null;
    currency?: string | null;
  } | null;
  createdAt?: Date | string | null;
};

type ErrorReport = {
  title: string;
  message?: string;
  statusCode?: number;
  method?: string;
  path?: string;
  tenantId?: string;
  orderId?: string;
  details?: Record<string, unknown>;
  stack?: string;
};

@Injectable()
export class TelegramNotificationsService implements OnModuleInit {
  private readonly logger = new Logger(TelegramNotificationsService.name);

  async onModuleInit(): Promise<void> {
    if (!this.enabled() || process.env.TELEGRAM_NOTIFY_STARTUP === 'false') return;

    await this.send([
      'Backend started',
      `Environment: ${process.env.NODE_ENV || 'development'}`,
      `Time: ${this.date(new Date())}`,
      `Backend URL: ${process.env.BACKEND_URL || 'not set'}`,
    ].join('\n'));
  }

  async notifyOrderCreated(order: TelegramOrder): Promise<void> {
    if (!this.enabled() || process.env.TELEGRAM_NOTIFY_ORDERS === 'false') return;

    const customer = this.record(order.customer);
    const address = this.record(order.address);
    const currency = order.tenant?.currency || 'EUR';
    const items = order.items || [];

    await this.send([
      'New order',
      '',
      `Tenant: ${order.tenant?.name || order.tenant?.slug || 'unknown tenant'}`,
      `Order: ${this.orderLabel(order)}`,
      `Status: ${order.status || 'unknown'}`,
      `Payment: ${this.payment(order)}`,
      `Time: ${this.date(order.createdAt || new Date())}`,
      '',
      'Customer:',
      `Name: ${this.value(customer.name)}`,
      `Phone: ${this.value(customer.phone)}`,
      `Email: ${this.value(customer.email)}`,
      '',
      'Delivery:',
      `Street: ${this.value(address.street)} ${this.value(address.houseNumber, '')}`.trim(),
      `City: ${this.value(address.postalCode, '')} ${this.value(address.city)}`.trim(),
      `Instructions: ${this.value(address.instructions || address.description)}`,
      '',
      'Items:',
      ...items.map((item) => this.itemLine(item, currency)),
      '',
      `Subtotal: ${this.money(order.subtotalCents, currency)}`,
      `Delivery fee: ${this.money(order.deliveryFeeCents, currency)}`,
      `Total: ${this.money(order.totalCents, currency)}`,
    ].join('\n'));
  }

  async notifyOrderStatusChanged(
    order: TelegramOrder,
    fromStatus: string,
    toStatus: OrderStatus,
    source: 'dashboard' | 'storyous' | 'system',
  ): Promise<void> {
    if (!this.enabled() || process.env.TELEGRAM_NOTIFY_STATUS_CHANGES === 'false') return;

    await this.send([
      'Order status changed',
      '',
      `Tenant: ${order.tenant?.name || order.tenant?.slug || 'unknown tenant'}`,
      `Order: ${this.orderLabel(order)}`,
      `From: ${fromStatus}`,
      `To: ${toStatus}`,
      `Source: ${source}`,
      `Time: ${this.date(new Date())}`,
    ].join('\n'));
  }

  async notifyError(report: ErrorReport): Promise<void> {
    if (!this.enabled() || process.env.TELEGRAM_NOTIFY_ERRORS === 'false') return;

    await this.send([
      'Backend error',
      '',
      `Title: ${report.title}`,
      `Message: ${report.message || 'no message'}`,
      report.statusCode ? `HTTP status: ${report.statusCode}` : '',
      report.method || report.path ? `Request: ${report.method || ''} ${report.path || ''}`.trim() : '',
      report.tenantId ? `Tenant ID: ${report.tenantId}` : '',
      report.orderId ? `Order ID: ${report.orderId}` : '',
      `Time: ${this.date(new Date())}`,
      ...this.details(report.details),
      report.stack ? `Stack: ${this.truncate(report.stack, 900)}` : '',
    ].filter(Boolean).join('\n'));
  }

  private enabled(): boolean {
    return (
      process.env.TELEGRAM_ENABLED !== 'false' &&
      Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID)
    );
  }

  private async send(text: string): Promise<void> {
    try {
      const response = await fetch(
        `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: process.env.TELEGRAM_CHAT_ID,
            text: this.truncate(text, 3900),
            disable_web_page_preview: true,
          }),
        },
      );

      if (!response.ok) {
        this.logger.warn('Telegram notification failed', {
          status: response.status,
          body: this.truncate(await response.text(), 500),
        });
      }
    } catch (error) {
      this.logger.warn('Telegram notification request failed', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private itemLine(item: NonNullable<TelegramOrder['items']>[number], currency: string): string {
    const line = `- ${item.quantity || 1}x ${item.productName || 'unknown item'} (${this.money(item.priceCents, currency)}/ks)`;
    if (!item.modifiers || typeof item.modifiers !== 'object') return line;
    return `${line}\n  Modifiers: ${this.truncate(this.json(item.modifiers), 300)}`;
  }

  private payment(order: TelegramOrder): string {
    if (order.paymentRef === 'cod:cash') return `cash on delivery (${order.paymentStatus || 'pending'})`;
    if (order.paymentRef === 'cod:card') return `card on delivery (${order.paymentStatus || 'pending'})`;
    return order.paymentStatus || order.paymentRef || 'not selected yet';
  }

  private details(details?: Record<string, unknown>): string[] {
    if (!details) return [];
    return Object.entries(details).map(([key, value]) => {
      const rendered = typeof value === 'string' ? value : this.json(value);
      return `${key}: ${this.truncate(rendered || '', 500)}`;
    });
  }

  private orderLabel(order: TelegramOrder): string {
    return `${order.orderNumber ? `#${order.orderNumber}` : order.id.slice(0, 8)} (${order.id})`;
  }

  private money(cents: number | null | undefined, currency: string): string {
    return `${(Number(cents || 0) / 100).toFixed(2)} ${currency}`;
  }

  private date(date: Date | string): string {
    const parsed = date instanceof Date ? date : new Date(date);
    return Number.isNaN(parsed.getTime())
      ? new Date().toISOString()
      : parsed.toLocaleString('sk-SK', { timeZone: 'Europe/Bratislava' });
  }

  private record(value: unknown): Record<string, any> {
    return value && typeof value === 'object' ? (value as Record<string, any>) : {};
  }

  private value(value: unknown, fallback = 'not set'): string {
    return value === null || value === undefined || value === '' ? fallback : String(value);
  }

  private json(value: unknown): string {
    try {
      return JSON.stringify(value);
    } catch {
      return '[unserializable]';
    }
  }

  private truncate(value: string, maxLength: number): string {
    return value.length > maxLength ? `${value.slice(0, maxLength - 3)}...` : value;
  }
}
