import { CATEGORIES, CHANNELS, type Category, type Channel, type Order } from '../data/types';
import { addDays, addMonths, daysBetween, firstDayOf, lastDayOf, monthOf, monthRange } from './months';

export const PERIODS = [3, 6, 12] as const;
export type PeriodMonths = (typeof PERIODS)[number];

export interface Filters {
  months: PeriodMonths;
  category: Category | 'all';
  channel: Channel | 'all';
}

export interface MonthSpan {
  /** First month, YYYY-MM (inclusive) */
  start: string;
  /** Last month, YYYY-MM (inclusive) */
  end: string;
}

export interface Periods {
  current: MonthSpan;
  previous: MonthSpan;
}

/** The selected period ending at `endMonth` and the period of equal length right before it. */
export function getPeriods(endMonth: string, months: number): Periods {
  const currentStart = addMonths(endMonth, -(months - 1));
  const previousEnd = addMonths(currentStart, -1);
  return {
    current: { start: currentStart, end: endMonth },
    previous: { start: addMonths(previousEnd, -(months - 1)), end: previousEnd },
  };
}

export function inSpan(order: Order, span: MonthSpan): boolean {
  const m = monthOf(order.date);
  return m >= span.start && m <= span.end;
}

/** Category and channel filters only (the period is applied separately). */
export function matchesDimensions(order: Order, filters: Pick<Filters, 'category' | 'channel'>): boolean {
  return (
    (filters.category === 'all' || order.category === filters.category) &&
    (filters.channel === 'all' || order.channel === filters.channel)
  );
}

export function filterOrders(
  orders: readonly Order[],
  filters: Pick<Filters, 'category' | 'channel'>,
  span: MonthSpan,
): Order[] {
  return orders.filter((o) => inSpan(o, span) && matchesDimensions(o, filters));
}

/** Returned and cancelled orders bring no revenue. */
export function countsAsRevenue(order: Order): boolean {
  return order.status === 'Zrealizowane' || order.status === 'W realizacji';
}

/** Sum in grosze to avoid floating point drift, returned in PLN. */
export function sumRevenue(orders: readonly Order[]): number {
  let grosze = 0;
  for (const o of orders) if (countsAsRevenue(o)) grosze += Math.round(o.amount * 100);
  return grosze / 100;
}

export interface Totals {
  revenue: number;
  orders: number;
  /** Orders that count towards revenue */
  paidOrders: number;
  returns: number;
  averageOrderValue: number | null;
  /** Share of returned orders, 0..1; null when there are no orders */
  returnRate: number | null;
}

export function computeTotals(orders: readonly Order[]): Totals {
  const revenue = sumRevenue(orders);
  const paidOrders = orders.filter(countsAsRevenue).length;
  const returns = orders.filter((o) => o.status === 'Zwrócone').length;
  return {
    revenue,
    orders: orders.length,
    paidOrders,
    returns,
    averageOrderValue: paidOrders > 0 ? revenue / paidOrders : null,
    returnRate: orders.length > 0 ? returns / orders.length : null,
  };
}

/** Relative change (0.1 = +10%). Null when there is nothing to compare with. */
export function percentChange(current: number | null, previous: number | null): number | null {
  if (current === null || previous === null || previous === 0) return null;
  return (current - previous) / Math.abs(previous);
}

export type Trend = 'up' | 'down' | 'flat';

export interface Delta {
  /** Relative change for amounts and counts, percentage-point change for rates */
  value: number;
  unit: 'percent' | 'points';
  trend: Trend;
  /** Whether the change is good news (a drop in returns is good) */
  favourable: boolean | null;
}

const FLAT_EPSILON = 0.0005;

function toDelta(value: number | null, unit: Delta['unit'], higherIsBetter: boolean): Delta | null {
  if (value === null || !Number.isFinite(value)) return null;
  const trend: Trend = Math.abs(value) < FLAT_EPSILON ? 'flat' : value > 0 ? 'up' : 'down';
  const favourable = trend === 'flat' ? null : (trend === 'up') === higherIsBetter;
  return { value, unit, trend, favourable };
}

