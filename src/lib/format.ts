import type { Delta } from './aggregate';

const LOCALE = 'pl-PL';

const currency = new Intl.NumberFormat(LOCALE, { style: 'currency', currency: 'PLN' });
const currencyWhole = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: 'PLN',
  maximumFractionDigits: 0,
});
const integer = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 });
const oneDecimal = new Intl.NumberFormat(LOCALE, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const upToOneDecimal = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 1 });
const percent = new Intl.NumberFormat(LOCALE, {
  style: 'percent',
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
const monthShort = new Intl.DateTimeFormat(LOCALE, { month: 'short', year: 'numeric', timeZone: 'UTC' });
const monthLong = new Intl.DateTimeFormat(LOCALE, { month: 'long', year: 'numeric', timeZone: 'UTC' });
const monthNameOnly = new Intl.DateTimeFormat(LOCALE, { month: 'short', timeZone: 'UTC' });
const dayFormat = new Intl.DateTimeFormat(LOCALE, {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'UTC',
});
const dayMonth = new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'short', timeZone: 'UTC' });
const plural = new Intl.PluralRules(LOCALE);

export const EM_DASH = '—';

/** 1234.5 -> "1234,50 zł", 12345 -> "12 345,00 zł" */
export function formatCurrency(value: number | null): string {
  return value === null ? EM_DASH : currency.format(value);
}

/** Whole złoty, for KPI headlines. */
export function formatCurrencyWhole(value: number | null): string {
  return value === null ? EM_DASH : currencyWhole.format(value);
}

/** Short axis label: 12 400 -> "12,4 tys. zł", 30 000 -> "30 tys. zł", 950 -> "950 zł" */
export function formatCurrencyCompact(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${upToOneDecimal.format(value / 1_000_000)} mln zł`;
  if (abs >= 1_000) return `${upToOneDecimal.format(value / 1_000)} tys. zł`;
  return `${integer.format(value)} zł`;
}

export function formatInteger(value: number | null): string {
  return value === null ? EM_DASH : integer.format(value);
}

/** Share or rate given as a fraction: 0.0734 -> "7,3%" */
export function formatPercent(value: number | null): string {
  return value === null ? EM_DASH : percent.format(value);
}

function toUtcDate(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00Z`);
}

/** "2026-03-07" -> "07.03.2026" */
export function formatDate(isoDate: string): string {
  return dayFormat.format(toUtcDate(isoDate));
}

/** "2026-03" -> "mar 2026" */
export function formatMonthShort(month: string): string {
  return monthShort.format(toUtcDate(`${month}-01`));
}

/** "2026-03" -> "marzec 2026" */
export function formatMonthLong(month: string): string {
  return monthLong.format(toUtcDate(`${month}-01`));
}

/** "2026-03" -> "mar" */
export function formatMonthName(month: string): string {
  return monthNameOnly.format(toUtcDate(`${month}-01`));
}

/** "2026-08-03" -> "3 sie" */
export function formatDayMonth(isoDate: string): string {
  return dayMonth.format(toUtcDate(isoDate));
}

/** "3–9 sie 2026", or "29 wrz – 5 paź 2026" across months */
export function formatDayRange(start: string, end: string): string {
  const year = end.slice(0, 4);
  if (start === end) return `${formatDayMonth(start)} ${year}`;
  if (start.slice(0, 7) === end.slice(0, 7)) {
    return `${Number(start.slice(8, 10))}–${formatDayMonth(end)} ${year}`;
  }
  return `${formatDayMonth(start)} – ${formatDayMonth(end)} ${year}`;
}

/** Short axis label for a bucket that starts on `start`. */
export function formatBucketTick(start: string, granularity: 'week' | 'month'): string {
  return granularity === 'month' ? formatMonthName(start.slice(0, 7)) : formatDayMonth(start);
}

/** Full label for a bucket, e.g. "listopad 2025" or "3–9 sie 2026". */
export function formatBucketLabel(start: string, end: string, granularity: 'week' | 'month'): string {
  return granularity === 'month' ? formatMonthLong(start.slice(0, 7)) : formatDayRange(start, end);
}

export const WEEKDAYS_SHORT = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd'] as const;
export const WEEKDAYS_LONG = [
  'poniedziałek',
  'wtorek',
  'środa',
  'czwartek',
  'piątek',
  'sobota',
  'niedziela',
] as const;

/** Block 9 of 2 hours -> "18:00–20:00" */
export function formatHourBlock(block: number, size: number): string {
  const from = block * size;
  const to = from + size;
  return `${String(from).padStart(2, '0')}:00–${String(to === 24 ? 24 : to).padStart(2, '0')}:00`;
}

/** Day relative to a reference "today": "dziś", "wczoraj", "3 dni temu", older ones as a date. */
export function formatRelativeDay(date: string, today: string): string {
  const diff = Math.round((toUtcDate(today).getTime() - toUtcDate(date).getTime()) / 86_400_000);
  if (diff === 0) return 'dziś';
  if (diff === 1) return 'wczoraj';
  if (diff > 1 && diff < 7) return `${diff} dni temu`;
  return formatDate(date);
}

/** Polish plural forms: (1) zamówienie, (2-4) zamówienia, (5+) zamówień */
export function pluralPl(count: number, one: string, few: string, many: string): string {
  const rule = plural.select(count);
  if (rule === 'one') return one;
  if (rule === 'few') return few;
  return many;
}

export function formatOrderCount(count: number): string {
  return `${integer.format(count)} ${pluralPl(count, 'zamówienie', 'zamówienia', 'zamówień')}`;
}

export interface DeltaText {
  /** Arrow shown next to the number */
  symbol: '▲' | '▼' | '•';
  /** Short visible text, e.g. "12,4%" or "0,8 pp." */
  text: string;
  /** Full sentence for screen readers */
  label: string;
}

/** Stable formatters for animated counters (they receive in-between values). */
export const formatPercentMagnitude = (v: number | null): string =>
  v === null ? EM_DASH : percent.format(Math.abs(v));
export const formatPointsMagnitude = (v: number | null): string =>
  v === null ? EM_DASH : `${oneDecimal.format(Math.abs(v))} pp.`;
export const formatCompactOrDash = (v: number | null): string => (v === null ? EM_DASH : formatCurrencyCompact(v));
export const formatWholePercent = (v: number | null): string =>
  v === null ? EM_DASH : `${integer.format(Math.round(v * 100))}%`;

/** Visible and spoken text for a change against the previous period. */
export function formatDelta(delta: Delta | null): DeltaText | null {
  if (!delta) return null;
  const magnitude =
    delta.unit === 'percent'
      ? percent.format(Math.abs(delta.value))
      : `${oneDecimal.format(Math.abs(delta.value))} pp.`;
  if (delta.trend === 'flat') {
    return { symbol: '•', text: 'bez zmian', label: 'bez zmian względem poprzedniego okresu' };
  }
  const up = delta.trend === 'up';
  return {
    symbol: up ? '▲' : '▼',
    text: magnitude,
    label: `${up ? 'wzrost' : 'spadek'} o ${magnitude} względem poprzedniego okresu`,
  };
}
