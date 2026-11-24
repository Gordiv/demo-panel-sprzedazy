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
  formatBucketLabel,
  formatBucketTick,
  formatDayRange,
  formatHourBlock,
  formatPercentMagnitude,
  formatPointsMagnitude,
  formatRelativeDay,
  formatWholePercent,
  pluralPl,
} from './format';

describe('bucket, hour and relative labels', () => {
  const p = (s: string) => s.replace(/[  ]/g, ' ');
  it('formats day ranges inside and across months', () => {
    expect(p(formatDayRange('2026-08-03', '2026-08-09'))).toBe('3–9 sie 2026');
    expect(p(formatDayRange('2026-09-28', '2026-10-04'))).toBe('28 wrz – 4 paź 2026');
    expect(p(formatDayRange('2026-10-31', '2026-10-31'))).toBe('31 paź 2026');
  });

  it('labels buckets by granularity', () => {
    expect(formatBucketTick('2026-03-01', 'month')).toBe('mar');
    expect(p(formatBucketTick('2026-08-08', 'week'))).toBe('8 sie');
    expect(formatBucketLabel('2026-03-01', '2026-03-31', 'month')).toBe('marzec 2026');
  });

  it('formats hour blocks', () => {
    expect(formatHourBlock(0, 2)).toBe('00:00–02:00');
    expect(formatHourBlock(9, 2)).toBe('18:00–20:00');
    expect(formatHourBlock(11, 2)).toBe('22:00–24:00');
  });

  it('describes days relative to the data end date', () => {
    expect(formatRelativeDay('2026-10-31', '2026-10-31')).toBe('dziś');
    expect(formatRelativeDay('2026-10-30', '2026-10-31')).toBe('wczoraj');
    expect(formatRelativeDay('2026-10-27', '2026-10-31')).toBe('4 dni temu');
    expect(formatRelativeDay('2026-10-01', '2026-10-31')).toBe('01.10.2026');
  });

  it('formats animated counter values', () => {
    expect(p(formatPercentMagnitude(-0.125))).toBe('12,5%');
    expect(formatPointsMagnitude(-1.25)).toBe('1,3 pp.');
    expect(formatWholePercent(0.964)).toBe('96%');
    expect(formatWholePercent(null)).toBe('—');
  });
});

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
