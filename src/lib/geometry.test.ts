import { describe, expect, it } from 'vitest';
import { areaPath, donutArcs, linePath, sparklinePoints } from './geometry';

describe('sparklinePoints', () => {
  it('spreads points across the width and maps min/max to the edges', () => {
    const pts = sparklinePoints([0, 5, 10], 100, 40, 0);
    expect(pts).toEqual([
      { x: 0, y: 40 },
      { x: 50, y: 20 },
      { x: 100, y: 0 },
    ]);
  });

  it('respects padding and skips missing values', () => {
    const pts = sparklinePoints([1, null, 3], 100, 40, 2);
    expect(pts.map((p) => p.x)).toEqual([2, 98]);
    expect(pts[0]?.y).toBe(38);
    expect(pts[1]?.y).toBe(2);
  });

  it('centres a flat or single-value series', () => {
    expect(sparklinePoints([4, 4], 100, 40).map((p) => p.y)).toEqual([20, 20]);
    expect(sparklinePoints([7], 100, 40)).toEqual([{ x: 50, y: 20 }]);
    expect(sparklinePoints([null, null], 100, 40)).toEqual([]);
  });
});

describe('paths', () => {
  it('builds line and closed area paths', () => {
    const pts = [
      { x: 0, y: 10 },
      { x: 50.123, y: 5 },
    ];
    expect(linePath(pts)).toBe('M0 10 L50.12 5');
    expect(areaPath(pts, 40)).toBe('M0 10 L50.12 5 L50.12 40 L0 40 Z');
    expect(areaPath([], 40)).toBe('');
  });
});

describe('donutArcs', () => {
  it('splits the ring proportionally with gaps between arcs', () => {
    const arcs = donutArcs([50, 30, 20], 0.01);
    expect(arcs[0]?.start).toBeCloseTo(0.005);
    expect(arcs[0]?.length).toBeCloseTo(0.49);
    expect(arcs[1]?.start).toBeCloseTo(0.505);
    expect(arcs[2]?.length).toBeCloseTo(0.19);
  });

  it('uses no gap for a single arc and zero length for empty slices', () => {
    const arcs = donutArcs([0, 80, 0], 0.01);
    expect(arcs[1]).toEqual({ start: 0, length: 1 });
    expect(arcs[0]?.length).toBe(0);
    expect(arcs[2]?.length).toBe(0);
  });

  it('handles an all-zero input', () => {
    expect(donutArcs([0, 0]).every((a) => a.length === 0)).toBe(true);
  });
});
