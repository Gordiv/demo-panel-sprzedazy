import { memo } from 'react';
import { motion } from 'motion/react';
import { Presence } from './Presence';
import type { Order } from '../data/types';
import { formatCurrency, formatRelativeDay } from '../lib/format';
import { useMotionEnabled } from '../lib/motion';
import { Icon } from './Icon';
import { STATUS_META } from './StatusIcon';
import { Tile, TileHeader } from './Tile';

interface ActivityFeedProps {
  orders: Order[];
  today: string;
  className?: string;
}

function ActivityFeedView({ orders, today, className }: ActivityFeedProps) {
  const animate = useMotionEnabled();
  return (
    <Tile className={className} labelledBy="activity-title">
      <TileHeader
        id="activity-title"
        title="Ostatnia aktywność"
        icon={<Icon name="activity" size={17} />}
        subtitle="Najnowsze zamówienia w wybranym segmencie"
      />
      {orders.length === 0 ? (
        <p className="chart-empty">Brak zamówień dla wybranych filtrów.</p>
      ) : (
        <ol className="timeline">
          <Presence enabled={animate}>
            {orders.map((o) => {
              const meta = STATUS_META[o.status];
              return (
                <motion.li
                  key={o.id}
                  layout={animate ? 'position' : false}
                  className="timeline__item"
                  initial={animate ? { opacity: 0, y: -8 } : false}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, transition: { duration: 0.15 } }}
                  transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                >
                  <span className={`timeline__node pill--${meta.tone}`} aria-hidden="true">
                    <Icon name={meta.icon} size={15} />
                  </span>
                  <div className="timeline__body">
                    <p className="timeline__line">
                      <span className="timeline__client">{o.client}</span>
                      <span className="timeline__amount num">{formatCurrency(o.amount)}</span>
                    </p>
                    <p className="timeline__meta">
                      {o.product} <span aria-hidden="true">·</span> {o.status}
                    </p>
                    <p className="timeline__time">
                      {formatRelativeDay(o.date, today)}, {o.time} · {o.channel} · <span className="mono">{o.id}</span>
                    </p>
                  </div>
                </motion.li>
              );
            })}
          </Presence>
        </ol>
      )}
    </Tile>
  );
}

/** Re-renders only when its own data changes (filters, theme), not on unrelated app updates. */
export const ActivityFeed = memo(ActivityFeedView);
