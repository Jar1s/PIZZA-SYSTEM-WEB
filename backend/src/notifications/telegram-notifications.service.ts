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
      '🟢 <b>Backend spustený</b>',
      '',
      `Prostredie: ${this.escape(process.env.NODE_ENV || 'development')}`,
      `Čas: ${this.escape(this.date(new Date()))}`,
      `Backend: ${this.escape(process.env.BACKEND_URL || 'not set')}`,
    ].join('\n'));
  }

  async notifyOrderCreated(order: TelegramOrder): Promise<void> {
    if (!this.enabled() || process.env.TELEGRAM_NOTIFY_ORDERS === 'false') return;

    const customer = this.record(order.customer);
    const address = this.record(order.address);
    const currency = order.tenant?.currency || 'EUR';
    const items = order.items || [];
    const tenantName = order.tenant?.name || order.tenant?.slug || 'unknown tenant';

    await this.send([
      `🆕 <b>Nová objednávka ${this.escape(this.shortOrderLabel(order))}</b>`,
      this.escape(tenantName),
      '',
      `📌 Stav: <b>${this.escape(this.statusLabel(order.status))}</b>`,
      `💳 Platba: ${this.escape(this.payment(order))}`,
      `🕒 Čas: ${this.escape(this.date(order.createdAt || new Date()))}`,
      '',
      '👤 <b>Zákazník</b>',
      `${this.escape(this.value(customer.name))}`,
      `${this.escape(this.value(customer.phone))}`,
      `${this.escape(this.value(customer.email))}`,
      '',
      '📍 <b>Doručenie</b>',
      `${this.escape(`${this.value(address.street)} ${this.value(address.houseNumber, '')}`.trim())}`,
      `${this.escape(`${this.value(address.postalCode, '')} ${this.value(address.city)}`.trim())}`,
      `Poznámka: ${this.escape(this.value(address.instructions || address.description, '-'))}`,
      '',
      '🍕 <b>Položky</b>',
      ...items.map((item) => this.itemLine(item, currency)),
      '',
      '🧾 <b>Súhrn</b>',
      `Medzisúčet: ${this.escape(this.money(order.subtotalCents, currency))}`,
      `Doprava: ${this.escape(this.money(order.deliveryFeeCents, currency))}`,
      `💶 <b>Celkom: ${this.escape(this.money(order.totalCents, currency))}</b>`,
    ].join('\n'));
  }

  async notifyOrderStatusChanged(
    order: TelegramOrder,
    fromStatus: string,
    toStatus: OrderStatus,
    source: 'dashboard' | 'storyous' | 'system',
  ): Promise<void> {
    if (!this.enabled() || process.env.TELEGRAM_NOTIFY_STATUS_CHANGES === 'false') return;
    const tenantName = order.tenant?.name || order.tenant?.slug || 'unknown tenant';

    await this.send([
      `🔄 <b>Zmena stavu ${this.escape(this.shortOrderLabel(order))}</b>`,
      this.escape(tenantName),
      '',
      `${this.escape(this.statusLabel(fromStatus))} → <b>${this.escape(this.statusLabel(toStatus))}</b>`,
      `Zdroj: ${this.escape(this.sourceLabel(source))}`,
      `🕒 Čas: ${this.escape(this.date(new Date()))}`,
    ].join('\n'));
  }

  async notifyError(report: ErrorReport): Promise<void> {
    if (!this.enabled() || process.env.TELEGRAM_NOTIFY_ERRORS === 'false') return;

    await this.send([
      '🚨 <b>Backend chyba</b>',
      '',
      `Typ: ${this.escape(report.title)}`,
      `Správa: ${this.escape(report.message || 'no message')}`,
      report.statusCode ? `HTTP: ${this.escape(String(report.statusCode))}` : '',
      report.method || report.path ? `Request: ${this.escape(`${report.method || ''} ${report.path || ''}`.trim())}` : '',
      report.tenantId ? `Tenant ID: ${this.escape(report.tenantId)}` : '',
      report.orderId ? `Order ID: ${this.escape(report.orderId)}` : '',
      `Čas: ${this.escape(this.date(new Date()))}`,
      ...this.details(report.details),
      report.stack ? `Stack: <code>${this.escape(this.truncate(report.stack, 900))}</code>` : '',
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
            parse_mode: 'HTML',
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
    const line = `• <b>${this.escape(String(item.quantity || 1))}× ${this.escape(item.productName || 'unknown item')}</b> · ${this.escape(this.money(item.priceCents, currency))}/ks`;
    if (!item.modifiers || typeof item.modifiers !== 'object') return line;
    const modifiers = this.modifierLines(item.modifiers);
    return modifiers.length ? `${line}\n${modifiers.join('\n')}` : line;
  }

  private payment(order: TelegramOrder): string {
    if (order.paymentRef === 'cod:cash') return `hotovosť pri doručení (${this.paymentStatusLabel(order.paymentStatus)})`;
    if (order.paymentRef === 'cod:card') return `karta pri doručení (${this.paymentStatusLabel(order.paymentStatus)})`;
    if (order.paymentRef) return `${order.paymentRef} (${this.paymentStatusLabel(order.paymentStatus)})`;
    return this.paymentStatusLabel(order.paymentStatus);
  }

  private details(details?: Record<string, unknown>): string[] {
    if (!details) return [];
    return Object.entries(details).map(([key, value]) => {
      const rendered = typeof value === 'string' ? value : this.json(value);
      return `${this.escape(key)}: ${this.escape(this.truncate(rendered || '', 500))}`;
    });
  }

  private shortOrderLabel(order: TelegramOrder): string {
    return order.orderNumber ? `#${order.orderNumber}` : `#${order.id.slice(0, 8)}`;
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

  private statusLabel(status: string | null | undefined): string {
    switch (String(status || '').toUpperCase()) {
      case 'PENDING':
        return '⏳ Čaká na platbu';
      case 'PAID':
        return '✅ Zaplatené';
      case 'PREPARING':
        return '👨‍🍳 V príprave';
      case 'READY':
        return '📦 Pripravené';
      case 'OUT_FOR_DELIVERY':
        return '🚗 Na ceste';
      case 'DELIVERED':
        return '🏁 Doručené';
      case 'CANCELED':
      case 'CANCELLED':
        return '❌ Zrušené';
      default:
        return status || 'Neznámy';
    }
  }

  private paymentStatusLabel(status: string | null | undefined): string {
    switch (String(status || '').toLowerCase()) {
      case 'pending':
        return 'čaká';
      case 'success':
      case 'paid':
        return 'zaplatené';
      case 'failed':
        return 'zlyhalo';
      case 'canceled':
      case 'cancelled':
        return 'zrušené';
      default:
        return 'zatiaľ nevybraná';
    }
  }

  private sourceLabel(source: string): string {
    switch (source) {
      case 'dashboard':
        return 'Dashboard';
      case 'storyous':
        return 'Storyous';
      case 'system':
        return 'Systém';
      default:
        return source;
    }
  }

  private modifierLines(modifiers: unknown): string[] {
    if (!modifiers || typeof modifiers !== 'object') return [];
    return Object.entries(modifiers as Record<string, unknown>).map(([key, value]) => {
      const values = Array.isArray(value) ? value : [value];
      return `  ${this.escape(this.modifierLabel(key))}: ${this.escape(values.map((item) => this.optionLabel(item)).join(', '))}`;
    });
  }

  private modifierLabel(key: string): string {
    const labels: Record<string, string> = {
      edge: 'Okraj',
      dough: 'Cesto',
      sauce: 'Omáčka',
      cheese: 'Syr',
    };
    return labels[key] || this.optionLabel(key);
  }

  private optionLabel(value: unknown): string {
    return String(value ?? '')
      .replace(/[-_]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\b\w/g, (character) => character.toUpperCase()) || '-';
  }

  private escape(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
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
