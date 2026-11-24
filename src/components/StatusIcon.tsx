import type { OrderStatus } from '../data/types';
import { Icon, type IconName } from './Icon';

export const STATUS_META: Record<OrderStatus, { icon: IconName; tone: string }> = {
  Zrealizowane: { icon: 'check', tone: 'done' },
  'W realizacji': { icon: 'clock', tone: 'progress' },
  Zwrócone: { icon: 'returned', tone: 'returned' },
  Anulowane: { icon: 'cancelled', tone: 'cancelled' },
};

/** Status pill: icon + text, so meaning never depends on colour. */
export function StatusPill({ status }: { status: OrderStatus }) {
  const meta = STATUS_META[status];
  return (
    <span className={`pill pill--${meta.tone}`}>
      <Icon name={meta.icon} size={13} />
      {status}
    </span>
  );
}
