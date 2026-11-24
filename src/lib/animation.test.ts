import { describe, expect, it } from 'vitest';
import { clamp01, countUpValue, easeOutCubic, easeOutExpo, interpolate } from './animation';

describe('easing', () => {
  it('starts at 0, ends at 1 and clamps outside the range', () => {
    for (const ease of [easeOutCubic, easeOutExpo]) {
      expect(ease(0)).toBe(0);
      expect(ease(1)).toBe(1);
      expect(ease(-1)).toBe(0);
      expect(ease(2)).toBe(1);
    }
    expect(clamp01(0.4)).toBe(0.4);
  });

  it('is monotonic and decelerates (ease-out)', () => {
    let prev = -1;
    for (let t = 0; t <= 1; t += 0.1) {
      const v = easeOutCubic(t);
      expect(v).toBeGreaterThanOrEqual(prev);
      prev = v;
    }
    expect(easeOutCubic(0.5)).toBeCloseTo(0.875);
  });
});

describe('countUpValue', () => {
  it('moves from the old value to the new one', () => {
    expect(countUpValue(100, 200, 0, 1000)).toBe(100);
    expect(countUpValue(100, 200, 500, 1000)).toBeCloseTo(187.5);
    expect(countUpValue(100, 200, 1000, 1000)).toBe(200);
    expect(countUpValue(100, 200, 5000, 1000)).toBe(200);
  });

  it('counts down as well and accepts a custom easing', () => {
    expect(countUpValue(200, 100, 500, 1000, (t) => t)).toBe(150);
  });

  it('jumps to the target with no duration', () => {
    expect(countUpValue(0, 42, 0, 0)).toBe(42);
  });

  it('interpolates linearly', () => {
    expect(interpolate(10, 20, 0.25)).toBe(12.5);
  });
});
