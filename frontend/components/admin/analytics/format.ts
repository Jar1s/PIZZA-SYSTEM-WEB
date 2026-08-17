const eur = new Intl.NumberFormat('sk-SK', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 });
const eurRound = new Intl.NumberFormat('sk-SK', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const int = new Intl.NumberFormat('sk-SK');

export function money(cents: number): string {
  return eur.format((cents || 0) / 100);
}

export function moneyRound(cents: number): string {
  return eurRound.format((cents || 0) / 100);
}

export function num(value: number): string {
  return int.format(value || 0);
}

export function pct(value: number, digits = 0): string {
  return `${(value || 0).toFixed(digits).replace('.', ',')} %`;
}

export function signedPct(value: number | null): string {
  if (value === null || Number.isNaN(value)) return '–';
  const sign = value > 0 ? '+' : value < 0 ? '−' : '±';
  return `${sign}${Math.abs(value)} %`;
}

export function duration(seconds: number): string {
  if (!seconds || seconds <= 0) return '–';
  const mins = Math.round(seconds / 60);
  if (mins < 1) return '< 1 min';
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

/** "2026-08-16" → "16. 8." */
export function shortDate(dateKey: string): string {
  const d = new Date(`${dateKey}T12:00:00`);
  if (Number.isNaN(d.getTime())) return dateKey;
  return d.toLocaleDateString('sk-SK', { day: 'numeric', month: 'numeric' });
}

/** "2026-08-16" → "so 16. 8." */
export function shortDateWithWeekday(dateKey: string): string {
  const d = new Date(`${dateKey}T12:00:00`);
  if (Number.isNaN(d.getTime())) return dateKey;
  return d.toLocaleDateString('sk-SK', { weekday: 'short', day: 'numeric', month: 'numeric' });
}

export function isWeekend(dateKey: string): boolean {
  const d = new Date(`${dateKey}T12:00:00`);
  const day = d.getDay();
  return day === 5 || day === 6; // Fri, Sat – pizza peak days
}

export function longDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('sk-SK', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function time(date: Date): string {
  return date.toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' });
}

/** Local YYYY-MM-DD for <input type="date"> */
export function toDateInputValue(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export const WEEKDAYS_SHORT = ['Po', 'Ut', 'St', 'Št', 'Pi', 'So', 'Ne'];

export function km(meters: number): string {
  if (!meters || meters <= 0) return '–';
  return `${(meters / 1000).toFixed(1).replace('.', ',')} km`;
}

/** Local date range for a quick preset (Mon-based weeks). */
export function presetRange(preset: 'today' | 'yesterday' | 'thisWeek' | 'thisMonth', now = new Date()): { from: string; to: string } {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (preset === 'today') return { from: toDateInputValue(today), to: toDateInputValue(today) };
  if (preset === 'yesterday') {
    const y = new Date(today);
    y.setDate(y.getDate() - 1);
    return { from: toDateInputValue(y), to: toDateInputValue(y) };
  }
  if (preset === 'thisWeek') {
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
    return { from: toDateInputValue(monday), to: toDateInputValue(today) };
  }
  const first = new Date(today.getFullYear(), today.getMonth(), 1);
  return { from: toDateInputValue(first), to: toDateInputValue(today) };
}
