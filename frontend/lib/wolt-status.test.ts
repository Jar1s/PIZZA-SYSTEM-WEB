import { describe, expect, it } from 'vitest';
import { formatWoltStatus, getWoltStatusMeta } from './wolt-status';

describe('wolt status meta', () => {
  it('maps raw lowercase and normalized uppercase values', () => {
    expect(formatWoltStatus('courier_assigned')).toBe('Kuriér priradený');
    expect(formatWoltStatus('PICKED_UP')).toBe('Vyzdvihnuté');
    expect(formatWoltStatus('DELIVERED', 'en')).toBe('Delivered');
    expect(formatWoltStatus('pending')).toBe('Hľadá kuriéra');
  });

  it('assigns tones per phase', () => {
    expect(getWoltStatusMeta('pending').badgeClass).toContain('amber');
    expect(getWoltStatusMeta('courier_assigned').badgeClass).toContain('blue');
    expect(getWoltStatusMeta('DROPOFF_STARTED').badgeClass).toContain('orange');
    expect(getWoltStatusMeta('delivered').badgeClass).toContain('green');
    expect(getWoltStatusMeta('failed').badgeClass).toContain('red');
    expect(getWoltStatusMeta('cancelled').badgeClass).toContain('zinc');
  });

  it('falls back to the raw value for unknown statuses', () => {
    expect(formatWoltStatus('something_new')).toBe('something_new');
    expect(formatWoltStatus('')).toBe('Wolt');
    expect(getWoltStatusMeta('something_new').icon).toBe('🚚');
  });
});
