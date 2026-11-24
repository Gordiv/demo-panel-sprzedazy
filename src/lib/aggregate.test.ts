import { describe, expect, it } from 'vitest';
import { order } from '../test/order';
import {
  computeKpis,
  computeTotals,
  filterOrders,
  bucketSeries,
  getPeriods,
  normalizeText,
  paginate,
  percentChange,
  revenueByCategory,
  revenueByChannel,
  searchOrders,
  sortOrders,
  sumRevenue,
  timeSeries,
} from './aggregate';
import { addDays, addMonths, daysBetween, lastDayOf, monthRange, weekdayOf } from './months';


describe('months', () => {
  it('adds months across year boundaries', () => {
    expect(addMonths('2026-01', -1)).toBe('2025-12');
    expect(addMonths('2025-12', 1)).toBe('2026-01');
    expect(addMonths('2026-10', -23)).toBe('2024-11');
  });

  it('lists an inclusive month range', () => {
    expect(monthRange('2025-11', '2026-02')).toEqual(['2025-11', '2025-12', '2026-01', '2026-02']);
  });

  it('works with days, month ends and weekdays', () => {
    expect(addDays('2026-02-27', 3)).toBe('2026-03-02');
    expect(daysBetween('2025-12-30', '2026-01-02')).toBe(3);
    expect(lastDayOf('2024-02')).toBe('2024-02-29');
    expect(lastDayOf('2026-12')).toBe('2026-12-31');
    expect(weekdayOf('2026-10-31')).toBe(5); // Saturday, Monday = 0
    expect(weekdayOf('2026-11-02')).toBe(0);
  });
});

describe('getPeriods', () => {
  it('builds the current period and an equally long previous one', () => {
    expect(getPeriods('2026-10', 3)).toEqual({
      current: { start: '2026-08', end: '2026-10' },
      previous: { start: '2026-05', end: '2026-07' },
    });
    expect(getPeriods('2026-10', 12)).toEqual({
      current: { start: '2025-11', end: '2026-10' },
      previous: { start: '2024-11', end: '2025-10' },
    });
  });
});

describe('filterOrders', () => {
  const orders = [
    order({ date: '2026-07-31', category: 'Moda' }),
    order({ date: '2026-08-01', category: 'Moda', channel: 'Marketplace' }),
    order({ date: '2026-10-31', category: 'Elektronika' }),
    order({ date: '2026-11-01', category: 'Moda' }),
  ];
  const span = { start: '2026-08', end: '2026-10' };

  it('keeps only orders inside the month span (inclusive edges)', () => {
    expect(filterOrders(orders, { category: 'all', channel: 'all' }, span)).toHaveLength(2);
  });

  it('applies category and channel together', () => {
    expect(filterOrders(orders, { category: 'Moda', channel: 'all' }, span)).toHaveLength(1);
    expect(filterOrders(orders, { category: 'Moda', channel: 'Sklep online' }, span)).toHaveLength(0);
    expect(filterOrders(orders, { category: 'all', channel: 'Marketplace' }, span)).toHaveLength(1);
  });
});

