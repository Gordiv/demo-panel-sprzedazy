/** Small SVG geometry helpers for hand-drawn widgets. */

export interface SparkPoint {
  x: number;
  y: number;
}

/**
 * Maps values to points inside a width x height box (y grows downwards).
 * Missing values are skipped; a flat series sits in the middle.
 */
export function sparklinePoints(
  values: ReadonlyArray<number | null>,
  width: number,
  height: number,
  padding = 2,
): SparkPoint[] {
  const present = values.filter((v): v is number => v !== null && Number.isFinite(v));
  if (present.length === 0) return [];
  const min = Math.min(...present);
  const max = Math.max(...present);
  const range = max - min;
  const step = values.length > 1 ? (width - padding * 2) / (values.length - 1) : 0;
  const points: SparkPoint[] = [];
  values.forEach((v, i) => {
    if (v === null || !Number.isFinite(v)) return;
    const y = range === 0 ? height / 2 : padding + (1 - (v - min) / range) * (height - padding * 2);
    points.push({ x: values.length > 1 ? padding + i * step : width / 2, y });
  });
  return points;
}

const r2 = (n: number) => Math.round(n * 100) / 100;

/** Polyline path ("M x y L x y ..."). */
export function linePath(points: readonly SparkPoint[]): string {
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'}${r2(p.x)} ${r2(p.y)}`).join(' ');
}

/** Closed path under the line, down to the bottom edge, for a soft fill. */
export function areaPath(points: readonly SparkPoint[], height: number): string {
  const first = points[0];
  const last = points[points.length - 1];
  if (!first || !last) return '';
  return `${linePath(points)} L${r2(last.x)} ${height} L${r2(first.x)} ${height} Z`;
}

export interface Arc {
  /** Offset from the top of the ring, 0..1 of the circumference */
  start: number;
  /** Visible length, 0..1 of the circumference */
  length: number;
}

/**
 * Splits a ring into arcs proportional to the values, leaving `gap`
 * (fraction of the circumference) between neighbouring arcs.
 */
export function donutArcs(values: readonly number[], gap = 0.01): Arc[] {
  const total = values.reduce((s, v) => s + Math.max(0, v), 0);
  const visible = values.filter((v) => v > 0).length;
  const usedGap = visible > 1 ? gap : 0;
  let cursor = 0;
  return values.map((v) => {
    const share = total > 0 ? Math.max(0, v) / total : 0;
    const arc = { start: cursor + (share > 0 ? usedGap / 2 : 0), length: share > 0 ? Math.max(0, share - usedGap) : 0 };
    cursor += share;
    return arc;
  });
}
