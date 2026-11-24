/** Easing and interpolation used by the number counters. */

export function clamp01(t: number): number {
  return t < 0 ? 0 : t > 1 ? 1 : t;
}

export function easeOutCubic(t: number): number {
  const x = 1 - clamp01(t);
  return 1 - x * x * x;
}

export function easeOutExpo(t: number): number {
  const x = clamp01(t);
  return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
}

export function interpolate(from: number, to: number, progress: number): number {
  return from + (to - from) * progress;
}

/** Value of a counter `elapsed` ms after it started moving from `from` to `to`. */
export function countUpValue(
  from: number,
  to: number,
  elapsed: number,
  duration: number,
  ease: (t: number) => number = easeOutCubic,
): number {
  if (duration <= 0) return to;
  const t = clamp01(elapsed / duration);
  return t === 1 ? to : interpolate(from, to, ease(t));
}
