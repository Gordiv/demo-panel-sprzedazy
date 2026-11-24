export const CATEGORIES = [
  'Elektronika',
  'Dom i ogród',
  'Moda',
  'Sport i rekreacja',
  'Zdrowie i uroda',
] as const;

export const CHANNELS = ['Sklep online', 'Marketplace', 'Sklep stacjonarny'] as const;

export const STATUSES = ['Zrealizowane', 'W realizacji', 'Zwrócone', 'Anulowane'] as const;

export type Category = (typeof CATEGORIES)[number];
export type Channel = (typeof CHANNELS)[number];
export type OrderStatus = (typeof STATUSES)[number];

export interface Order {
  /** Order number, e.g. ZAM-2026-00123 */
  id: string;
  /** Calendar date as YYYY-MM-DD (no time zone involved) */
  date: string;
  /** Local time as HH:MM */
  time: string;
  client: string;
  /** Main product in the basket */
  product: string;
  category: Category;
  channel: Channel;
  /** Order value in PLN, rounded to grosze */
  amount: number;
  status: OrderStatus;
}
