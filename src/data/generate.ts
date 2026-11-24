import { daysBetween, weekdayOf } from '../lib/months';
import { HOUR_WEIGHTS, PRODUCTS, WEEKDAY_WEIGHTS, type Product } from './catalog';
import { FIRST_NAMES_FEMALE, FIRST_NAMES_MALE, SURNAMES } from './names';
import { createRandom, type Random } from './random';
import { CATEGORIES, CHANNELS, type Category, type Channel, type Order, type OrderStatus } from './types';

/** Last day covered by the sample data. Fixed so the demo looks the same for everyone. */
export const DATA_END_DATE = '2026-10-31';
/** Last full month in the data set (YYYY-MM). */
export const DATA_END_MONTH = DATA_END_DATE.slice(0, 7);
/** Months of history: 12 for the longest period plus 12 for its comparison period. */
export const HISTORY_MONTHS = 24;

const DEFAULT_SEED = 20261031;
/** Typical basket value in PLN, used for the monthly revenue trend. */
export const AVERAGE_BASKET = 400;
/** Orders in an average month at the start of the history. */
const BASE_ORDERS = 34;
const CUSTOMER_POOL = 180;

/** Sales seasonality by calendar month (Jan..Dec): slow winter, busy Q4. */
export const SEASONALITY = [0.74, 0.7, 0.86, 0.92, 0.98, 0.95, 0.9, 0.93, 1.0, 1.08, 1.36, 1.52];

/** Extra demand for a category in some calendar months (0-based). */
const CATEGORY_WEIGHTS: Record<Category, { weight: number; peaks?: Readonly<Record<number, number>> }> = {
  Elektronika: { weight: 0.19, peaks: { 10: 1.5, 11: 1.6 } },
  'Dom i ogród': { weight: 0.22, peaks: { 3: 1.5, 4: 1.6, 5: 1.4 } },
  Moda: { weight: 0.25, peaks: { 8: 1.2, 11: 1.3 } },
  'Sport i rekreacja': { weight: 0.16, peaks: { 4: 1.4, 5: 1.5, 6: 1.4 } },
  'Zdrowie i uroda': { weight: 0.18, peaks: { 11: 1.5 } },
};

/** Growth factor for a month index counted from the start of the history (0..HISTORY_MONTHS-1). */
export function growthAt(index: number): number {
  return 0.78 + (0.32 * index) / (HISTORY_MONTHS - 1);
}

/** Channel mix shifts slowly towards online sales over the two years. */
function channelWeights(progress: number): number[] {
  return [0.46 + 0.08 * progress, 0.3 + 0.03 * progress, 0.24 - 0.11 * progress];
}

const pad = (n: number, width = 2) => String(n).padStart(width, '0');

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}


/** A fixed pool of customers; a few loyal ones buy often, most only once or twice. */
function customerPool(rnd: Random): { names: string[]; weights: number[] } {
  const names: string[] = [];
  const seen = new Set<string>();
  while (names.length < CUSTOMER_POOL) {
    const female = rnd.next() < 0.52;
    const first = female ? rnd.pick(FIRST_NAMES_FEMALE) : rnd.pick(FIRST_NAMES_MALE);
    const [male, fem] = rnd.pick(SURNAMES);
    const name = `${first} ${female ? fem : male}`;
    if (!seen.has(name)) {
      seen.add(name);
      names.push(name);
    }
  }
  const weights = names.map((_, i) => 1 / Math.pow(i + 8, 0.6));
  return { names, weights };
}

function pickProduct(rnd: Random, category: Category): Product {
  const list = PRODUCTS[category];
  // Cheaper items sell more often.
  return rnd.weighted(list, list.map((p) => Math.sqrt(1000 / p.price)));
}

