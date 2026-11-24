import { describe, expect, it } from 'vitest';
import {
  formatCurrency,
  formatCurrencyCompact,
  formatCurrencyWhole,
  formatDate,
  formatDelta,
  formatInteger,
  formatMonthLong,
  formatMonthShort,
  formatOrderCount,
  formatPercent,
  pluralPl,
} from './format';

// Intl uses (narrow) no-break spaces in pl-PL; compare with plain spaces.
const plain = (s: string) => s.replace(/[  ]/g, ' ');

describe('numbers and money', () => {
  it('formats złoty the Polish way', () => {
    expect(plain(formatCurrency(12345.5))).toBe('12 345,50 zł');
    expect(plain(formatCurrency(0))).toBe('0,00 zł');
    expect(plain(formatCurrencyWhole(1234567.89))).toBe('1 234 568 zł');
  });

  it('shows a dash for missing values', () => {
    expect(formatCurrency(null)).toBe('—');
    expect(formatPercent(null)).toBe('—');
    expect(formatInteger(null)).toBe('—');
  });

  it('formats compact axis labels', () => {
    expect(plain(formatCurrencyCompact(950))).toBe('950 zł');
    expect(plain(formatCurrencyCompact(12400))).toBe('12,4 tys. zł');
    expect(plain(formatCurrencyCompact(2_500_000))).toBe('2,5 mln zł');
    expect(plain(formatCurrencyCompact(30_000))).toBe('30 tys. zł');
  });

  it('formats percentages with one decimal', () => {
    expect(plain(formatPercent(0.0734))).toBe('7,3%');
    expect(plain(formatPercent(1))).toBe('100,0%');
  });
});

describe('dates', () => {
  it('formats days and months in Polish without time zone shifts', () => {
    expect(formatDate('2026-01-01')).toBe('01.01.2026');
    expect(formatDate('2025-12-31')).toBe('31.12.2025');
    expect(formatMonthLong('2026-03')).toBe('marzec 2026');
    expect(formatMonthShort('2025-11')).toMatch(/^lis/);
  });
});

describe('Polish plurals', () => {
  it('picks one / few / many', () => {
    const forms = (n: number) => pluralPl(n, 'zamówienie', 'zamówienia', 'zamówień');
    expect(forms(1)).toBe('zamówienie');
    expect(forms(2)).toBe('zamówienia');
    expect(forms(4)).toBe('zamówienia');
    expect(forms(5)).toBe('zamówień');
    expect(forms(12)).toBe('zamówień');
    expect(forms(22)).toBe('zamówienia');
    expect(forms(0)).toBe('zamówień');
    // Polish style does not group four-digit numbers.
    expect(plain(formatOrderCount(1143))).toBe('1143 zamówienia');
    expect(plain(formatOrderCount(12_345))).toBe('12 345 zamówień');
  });
});

describe('formatDelta', () => {
  it('builds arrow, short text and a spoken label', () => {
    const up = formatDelta({ value: 0.124, unit: 'percent', trend: 'up', favourable: true });
    expect(up?.symbol).toBe('▲');
    expect(plain(up?.text ?? '')).toBe('12,4%');
    expect(plain(up?.label ?? '')).toBe('wzrost o 12,4% względem poprzedniego okresu');

    const down = formatDelta({ value: -0.8, unit: 'points', trend: 'down', favourable: true });
    expect(down?.symbol).toBe('▼');
    expect(plain(down?.text ?? '')).toBe('0,8 pp.');
  });

  it('handles flat and missing changes', () => {
    expect(formatDelta({ value: 0, unit: 'percent', trend: 'flat', favourable: null })?.text).toBe('bez zmian');
    expect(formatDelta(null)).toBeNull();
  });
});
