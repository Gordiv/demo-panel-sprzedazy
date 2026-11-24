import { describe, expect, it } from 'vitest';
import { order } from '../test/order';
import { bucketSeries, getPeriods } from './aggregate';
import {
  goalProgress,
  kpiSparklines,
  monthlyGoals,
  planForMonth,
  recentOrders,
  salesHeatmap,
  topBy,
  type PlanInputs,
} from './insights';

const plan: PlanInputs = {
  monthlyPlan: (month) => (month === '2026-10' ? 10_000 : 8_000),
  categoryMix: {
    Elektronika: 0.2,
    'Dom i ogród': 0.25,
    Moda: 0.25,
    'Sport i rekreacja': 0.2,
    'Zdrowie i uroda': 0.1,
  },
  channelMix: { 'Sklep online': 0.5, Marketplace: 0.3, 'Sklep stacjonarny': 0.2 },
};

describe('kpiSparklines', () => {
  it('turns buckets into one series per KPI, with gaps where a ratio is undefined', () => {
    const buckets = bucketSeries(
      [
        order({ date: '2026-08-10', amount: 100 }),
        order({ date: '2026-08-11', amount: 300 }),
        order({ date: '2026-08-12', amount: 50, status: 'Zwrócone' }),
        order({ date: '2026-09-02', amount: 80, status: 'Anulowane' }),
      ],
      getPeriods('2026-10', 3).current,
      'month',
    );
    const s = kpiSparklines(buckets);
    expect(s.revenue).toEqual([400, 0, 0]);
    expect(s.orders).toEqual([3, 1, 0]);
    expect(s.averageOrderValue).toEqual([200, null, null]);
    expect(s.returnRate[0]).toBeCloseTo(1 / 3);
    expect(s.returnRate.slice(1)).toEqual([0, null]);
  });
});

describe('plan and goal progress', () => {
  it('narrows the plan by the planned category and channel mix', () => {
    expect(planForMonth('2026-10', { category: 'all', channel: 'all' }, plan)).toBe(10_000);
    expect(planForMonth('2026-10', { category: 'Moda', channel: 'all' }, plan)).toBe(2_500);
    expect(planForMonth('2026-10', { category: 'Moda', channel: 'Marketplace' }, plan)).toBeCloseTo(750);
  });

  it('computes ratio, remaining and surplus', () => {
    expect(goalProgress(750, 1000)).toEqual({ actual: 750, target: 1000, ratio: 0.75, remaining: 250, surplus: 0 });
    expect(goalProgress(1200, 1000)).toMatchObject({ ratio: 1.2, remaining: 0, surplus: 200 });
  });

  it('has no ratio without a target (no division by zero)', () => {
    expect(goalProgress(500, 0)).toMatchObject({ ratio: null, remaining: 0, surplus: 500 });
  });

  it('lists plan against actual for every month of the span', () => {
    const goals = monthlyGoals(
      [order({ date: '2026-10-03', amount: 5_000 }), order({ date: '2026-09-03', amount: 999, status: 'Zwrócone' })],
      getPeriods('2026-10', 3).current,
      { category: 'all', channel: 'all' },
      plan,
    );
    expect(goals.map((g) => g.month)).toEqual(['2026-08', '2026-09', '2026-10']);
    expect(goals.map((g) => g.actual)).toEqual([0, 0, 5_000]);
    expect(goals[2]).toMatchObject({ target: 10_000, ratio: 0.5 });
  });
});

describe('salesHeatmap', () => {
  it('buckets orders by weekday (Monday first) and 2-hour blocks', () => {
    const h = salesHeatmap([
      order({ date: '2026-10-31', time: '18:05', amount: 100 }), // Saturday
      order({ date: '2026-10-31', time: '19:59', amount: 50, status: 'Anulowane' }),
      order({ date: '2026-11-02', time: '00:10', amount: 10 }), // Monday
      order({ date: '2026-11-01', time: '23:59', amount: 20 }), // Sunday, last block
    ]);
    expect(h.rows).toHaveLength(7);
    expect(h.rows[0]).toHaveLength(12);
    expect(h.rows[5]?.[9]).toMatchObject({ orders: 2, revenue: 100 });
    expect(h.rows[0]?.[0]).toMatchObject({ orders: 1, revenue: 10 });
    expect(h.rows[6]?.[11]).toMatchObject({ orders: 1 });
    expect(h.maxOrders).toBe(2);
    expect(h.peak).toMatchObject({ weekday: 5, block: 9 });
  });

  it('is empty without orders', () => {
    const h = salesHeatmap([]);
    expect(h.maxOrders).toBe(0);
    expect(h.peak).toBeNull();
  });
});

describe('topBy', () => {
  const orders = [
    order({ client: 'Anna Nowak', amount: 100 }),
    order({ client: 'Anna Nowak', amount: 150 }),
    order({ client: 'Jan Kowalski', amount: 400, product: 'Smartwatch', category: 'Elektronika' }),
    order({ client: 'Ewa Mazur', amount: 250 }),
    order({ client: 'Piotr Król', amount: 900, status: 'Zwrócone' }),
  ];

  it('ranks by paid revenue and keeps order counts', () => {
    const top = topBy(orders, (o) => o.client, 3);
    expect(top.map((t) => t.key)).toEqual(['Jan Kowalski', 'Anna Nowak', 'Ewa Mazur']);
    expect(top[1]).toMatchObject({ revenue: 250, orders: 2, relative: 0.625 });
    expect(top[0]?.relative).toBe(1);
  });

  it('breaks revenue ties by order count, then by name', () => {
    const top = topBy(orders, (o) => o.client, 5);
    expect(top.map((t) => t.key)).toEqual(['Jan Kowalski', 'Anna Nowak', 'Ewa Mazur']);
  });

  it('skips entries without paid revenue and adds details', () => {
    const top = topBy(orders, (o) => o.product, 2, (o) => o.category);
    expect(top[0]).toMatchObject({ key: 'Sweter z merino', revenue: 500, detail: 'Moda' });
    expect(top[1]).toMatchObject({ key: 'Smartwatch', detail: 'Elektronika' });
    expect(topBy([], (o) => o.client, 5)).toEqual([]);
  });
});

describe('recentOrders', () => {
  it('returns the newest orders by date and time', () => {
    const list = recentOrders(
      [
        order({ id: 'A', date: '2026-10-30', time: '23:00' }),
        order({ id: 'B', date: '2026-10-31', time: '08:00' }),
        order({ id: 'C', date: '2026-10-31', time: '19:30' }),
      ],
      2,
    );
    expect(list.map((o) => o.id)).toEqual(['C', 'B']);
  });
});
