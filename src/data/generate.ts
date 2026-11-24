import { createRandom, type Random } from './random';
import { FIRST_NAMES_FEMALE, FIRST_NAMES_MALE, SURNAMES } from './names';
import { CATEGORIES, CHANNELS, type Category, type Channel, type Order, type OrderStatus } from './types';

/** Last day covered by the sample data. Fixed so the demo looks the same for everyone. */
export const DATA_END_DATE = '2026-10-31';
/** Last full month in the data set (YYYY-MM). */
export const DATA_END_MONTH = DATA_END_DATE.slice(0, 7);
/** Months of history: 12 for the longest period plus 12 for its comparison period. */
export const HISTORY_MONTHS = 24;

const DEFAULT_SEED = 20261031;
/** Typical basket value in PLN, used for the monthly revenue trend. */
const AVERAGE_BASKET = 440;

/** Sales seasonality by calendar month (Jan..Dec): slow winter, busy Q4. */
const SEASONALITY = [0.74, 0.7, 0.86, 0.92, 0.98, 0.95, 0.9, 0.93, 1.0, 1.08, 1.36, 1.52];

interface CategoryProfile {
  weight: number;
  /** Median basket value in PLN */
  median: number;
  /** Spread of the log-normal distribution */
  sigma: number;
  min: number;
  max: number;
  /** Extra weight in some calendar months (0-based) */
  peaks?: Readonly<Record<number, number>>;
}

const CATEGORY_PROFILES: Record<Category, CategoryProfile> = {
  Elektronika: { weight: 0.2, median: 780, sigma: 0.55, min: 79, max: 6999, peaks: { 10: 1.5, 11: 1.6 } },
  'Dom i ogród': { weight: 0.22, median: 290, sigma: 0.55, min: 39, max: 2899, peaks: { 3: 1.5, 4: 1.6, 5: 1.4 } },
  Moda: { weight: 0.25, median: 185, sigma: 0.45, min: 29, max: 1299, peaks: { 8: 1.2, 11: 1.3 } },
  'Sport i rekreacja': { weight: 0.16, median: 340, sigma: 0.55, min: 35, max: 3499, peaks: { 4: 1.4, 5: 1.5, 6: 1.4 } },
  'Zdrowie i uroda': { weight: 0.17, median: 120, sigma: 0.4, min: 19, max: 899, peaks: { 11: 1.5 } },
};

/** Channel mix shifts slowly towards online sales over the two years. */
function channelWeights(progress: number): number[] {
  return [0.46 + 0.08 * progress, 0.3 + 0.03 * progress, 0.24 - 0.11 * progress];
}

const pad = (n: number, width = 2) => String(n).padStart(width, '0');

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function dayDiff(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86400000);
}

function clientName(rnd: Random): string {
  const female = rnd.next() < 0.52;
  const first = female ? rnd.pick(FIRST_NAMES_FEMALE) : rnd.pick(FIRST_NAMES_MALE);
  const [male, fem] = rnd.pick(SURNAMES);
  return `${first} ${female ? fem : male}`;
}

function rawAmount(rnd: Random, profile: CategoryProfile): number {
  return profile.median * Math.exp(profile.sigma * rnd.normal());
}

function priceLike(rnd: Random, value: number, profile: CategoryProfile): number {
  const clamped = Math.min(profile.max, Math.max(profile.min, value));
  // Most shop prices end in ,99 or ,00, so keep it believable.
  const whole = Math.floor(clamped);
  const cents = rnd.next() < 0.7 ? 0.99 : rnd.next() < 0.5 ? 0 : rnd.int(0, 99) / 100;
  return Math.round((whole + cents) * 100) / 100;
}

function orderStatus(rnd: Random, ageDays: number): OrderStatus {
  if (ageDays <= 3) return rnd.next() < 0.92 ? 'W realizacji' : 'Anulowane';
  if (ageDays <= 10) {
    return rnd.weighted<OrderStatus>(
      ['W realizacji', 'Zrealizowane', 'Anulowane', 'Zwrócone'],
      [0.45, 0.47, 0.05, 0.03],
    );
  }
  return rnd.weighted<OrderStatus>(['Zrealizowane', 'Zwrócone', 'Anulowane'], [0.875, 0.075, 0.05]);
}

interface MonthDraft {
  date: string;
  category: Category;
  channel: Channel;
  raw: number;
}

/**
 * Builds the deterministic sample data set: about 400 orders in the last
 * 12 months plus a smaller previous year used for period comparison.
 */
export function generateOrders(seed = DEFAULT_SEED): Order[] {
  const rnd = createRandom(seed);
  const [endYear, endMonth] = DATA_END_MONTH.split('-').map(Number) as [number, number];
  const drafts: Omit<Order, 'id'>[] = [];

  for (let i = HISTORY_MONTHS - 1; i >= 0; i--) {
    const monthIndex = endYear * 12 + (endMonth - 1) - i;
    const year = Math.floor(monthIndex / 12);
    const month = (monthIndex % 12) + 1;
    const progress = (HISTORY_MONTHS - 1 - i) / (HISTORY_MONTHS - 1);
    const growth = 0.78 + 0.32 * progress;
    const season = SEASONALITY[month - 1] ?? 1;
    const count = Math.max(8, Math.round(34 * growth * season * (1 + 0.05 * rnd.normal())));
    // Each month is nudged towards a smooth trend so a few large baskets
    // do not hide the seasonal shape; some natural noise is kept.
    const targetRevenue = count * AVERAGE_BASKET * (1 + 0.05 * rnd.normal());

    const categoryWeights = CATEGORIES.map((c) => {
      const p = CATEGORY_PROFILES[c];
      return p.weight * (p.peaks?.[month - 1] ?? 1);
    });
    const chWeights = channelWeights(progress);
    const lastDay = daysInMonth(year, month);

    const monthDrafts: MonthDraft[] = [];
    for (let k = 0; k < count; k++) {
      const category = rnd.weighted<Category>(CATEGORIES, categoryWeights);
      monthDrafts.push({
        date: `${year}-${pad(month)}-${pad(rnd.int(1, lastDay))}`,
        category,
        channel: rnd.weighted<Channel>(CHANNELS, chWeights),
        raw: rawAmount(rnd, CATEGORY_PROFILES[category]),
      });
    }
    const rawTotal = monthDrafts.reduce((sum, d) => sum + d.raw, 0);
    const scale = Math.pow(targetRevenue / rawTotal, 0.85);

    for (const d of monthDrafts) {
      drafts.push({
        date: d.date,
        client: clientName(rnd),
        category: d.category,
        channel: d.channel,
        amount: priceLike(rnd, d.raw * scale, CATEGORY_PROFILES[d.category]),
        status: orderStatus(rnd, dayDiff(d.date, DATA_END_DATE)),
      });
    }
  }

  // Stable sort keeps the draw order inside a single day.
  drafts.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

  // Order numbers restart every calendar year, like in most shop systems.
  const counters = new Map<string, number>();
  return drafts.map((draft) => {
    const year = draft.date.slice(0, 4);
    const next = (counters.get(year) ?? 0) + 1;
    counters.set(year, next);
    return { id: `ZAM-${year}-${pad(next, 5)}`, ...draft };
  });
}
