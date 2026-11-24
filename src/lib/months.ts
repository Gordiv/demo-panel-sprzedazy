/** Helpers for calendar months (YYYY-MM) and days (YYYY-MM-DD), all time-zone free. */

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

const DAY_MS = 86_400_000;

function toTime(date: string): number {
  return Date.parse(`${date}T00:00:00Z`);
}

export function daysBetween(from: string, to: string): number {
  return Math.round((toTime(to) - toTime(from)) / DAY_MS);
}

export function addDays(date: string, delta: number): string {
  return new Date(toTime(date) + delta * DAY_MS).toISOString().slice(0, 10);
}

export function firstDayOf(month: string): string {
  return `${month}-01`;
}

export function lastDayOf(month: string): string {
  return addDays(firstDayOf(addMonths(month, 1)), -1);
}

/** Monday = 0 ... Sunday = 6 */
export function weekdayOf(date: string): number {
  return (new Date(toTime(date)).getUTCDay() + 6) % 7;
}