function priceLike(rnd: Random, value: number): number {
  // Most shop prices end in ,99 or ,00, so keep it believable.
  const whole = Math.max(19, Math.floor(value));
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

function pickDate(rnd: Random, year: number, month: number, channel: Channel): string {
  const lastDay = daysInMonth(year, month);
  const weights = WEEKDAY_WEIGHTS[channel];
  const max = Math.max(...weights);
  // Rejection sampling keeps the weekday pattern without biasing the month.
  for (;;) {
    const date = `${year}-${pad(month)}-${pad(rnd.int(1, lastDay))}`;
    if (rnd.next() * max <= (weights[weekdayOf(date)] ?? 1)) return date;
  }
}

function pickTime(rnd: Random, channel: Channel): string {
  const hours = HOUR_WEIGHTS[channel];
  const hour = rnd.weighted(
    hours.map((_, h) => h),
    hours,
  );
  return `${pad(hour)}:${pad(rnd.int(0, 59))}`;
}

interface Draft extends Omit<Order, 'id' | 'amount' | 'status'> {
  raw: number;
}

/**
 * Builds the deterministic sample data set: about 400 orders in the last
 * 12 months plus a smaller previous year used for period comparison.
 */
export function generateOrders(seed = DEFAULT_SEED): Order[] {
  const rnd = createRandom(seed);
  const customers = customerPool(rnd);
  const [endYear, endMonth] = DATA_END_MONTH.split('-').map(Number) as [number, number];
  const all: Omit<Order, 'id'>[] = [];

  for (let i = HISTORY_MONTHS - 1; i >= 0; i--) {
    const index = HISTORY_MONTHS - 1 - i;
    const monthIndex = endYear * 12 + (endMonth - 1) - i;
    const year = Math.floor(monthIndex / 12);
    const month = (monthIndex % 12) + 1;
    const season = SEASONALITY[month - 1] ?? 1;
    const count = Math.max(8, Math.round(BASE_ORDERS * growthAt(index) * season * (1 + 0.05 * rnd.normal())));
    // Each month is nudged towards a smooth trend so a few large baskets
    // do not hide the seasonal shape; some natural noise is kept.
    const targetRevenue = count * AVERAGE_BASKET * (1 + 0.05 * rnd.normal());

    const categoryWeights = CATEGORIES.map((c) => {
      const p = CATEGORY_WEIGHTS[c];
      return p.weight * (p.peaks?.[month - 1] ?? 1);
    });
    const chWeights = channelWeights(index / (HISTORY_MONTHS - 1));

    const drafts: Draft[] = [];
    for (let k = 0; k < count; k++) {
      const category = rnd.weighted<Category>(CATEGORIES, categoryWeights);
      const channel = rnd.weighted<Channel>(CHANNELS, chWeights);
      const product = pickProduct(rnd, category);
      const quantity = rnd.weighted([1, 2, 3], [0.8, 0.15, 0.05]);
      drafts.push({
        date: pickDate(rnd, year, month, channel),
        time: pickTime(rnd, channel),
        client: rnd.weighted(customers.names, customers.weights),
        product: product.name,
        category,
        channel,
        raw: product.price * quantity * Math.exp(0.12 * rnd.normal()),
      });
    }
    const rawTotal = drafts.reduce((sum, d) => sum + d.raw, 0);
    const scale = Math.pow(targetRevenue / rawTotal, 0.85);

    for (const { raw, ...rest } of drafts) {
      all.push({
        ...rest,
        amount: priceLike(rnd, raw * scale),
        status: orderStatus(rnd, daysBetween(rest.date, DATA_END_DATE)),
      });
    }
  }

  all.sort((a, b) => {
    const ka = `${a.date} ${a.time}`;
    const kb = `${b.date} ${b.time}`;
    return ka < kb ? -1 : ka > kb ? 1 : 0;
  });

  // Order numbers restart every calendar year, like in most shop systems.
  const counters = new Map<string, number>();
  return all.map((order) => {
    const year = order.date.slice(0, 4);
    const next = (counters.get(year) ?? 0) + 1;
    counters.set(year, next);
    return { id: `ZAM-${year}-${pad(next, 5)}`, ...order };
  });
}