export interface KpiValue {
  current: number | null;
  previous: number | null;
  delta: Delta | null;
}

export interface Kpis {
  revenue: KpiValue;
  orders: KpiValue;
  averageOrderValue: KpiValue;
  returnRate: KpiValue;
}

export function computeKpis(current: readonly Order[], previous: readonly Order[]): Kpis {
  const c = computeTotals(current);
  const p = computeTotals(previous);
  const rateDelta =
    c.returnRate === null || p.returnRate === null ? null : (c.returnRate - p.returnRate) * 100;
  return {
    revenue: {
      current: c.revenue,
      previous: p.revenue,
      delta: toDelta(percentChange(c.revenue, p.revenue), 'percent', true),
    },
    orders: {
      current: c.orders,
      previous: p.orders,
      delta: toDelta(percentChange(c.orders, p.orders), 'percent', true),
    },
    averageOrderValue: {
      current: c.averageOrderValue,
      previous: p.averageOrderValue,
      delta: toDelta(percentChange(c.averageOrderValue, p.averageOrderValue), 'percent', true),
    },
    returnRate: {
      current: c.returnRate,
      previous: p.returnRate,
      delta: toDelta(rateDelta, 'points', false),
    },
  };
}

export type Granularity = 'week' | 'month';

export interface Bucket {
  /** First day of the bucket (YYYY-MM-DD) */
  start: string;
  /** Last day of the bucket, inclusive */
  end: string;
  revenue: number;
  orders: number;
  paidOrders: number;
  returns: number;
}

/** First and last calendar day of a month span. */
export function spanDays(span: MonthSpan): { first: string; last: string } {
  return { first: firstDayOf(span.start), last: lastDayOf(span.end) };
}

/**
 * Splits a period into calendar months or 7-day blocks counted from its first
 * day (the last block may be shorter) and sums the orders that fall in each.
 */
export function bucketSeries(orders: readonly Order[], span: MonthSpan, granularity: Granularity): Bucket[] {
  const { first, last } = spanDays(span);
  const buckets: Bucket[] = [];
  const blank = (start: string, end: string): Bucket => ({
    start,
    end,
    revenue: 0,
    orders: 0,
    paidOrders: 0,
    returns: 0,
  });

  const months = monthRange(span.start, span.end);
  if (granularity === 'month') {
    for (const m of months) buckets.push(blank(firstDayOf(m), lastDayOf(m)));
  } else {
    const total = daysBetween(first, last) + 1;
    for (let d = 0; d < total; d += 7) buckets.push(blank(addDays(first, d), addDays(first, Math.min(d + 6, total - 1))));
  }

  const grosze = buckets.map(() => 0);
  for (const o of orders) {
    if (o.date < first || o.date > last) continue;
    const i =
      granularity === 'month' ? months.indexOf(monthOf(o.date)) : Math.floor(daysBetween(first, o.date) / 7);
    const bucket = buckets[i];
    if (!bucket) continue;
    bucket.orders += 1;
    if (o.status === 'Zwrócone') bucket.returns += 1;
    if (countsAsRevenue(o)) {
      bucket.paidOrders += 1;
      grosze[i] = (grosze[i] ?? 0) + Math.round(o.amount * 100);
    }
  }
  buckets.forEach((b, i) => {
    b.revenue = (grosze[i] ?? 0) / 100;
  });
  return buckets;
}

export interface SeriesPoint extends Bucket {
  /** Bucket at the same position in the previous period; null when that period is shorter */
  previousStart: string | null;
  previousEnd: string | null;
  previousRevenue: number | null;
}

