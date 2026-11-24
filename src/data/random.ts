/** Small deterministic PRNG (mulberry32). Same seed, same sequence. */
export function createRandom(seed: number) {
  let state = seed >>> 0;

  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const int = (min: number, max: number): number => min + Math.floor(next() * (max - min + 1));

  const pick = <T,>(items: readonly T[]): T => {
    const item = items[Math.floor(next() * items.length)];
    if (item === undefined) throw new Error('pick() called with an empty list');
    return item;
  };

  const weighted = <T,>(items: readonly T[], weights: readonly number[]): T => {
    const total = weights.reduce((sum, w) => sum + w, 0);
    let roll = next() * total;
    for (let i = 0; i < items.length; i++) {
      roll -= weights[i] ?? 0;
      const item = items[i];
      if (roll < 0 && item !== undefined) return item;
    }
    const last = items[items.length - 1];
    if (last === undefined) throw new Error('weighted() called with an empty list');
    return last;
  };

  /** Standard normal sample (Box-Muller). */
  const normal = (): number => {
    const u = Math.max(next(), 1e-12);
    const v = next();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };

  return { next, int, pick, weighted, normal };
}

export type Random = ReturnType<typeof createRandom>;
