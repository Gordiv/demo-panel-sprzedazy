/**
 * Round axis ticks from 0: the step is 1, 2, 2.5 or 5 times a power of ten,
 * so labels read "0, 5, 10, 15, 20 tys." instead of "0, 5,5, 11, 16,5".
 */
export function niceTicks(maxValue: number, intervals = 4): number[] {
  if (!Number.isFinite(maxValue) || maxValue <= 0) return [0, 1];
  const rough = maxValue / intervals;
  const power = Math.pow(10, Math.floor(Math.log10(rough)));
  const multiplier = [1, 2, 2.5, 5, 10, 20].find((m) => Math.ceil(maxValue / (m * power)) <= intervals + 1) ?? 20;
  const step = multiplier * power;
  const count = Math.ceil(maxValue / step);
  return Array.from({ length: count + 1 }, (_, i) => Math.round(i * step * 1e6) / 1e6);
}
