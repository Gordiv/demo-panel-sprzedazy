import { describe, expect, it } from 'vitest';
import { countsAsRevenue, getPeriods } from '../lib/aggregate';
import { monthRange, weekdayOf } from '../lib/months';
import { PRODUCTS } from './catalog';
import { DATA_END_DATE, DATA_END_MONTH, generateOrders } from './generate';
import { PLAN_CATEGORY_MIX, PLAN_CHANNEL_MIX, monthlyPlan } from './plan';
import { CATEGORIES, CHANNELS, STATUSES } from './types';

describe('generateOrders', () => {
  const orders = generateOrders();
  const { current } = getPeriods(DATA_END_MONTH, 12);
  const recent = orders.filter((o) => o.date.slice(0, 7) >= current.start);

  it('is deterministic for the same seed', () => {
    expect(generateOrders()).toEqual(orders);
    expect(generateOrders(1)).not.toEqual(orders);
  });

  it('has about 400 orders in the last 12 months', () => {
    expect(recent.length).toBeGreaterThan(360);
    expect(recent.length).toBeLessThan(440);
  });

  it('produces valid, unique records', () => {
    const ids = new Set(orders.map((o) => o.id));
    expect(ids.size).toBe(orders.length);
    for (const o of orders) {
      expect(o.id).toMatch(/^ZAM-\d{4}-\d{5}$/);
      expect(o.id.slice(4, 8)).toBe(o.date.slice(0, 4));
      expect(o.date <= DATA_END_DATE).toBe(true);
      expect(o.time).toMatch(/^([01]\d|2[0-3]):[0-5]\d$/);
      expect(CATEGORIES).toContain(o.category);
      expect(CHANNELS).toContain(o.channel);
      expect(STATUSES).toContain(o.status);
      expect(PRODUCTS[o.category].map((p) => p.name)).toContain(o.product);
      expect(o.amount).toBeGreaterThan(0);
      expect(Math.round(o.amount * 100) / 100).toBe(o.amount);
      expect(o.client).toMatch(/^\S+ \S+$/);
    }
  });

  it('is sorted by date and time, with numbers in that order', () => {
    for (let i = 1; i < orders.length; i++) {
      const a = orders[i - 1];
      const b = orders[i];
      if (!a || !b) continue;
      expect(`${a.date} ${a.time}` <= `${b.date} ${b.time}`).toBe(true);
    }
  });

  it('only has orders in progress close to the end date', () => {
    const inProgress = orders.filter((o) => o.status === 'W realizacji');
    expect(inProgress.length).toBeGreaterThan(0);
    expect(inProgress.every((o) => o.date >= '2026-10-15')).toBe(true);
  });

  it('keeps the physical shop within opening hours and mostly closed on Sundays', () => {
    const shop = orders.filter((o) => o.channel === 'Sklep stacjonarny');
    expect(shop.every((o) => o.time >= '09:00' && o.time < '20:00')).toBe(true);
    const sundays = shop.filter((o) => weekdayOf(o.date) === 6).length;
    expect(sundays / shop.length).toBeLessThan(0.05);
  });

  it('has returning customers for the leaderboard', () => {
    const counts = new Map<string, number>();
    for (const o of recent) counts.set(o.client, (counts.get(o.client) ?? 0) + 1);
    expect(Math.max(...counts.values())).toBeGreaterThanOrEqual(4);
  });
});

describe('sales plan', () => {
  it('has mixes that add up to 100%', () => {
    const sum = (r: Record<string, number>) => Object.values(r).reduce((a, b) => a + b, 0);
    expect(sum(PLAN_CATEGORY_MIX)).toBeCloseTo(1);
    expect(sum(PLAN_CHANNEL_MIX)).toBeCloseTo(1);
  });

  it('sets round monthly targets within a believable range of actual revenue', () => {
    const orders = generateOrders();
    const months = monthRange(getPeriods(DATA_END_MONTH, 12).current.start, DATA_END_MONTH);
    let plan = 0;
    let actual = 0;
    for (const m of months) {
      expect(monthlyPlan(m) % 500).toBe(0);
      plan += monthlyPlan(m);
    }
    for (const o of orders) if (o.date.slice(0, 7) >= months[0]! && countsAsRevenue(o)) actual += o.amount;
    expect(actual / plan).toBeGreaterThan(0.85);
    expect(actual / plan).toBeLessThan(1.15);
    expect(monthlyPlan('2025-12')).toBeGreaterThan(monthlyPlan('2026-02'));
  });
});
