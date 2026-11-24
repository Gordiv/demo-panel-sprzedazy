import type { Category, Channel, Order } from '../data/types';
import { countsAsRevenue, type Bucket, type Filters, type MonthSpan } from './aggregate';
import { monthOf, monthRange, weekdayOf } from './months';

/* ---------- KPI sparklines ---------- */

export interface KpiSparklines {
  revenue: number[];
  orders: number[];
  /** Average order value per bucket; null where nothing was paid */
  averageOrderValue: Array<number | null>;
  /** Share of returned orders per bucket, 0..1; null where there were no orders */
  returnRate: Array<number | null>;
}

export function kpiSparklines(buckets: readonly Bucket[]): KpiSparklines {
  return {
    revenue: buckets.map((b) => b.revenue),
    orders: buckets.map((b) => b.orders),
    averageOrderValue: buckets.map((b) => (b.paidOrders > 0 ? b.revenue / b.paidOrders : null)),
    returnRate: buckets.map((b) => (b.orders > 0 ? b.returns / b.orders : null)),
  };
}

/* ---------- Sales plan ---------- */

export interface PlanInputs {
  monthlyPlan: (month: string) => number;
  categoryMix: Record<Category, number>;
  channelMix: Record<Channel, number>;
}

/** Target revenue for one month, narrowed to the selected category and channel by the planned mix. */
export function planForMonth(month: string, filters: Pick<Filters, 'category' | 'channel'>, plan: PlanInputs): number {
  const categoryShare = filters.category === 'all' ? 1 : plan.categoryMix[filters.category];
  const channelShare = filters.channel === 'all' ? 1 : plan.channelMix[filters.channel];
  return plan.monthlyPlan(month) * categoryShare * channelShare;
}

export interface GoalProgress {
  actual: number;
  target: number;
  /** actual / target; null when there is no target */
  ratio: number | null;
  /** Amount still missing (0 when the goal is met) */
  remaining: number;
  /** Amount above the goal (0 when below) */
  surplus: number;
}

export function goalProgress(actual: number, target: number): GoalProgress {
  return {
    actual,
    target,
    ratio: target > 0 ? actual / target : null,
    remaining: Math.max(0, target - actual),
    surplus: Math.max(0, actual - target),
  };
}

export interface MonthGoal extends GoalProgress {
  month: string;
}

/** Plan against actual revenue for every month of the span. */
export function monthlyGoals(
  orders: readonly Order[],
  span: MonthSpan,
  filters: Pick<Filters, 'category' | 'channel'>,
  plan: PlanInputs,
): MonthGoal[] {
  const grosze = new Map<string, number>();
  for (const o of orders) {
    if (!countsAsRevenue(o)) continue;
    const m = monthOf(o.date);
    grosze.set(m, (grosze.get(m) ?? 0) + Math.round(o.amount * 100));
  }
  return monthRange(span.start, span.end).map((month) => ({
    month,
    ...goalProgress((grosze.get(month) ?? 0) / 100, planForMonth(month, filters, plan)),
  }));
}

/* ---------- Weekday x hour heatmap ---------- */

export const HOUR_BLOCK = 2;
export const HOUR_BLOCKS = 24 / HOUR_BLOCK;

export interface HeatCell {
  weekday: number;
  block: number;
  orders: number;
  revenue: number;
}

export interface Heatmap {
  /** rows[weekday][block], Monday first, blocks of HOUR_BLOCK hours */
  rows: HeatCell[][];
  maxOrders: number;
  peak: HeatCell | null;
}

export function salesHeatmap(orders: readonly Order[]): Heatmap {
  const rows: HeatCell[][] = Array.from({ length: 7 }, (_, weekday) =>
    Array.from({ length: HOUR_BLOCKS }, (_, block) => ({ weekday, block, orders: 0, revenue: 0 })),
  );
  const grosze: number[][] = rows.map((r) => r.map(() => 0));
  for (const o of orders) {
    const hour = Number(o.time.slice(0, 2));
    const block = Math.min(HOUR_BLOCKS - 1, Math.floor(hour / HOUR_BLOCK));
    const weekday = weekdayOf(o.date);
    const cell = rows[weekday]?.[block];
    const g = grosze[weekday];
    if (!cell || !g) continue;
    cell.orders += 1;
    if (countsAsRevenue(o)) g[block] = (g[block] ?? 0) + Math.round(o.amount * 100);
  }
  let peak: HeatCell | null = null;
  rows.forEach((row, w) =>
    row.forEach((cell, b) => {
      cell.revenue = (grosze[w]?.[b] ?? 0) / 100;
      if (cell.orders > 0 && (!peak || cell.orders > peak.orders)) peak = cell;
    }),
  );
  const maxOrders = (peak as HeatCell | null)?.orders ?? 0;
  return { rows, maxOrders, peak };
}

/* ---------- Leaderboards ---------- */

export interface Ranked {
  key: string;
  revenue: number;
  orders: number;
  /** Revenue relative to the leader, 0..1 */
  relative: number;
  /** Extra label, e.g. the product category */
  detail?: string;
}

/** Top entries by paid revenue; ties go to more orders, then alphabetical order. */
export function topBy(
  orders: readonly Order[],
  keyOf: (o: Order) => string,
  limit: number,
  detailOf?: (o: Order) => string,
): Ranked[] {
  const map = new Map<string, { grosze: number; orders: number; detail?: string }>();
  for (const o of orders) {
    const key = keyOf(o);
    const entry = map.get(key) ?? { grosze: 0, orders: 0, detail: detailOf?.(o) };
    entry.orders += 1;
    if (countsAsRevenue(o)) entry.grosze += Math.round(o.amount * 100);
    map.set(key, entry);
  }
  const sorted = [...map.entries()]
    .filter(([, v]) => v.grosze > 0)
    .sort((a, b) => b[1].grosze - a[1].grosze || b[1].orders - a[1].orders || a[0].localeCompare(b[0], 'pl'))
    .slice(0, limit);
  const top = sorted[0]?.[1].grosze ?? 0;
  return sorted.map(([key, v]) => ({
    key,
    revenue: v.grosze / 100,
    orders: v.orders,
    relative: top > 0 ? v.grosze / top : 0,
    ...(v.detail !== undefined ? { detail: v.detail } : {}),
  }));
}

/** Newest orders first (by date and time). */
export function recentOrders(orders: readonly Order[], limit: number): Order[] {
  return [...orders]
    .sort((a, b) => {
      const ka = `${a.date} ${a.time}`;
      const kb = `${b.date} ${b.time}`;
      return ka < kb ? 1 : ka > kb ? -1 : a.id < b.id ? 1 : -1;
    })
    .slice(0, limit);
}
