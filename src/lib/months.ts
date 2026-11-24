/** Helpers for calendar months written as YYYY-MM strings (time-zone free). */

export function monthOf(date: string): string {
  return date.slice(0, 7);
}

export function addMonths(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number) as [number, number];
  const index = y * 12 + (m - 1) + delta;
  const year = Math.floor(index / 12);
  const mon = index - year * 12 + 1;
  return `${year}-${String(mon).padStart(2, '0')}`;
}

/** Inclusive list of months from start to end. */
export function monthRange(start: string, end: string): string[] {
  const out: string[] = [];
  for (let m = start; m <= end; m = addMonths(m, 1)) out.push(m);
  return out;
}
