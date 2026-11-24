import { describe, expect, it } from 'vitest';
import { getPeriods } from '../lib/aggregate';
import { DATA_END_DATE, DATA_END_MONTH, generateOrders } from './generate';
import { CATEGORIES, CHANNELS, STATUSES } from './types';

describe('generateOrders', () => {
  const orders = generateOrders();

  it('is deterministic for the same seed', () => {
    expect(generateOrders()).toEqual(orders);
    expect(generateOrders(1)).not.toEqual(orders);
  });

  it('has about 400 orders in the last 12 months', () => {
    const { current } = getPeriods(DATA_END_MONTH, 12);
    const recent = orders.filter((o) => o.date.slice(0, 7) >= current.start);
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
      expect(CATEGORIES).toContain(o.category);
      expect(CHANNELS).toContain(o.channel);
      expect(STATUSES).toContain(o.status);
      expect(o.amount).toBeGreaterThan(0);
      expect(Math.round(o.amount * 100) / 100).toBe(o.amount);
      expect(o.client).toMatch(/^\S+ \S+$/);
    }
  });

  it('only has orders in progress close to the end date', () => {
    const inProgress = orders.filter((o) => o.status === 'W realizacji');
    expect(inProgress.length).toBeGreaterThan(0);
    expect(inProgress.every((o) => o.date >= '2026-10-15')).toBe(true);
  });
});