describe('totals and KPIs', () => {
  it('leaves returned and cancelled orders out of revenue', () => {
    const orders = [
      order({ amount: 100 }),
      order({ amount: 50, status: 'W realizacji' }),
      order({ amount: 999, status: 'Zwrócone' }),
      order({ amount: 777, status: 'Anulowane' }),
    ];
    const t = computeTotals(orders);
    expect(t.revenue).toBe(150);
    expect(t.orders).toBe(4);
    expect(t.paidOrders).toBe(2);
    expect(t.averageOrderValue).toBe(75);
    expect(t.returnRate).toBe(0.25);
  });

  it('sums money without floating point drift', () => {
    const orders = Array.from({ length: 10 }, () => order({ amount: 0.1 }));
    expect(sumRevenue(orders)).toBe(1);
    expect(sumRevenue([order({ amount: 0.1 }), order({ amount: 0.2 })])).toBe(0.3);
  });

  it('returns null averages for an empty list instead of dividing by zero', () => {
    const t = computeTotals([]);
    expect(t.revenue).toBe(0);
    expect(t.averageOrderValue).toBeNull();
    expect(t.returnRate).toBeNull();
  });

  it('percentChange handles zero and missing previous values', () => {
    expect(percentChange(120, 100)).toBeCloseTo(0.2);
    expect(percentChange(80, 100)).toBeCloseTo(-0.2);
    expect(percentChange(100, 0)).toBeNull();
    expect(percentChange(0, 0)).toBeNull();
    expect(percentChange(null, 100)).toBeNull();
    expect(percentChange(100, null)).toBeNull();
  });

  it('compares with the previous period', () => {
    const current = [order({ amount: 300 }), order({ amount: 100, status: 'Zwrócone' })];
    const previous = [order({ amount: 100 }), order({ amount: 100 })];
    const k = computeKpis(current, previous);

    expect(k.revenue.current).toBe(300);
    expect(k.revenue.delta).toMatchObject({ unit: 'percent', trend: 'up', favourable: true });
    expect(k.revenue.delta?.value).toBeCloseTo(0.5);

    expect(k.orders.delta).toMatchObject({ trend: 'flat', favourable: null });

    expect(k.averageOrderValue.current).toBe(300);
    expect(k.averageOrderValue.delta?.value).toBeCloseTo(2);

    // Returns went from 0% to 50%: +50 percentage points, which is bad news.
    expect(k.returnRate.delta).toMatchObject({ unit: 'points', trend: 'up', favourable: false });
    expect(k.returnRate.delta?.value).toBeCloseTo(50);
  });

  it('gives no deltas when the previous period is empty', () => {
    const k = computeKpis([order({})], []);
    expect(k.revenue.delta).toBeNull();
    expect(k.orders.delta).toBeNull();
    expect(k.averageOrderValue.delta).toBeNull();
    expect(k.returnRate.delta).toBeNull();
    expect(k.revenue.previous).toBe(0);
  });

  it('gives no deltas when both periods are empty', () => {
    const k = computeKpis([], []);
    expect(k.revenue.current).toBe(0);
    expect(k.averageOrderValue.current).toBeNull();
    expect(Object.values(k).every((v) => v.delta === null)).toBe(true);
  });

  it('treats a drop to zero revenue as a 100% fall', () => {
    const k = computeKpis([order({ status: 'Anulowane' })], [order({ amount: 200 })]);
    expect(k.revenue.delta).toMatchObject({ value: -1, trend: 'down', favourable: false });
    expect(k.averageOrderValue.current).toBeNull();
    expect(k.averageOrderValue.delta).toBeNull();
  });
});

describe('bucketSeries and timeSeries', () => {
  const periods = getPeriods('2026-10', 3);

  it('returns every month of the period, also months without orders', () => {
    const series = timeSeries([order({ date: '2026-09-10', amount: 40 })], [], periods, 'month');
    expect(series.map((p) => p.start)).toEqual(['2026-08-01', '2026-09-01', '2026-10-01']);
    expect(series.map((p) => p.end)).toEqual(['2026-08-31', '2026-09-30', '2026-10-31']);
    expect(series.map((p) => p.revenue)).toEqual([0, 40, 0]);
    expect(series.map((p) => p.previousRevenue)).toEqual([0, 0, 0]);
  });

  it('aligns previous period months by position', () => {
    const series = timeSeries(
      [order({ date: '2026-08-02', amount: 10 })],
      [order({ date: '2026-05-20', amount: 7 }), order({ date: '2026-07-01', amount: 3 })],
      periods,
      'month',
    );
    expect(series.map((p) => p.previousStart)).toEqual(['2026-05-01', '2026-06-01', '2026-07-01']);
    expect(series.map((p) => p.previousRevenue)).toEqual([7, 0, 3]);
    expect(series[0]?.orders).toBe(1);
  });

  it('splits a period into 7-day blocks with a shorter last block', () => {
    const buckets = bucketSeries(
      [
        order({ date: '2026-08-01', amount: 5 }),
        order({ date: '2026-08-07', amount: 5 }),
        order({ date: '2026-08-08', amount: 1, status: 'Zwrócone' }),
        order({ date: '2026-10-31', amount: 2 }),
      ],
      periods.current,
      'week',
    );
    // 92 days -> 13 full weeks and one day.
    expect(buckets).toHaveLength(14);
    expect(buckets[0]).toMatchObject({ start: '2026-08-01', end: '2026-08-07', revenue: 10, orders: 2, paidOrders: 2 });
    expect(buckets[1]).toMatchObject({ start: '2026-08-08', revenue: 0, orders: 1, returns: 1, paidOrders: 0 });
    expect(buckets[13]).toMatchObject({ start: '2026-10-31', end: '2026-10-31', revenue: 2 });
  });

  it('marks positions the previous period does not have', () => {
    const six = getPeriods('2026-10', 6);
    // May-Oct has 184 days (27 blocks), Nov-Apr only 181 (26 blocks).
    const series = timeSeries([], [], six, 'week');
    expect(series).toHaveLength(27);
    expect(series[26]?.previousRevenue).toBeNull();
    expect(series[25]?.previousRevenue).toBe(0);
  });

  it('ignores orders outside the span', () => {
    const buckets = bucketSeries([order({ date: '2026-07-31' }), order({ date: '2026-11-01' })], periods.current, 'month');
    expect(buckets.every((b) => b.orders === 0)).toBe(true);
  });
});

