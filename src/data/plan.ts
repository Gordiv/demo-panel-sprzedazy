import type { Category, Channel } from './types';
import { AVERAGE_BASKET, DATA_END_MONTH, HISTORY_MONTHS, SEASONALITY, growthAt } from './generate';
import { addMonths } from '../lib/months';

/**
 * The sales plan (budget) the shop set for itself: a monthly revenue target
 * plus the planned split between categories and channels.
 */
export const PLAN_CATEGORY_MIX: Record<Category, number> = {
  Elektronika: 0.22,
  'Dom i ogród': 0.24,
  Moda: 0.19,
  'Sport i rekreacja': 0.22,
  'Zdrowie i uroda': 0.13,
};

export const PLAN_CHANNEL_MIX: Record<Channel, number> = {
  'Sklep online': 0.52,
  Marketplace: 0.32,
  'Sklep stacjonarny': 0.16,
};

const PLAN_BASE_ORDERS = 34;
/** Returned and cancelled orders are planned in, so the revenue target is lower than gross sales. */
const PLANNED_PAID_SHARE = 0.88;
const AMBITION = 1.04;

const historyStart = addMonths(DATA_END_MONTH, -(HISTORY_MONTHS - 1));

function monthIndex(month: string): number {
  const [y, m] = month.split('-').map(Number) as [number, number];
  const [sy, sm] = historyStart.split('-').map(Number) as [number, number];
  return y * 12 + m - (sy * 12 + sm);
}

/** Revenue target for the whole shop in a month (YYYY-MM), rounded to 500 PLN. */
export function monthlyPlan(month: string): number {
  const calendarMonth = Number(month.slice(5, 7));
  const raw =
    PLAN_BASE_ORDERS *
    growthAt(monthIndex(month)) *
    (SEASONALITY[calendarMonth - 1] ?? 1) *
    AVERAGE_BASKET *
    PLANNED_PAID_SHARE *
    AMBITION;
  return Math.round(raw / 500) * 500;
}
