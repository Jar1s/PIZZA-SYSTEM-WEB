import { BadRequestException } from '@nestjs/common';
import { ANALYTICS_TIMEZONE } from './analytics.service';

export interface AnalyticsPeriod {
  start: Date;
  end: Date;
}

const partsFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: ANALYTICS_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
});

/** Offset of ANALYTICS_TIMEZONE from UTC (in minutes) at the given instant. */
function tzOffsetMinutes(date: Date): number {
  const parts = partsFormatter.formatToParts(date);
  const get = (type: string) => parseInt(parts.find((p) => p.type === type)?.value || '0', 10);
  const hour = get('hour') === 24 ? 0 : get('hour');
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), hour, get('minute'), get('second'));
  return Math.round((asUtc - date.getTime()) / 60000);
}

/** Local midnight (start of day) of a YYYY-MM-DD in ANALYTICS_TIMEZONE, as an instant. */
export function zonedStartOfDay(dateKey: string): Date {
  const guess = new Date(`${dateKey}T00:00:00Z`);
  const offset = tzOffsetMinutes(guess);
  const candidate = new Date(guess.getTime() - offset * 60000);
  // Re-check in case the offset differs at the candidate instant (DST edge)
  const offset2 = tzOffsetMinutes(candidate);
  return offset2 === offset ? candidate : new Date(guess.getTime() - offset2 * 60000);
}

/** Local end of day (23:59:59.999) of a YYYY-MM-DD in ANALYTICS_TIMEZONE. */
export function zonedEndOfDay(dateKey: string): Date {
  const next = new Date(zonedStartOfDay(dateKey).getTime());
  next.setUTCHours(next.getUTCHours() + 36); // safely into the next local day
  const nextKey = localDateKey(next);
  return new Date(zonedStartOfDay(nextKey).getTime() - 1);
}

export function localDateKey(date: Date): string {
  const parts = partsFormatter.formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value || '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;
const MAX_RANGE_DAYS = 366;

/**
 * Resolve the requested period.
 *  - from/to (YYYY-MM-DD, local): inclusive calendar range, capped at "now"
 *  - days=N: today plus the previous N-1 local calendar days, up to "now"
 */
export function resolveAnalyticsPeriod(
  query: { days?: string; from?: string; to?: string },
  now: Date = new Date(),
): AnalyticsPeriod {
  if (query.from || query.to) {
    const from = query.from || query.to!;
    const to = query.to || query.from!;
    if (!DATE_KEY.test(from) || !DATE_KEY.test(to)) {
      throw new BadRequestException('from/to must be YYYY-MM-DD');
    }
    const start = zonedStartOfDay(from);
    let end = zonedEndOfDay(to);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new BadRequestException('Invalid from/to date');
    }
    if (end < start) {
      throw new BadRequestException('to must not be before from');
    }
    if (end.getTime() - start.getTime() > MAX_RANGE_DAYS * 24 * 60 * 60 * 1000) {
      throw new BadRequestException(`Range must not exceed ${MAX_RANGE_DAYS} days`);
    }
    if (end > now) end = now;
    if (start > now) {
      throw new BadRequestException('from must not be in the future');
    }
    return { start, end };
  }

  const daysNum = Math.min(Math.max(parseInt(query.days || '30', 10) || 30, 1), MAX_RANGE_DAYS);
  const todayKey = localDateKey(now);
  const startOfToday = zonedStartOfDay(todayKey);
  const start = new Date(startOfToday.getTime() - (daysNum - 1) * 24 * 60 * 60 * 1000);
  // Snap to local midnight again in case a DST switch happened inside the range
  return { start: zonedStartOfDay(localDateKey(start)), end: now };
}
