import { describe, expect, it } from 'vitest';
import { niceTicks } from './scale';

describe('niceTicks', () => {
  it('uses round steps that cover the maximum', () => {
    expect(niceTicks(20_072)).toEqual([0, 5000, 10_000, 15_000, 20_000, 25_000]);
    expect(niceTicks(2_700)).toEqual([0, 1000, 2000, 3000]);
    expect(niceTicks(54_200)).toEqual([0, 20_000, 40_000, 60_000]);
    expect(niceTicks(100)).toEqual([0, 20, 40, 60, 80, 100]);
    expect(niceTicks(0.5)).toEqual([0, 0.1, 0.2, 0.3, 0.4, 0.5]);
  });

  it('falls back to a unit axis when there is nothing to show', () => {
    expect(niceTicks(0)).toEqual([0, 1]);
    expect(niceTicks(Number.NaN)).toEqual([0, 1]);
  });
});
