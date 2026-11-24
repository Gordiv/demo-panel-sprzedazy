import type { Order } from '../data/types';

let seq = 0;

/** Test helper: a valid order with sensible defaults. */
export function order(partial: Partial<Order>): Order {
  seq += 1;
  return {
    id: `ZAM-2026-${String(seq).padStart(5, '0')}`,
    date: '2026-10-15',
    time: '12:00',
    client: 'Anna Nowak',
    product: 'Sweter z merino',
    category: 'Moda',
    channel: 'Sklep online',
    amount: 100,
    status: 'Zrealizowane',
    ...partial,
  };
}