/** Current period buckets, each paired with the bucket at the same position in the previous period. */
export function timeSeries(
  current: readonly Order[],
  previous: readonly Order[],
  periods: Periods,
  granularity: Granularity,
): SeriesPoint[] {
  const prev = bucketSeries(previous, periods.previous, granularity);
  return bucketSeries(current, periods.current, granularity).map((b, i) => {
    const p = prev[i];
    return {
      ...b,
      previousStart: p?.start ?? null,
      previousEnd: p?.end ?? null,
      previousRevenue: p ? p.revenue : null,
    };
  });
}

export interface Share<K extends string> {
  key: K;
  revenue: number;
  orders: number;
  /** Share of total revenue, 0..1 (0 when the total is 0) */
  share: number;
}

function breakdown<K extends string>(
  orders: readonly Order[],
  keys: readonly K[],
  keyOf: (o: Order) => K,
): Share<K>[] {
  const grosze = new Map<K, number>(keys.map((k) => [k, 0]));
  const counts = new Map<K, number>(keys.map((k) => [k, 0]));
  for (const o of orders) {
    const k = keyOf(o);
    counts.set(k, (counts.get(k) ?? 0) + 1);
    if (countsAsRevenue(o)) grosze.set(k, (grosze.get(k) ?? 0) + Math.round(o.amount * 100));
  }
  const total = [...grosze.values()].reduce((a, b) => a + b, 0);
  return keys.map((key) => {
    const g = grosze.get(key) ?? 0;
    return { key, revenue: g / 100, orders: counts.get(key) ?? 0, share: total > 0 ? g / total : 0 };
  });
}

/** Revenue per category in the fixed category order. */
export function revenueByCategory(orders: readonly Order[]): Share<Category>[] {
  return breakdown(orders, CATEGORIES, (o) => o.category);
}

/** Revenue per channel in the fixed channel order (colours follow the channel, not its rank). */
export function revenueByChannel(orders: readonly Order[]): Share<Channel>[] {
  return breakdown(orders, CHANNELS, (o) => o.channel);
}

/** Lower case without Polish diacritics, for forgiving search. */
export function normalizeText(text: string): string {
  return text
    .toLocaleLowerCase('pl-PL')
    .replace(/ł/g, 'l')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function searchOrders(orders: readonly Order[], query: string): Order[] {
  const q = normalizeText(query);
  if (!q) return [...orders];
  return orders.filter((o) => normalizeText(o.client).includes(q) || normalizeText(o.id).includes(q));
}

export type SortKey = 'id' | 'date' | 'client' | 'category' | 'channel' | 'amount' | 'status';
export type SortDirection = 'asc' | 'desc';

const collator = new Intl.Collator('pl-PL', { sensitivity: 'base', numeric: true });

export function sortOrders(orders: readonly Order[], key: SortKey, direction: SortDirection): Order[] {
  const factor = direction === 'asc' ? 1 : -1;
  return [...orders].sort((a, b) => {
    let result: number;
    if (key === 'amount') result = a.amount - b.amount;
    else if (key === 'date') {
      const ka = `${a.date} ${a.time}`;
      const kb = `${b.date} ${b.time}`;
      result = ka < kb ? -1 : ka > kb ? 1 : 0;
    } else if (key === 'id') result = a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
    else result = collator.compare(a[key], b[key]);
    // Ties fall back to the order number so the result is stable and predictable.
    if (result === 0 && key !== 'id') result = a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
    return result * factor;
  });
}

export interface Page<T> {
  items: T[];
  page: number;
  pageCount: number;
  /** 1-based index of the first item on the page, 0 when empty */
  from: number;
  /** 1-based index of the last item on the page, 0 when empty */
  to: number;
  total: number;
}

export function paginate<T>(items: readonly T[], page: number, pageSize: number): Page<T> {
  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, Math.floor(page)), pageCount);
  const startIndex = (safePage - 1) * pageSize;
  const pageItems = items.slice(startIndex, startIndex + pageSize);
  return {
    items: pageItems,
    page: safePage,
    pageCount,
    from: total === 0 ? 0 : startIndex + 1,
    to: startIndex + pageItems.length,
    total,
  };
}
