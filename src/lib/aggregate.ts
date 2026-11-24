import { CATEGORIES, CHANNELS, type Category, type Channel, type Order } from '../data/types';
import { addMonths, monthOf, monthRange } from './months';

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

export interface MonthPoint {
  month: string;
  revenue: number;
  orders: number;
  /** Month at the same position in the previous period */
  previousMonth: string;
  previousRevenue: number;
}

/** Revenue per month for the current period, aligned with the previous period month by month. */
export function monthlySeries(
  current: readonly Order[],
  previous: readonly Order[],
  periods: Periods,
): MonthPoint[] {
  const revenueBy = (orders: readonly Order[]) => {
    const map = new Map<string, { grosze: number; count: number }>();
    for (const o of orders) {
      const key = monthOf(o.date);
      const entry = map.get(key) ?? { grosze: 0, count: 0 };
      entry.count += 1;
      if (countsAsRevenue(o)) entry.grosze += Math.round(o.amount * 100);
      map.set(key, entry);
    }
    return map;
  };
  const cur = revenueBy(current);
  const prev = revenueBy(previous);
  const prevMonths = monthRange(periods.previous.start, periods.previous.end);

  return monthRange(periods.current.start, periods.current.end).map((month, i) => {
    const previousMonth = prevMonths[i] ?? addMonths(month, -prevMonths.length);
    return {
      month,
      revenue: (cur.get(month)?.grosze ?? 0) / 100,
      orders: cur.get(month)?.count ?? 0,
      previousMonth,
      previousRevenue: (prev.get(previousMonth)?.grosze ?? 0) / 100,
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
    else if (key === 'date' || key === 'id') result = a[key] < b[key] ? -1 : a[key] > b[key] ? 1 : 0;
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