describe('breakdowns', () => {
  it('keeps the fixed key order and computes shares', () => {
    const orders = [
      order({ category: 'Elektronika', channel: 'Marketplace', amount: 300 }),
      order({ category: 'Moda', channel: 'Sklep online', amount: 100 }),
      order({ category: 'Moda', channel: 'Sklep online', amount: 50, status: 'Zwrócone' }),
    ];
    const categories = revenueByCategory(orders);
    expect(categories.map((c) => c.key)).toEqual([
      'Elektronika',
      'Dom i ogród',
      'Moda',
      'Sport i rekreacja',
      'Zdrowie i uroda',
    ]);
    expect(categories[0]).toMatchObject({ revenue: 300, share: 0.75, orders: 1 });
    expect(categories[2]).toMatchObject({ revenue: 100, share: 0.25, orders: 2 });

    const channels = revenueByChannel(orders);
    expect(channels.map((c) => c.key)).toEqual(['Sklep online', 'Marketplace', 'Sklep stacjonarny']);
    expect(channels.reduce((s, c) => s + c.share, 0)).toBeCloseTo(1);
  });

  it('returns zero shares (not NaN) when there is no revenue', () => {
    const channels = revenueByChannel([order({ status: 'Anulowane' })]);
    expect(channels.every((c) => c.share === 0)).toBe(true);
  });
});

describe('search, sort and pagination', () => {
  const orders = [
    order({ id: 'ZAM-2026-00010', client: 'Łukasz Wiśniewski', amount: 30, date: '2026-10-02' }),
    order({ id: 'ZAM-2026-00011', client: 'Anna Żak', amount: 300, date: '2026-10-01' }),
    order({ id: 'ZAM-2026-00012', client: 'Zofia Ćwik', amount: 30, date: '2026-10-03' }),
  ];

  it('normalizes Polish letters and case', () => {
    expect(normalizeText('  Łukasz  WIŚNIEWSKI ')).toBe('lukasz wisniewski');
  });

  it('finds orders by client or number, ignoring diacritics', () => {
    expect(searchOrders(orders, 'wisniew').map((o) => o.id)).toEqual(['ZAM-2026-00010']);
    expect(searchOrders(orders, '00011').map((o) => o.client)).toEqual(['Anna Żak']);
    expect(searchOrders(orders, 'zam-2026')).toHaveLength(3);
    expect(searchOrders(orders, '   ')).toHaveLength(3);
    expect(searchOrders(orders, 'brak')).toHaveLength(0);
  });

  it('sorts by amount with a stable tie-break on the order number', () => {
    expect(sortOrders(orders, 'amount', 'asc').map((o) => o.id)).toEqual([
      'ZAM-2026-00010',
      'ZAM-2026-00012',
      'ZAM-2026-00011',
    ]);
    expect(sortOrders(orders, 'amount', 'desc').map((o) => o.id)).toEqual([
      'ZAM-2026-00011',
      'ZAM-2026-00012',
      'ZAM-2026-00010',
    ]);
  });

  it('sorts text with Polish collation and dates chronologically', () => {
    expect(sortOrders(orders, 'client', 'asc').map((o) => o.client)).toEqual([
      'Anna Żak',
      'Łukasz Wiśniewski',
      'Zofia Ćwik',
    ]);
    expect(sortOrders(orders, 'date', 'desc').map((o) => o.date)).toEqual([
      '2026-10-03',
      '2026-10-02',
      '2026-10-01',
    ]);
  });

  it('does not mutate the input', () => {
    const copy = [...orders];
    sortOrders(orders, 'client', 'desc');
    expect(orders).toEqual(copy);
  });

  it('paginates and clamps the page number', () => {
    const items = Array.from({ length: 19 }, (_, i) => i + 1);
    expect(paginate(items, 1, 8)).toMatchObject({ from: 1, to: 8, pageCount: 3, total: 19 });
    expect(paginate(items, 3, 8)).toMatchObject({ items: [17, 18, 19], from: 17, to: 19 });
    expect(paginate(items, 99, 8).page).toBe(3);
    expect(paginate(items, 0, 8).page).toBe(1);
    expect(paginate([], 1, 8)).toMatchObject({ items: [], from: 0, to: 0, page: 1, pageCount: 1 });
  });
});
