import { memo, type CSSProperties } from 'react';
import { motion } from 'motion/react';
import { Presence } from './Presence';
import type { Ranked } from '../lib/insights';
import { formatCurrency, formatOrderCount, formatPercent } from '../lib/format';
import { useMotionEnabled } from '../lib/motion';
import { Icon, type IconName } from './Icon';
import { Tile, TileHeader } from './Tile';

interface LeaderboardProps {
  id: string;
  title: string;
  subtitle: string;
  icon: IconName;
  items: Ranked[];
  /** Revenue of the whole segment, for the share of the top five */
  total: number;
  className?: string;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0] ?? '')
    .join('')
    .toUpperCase();
}

function LeaderboardView({ id, title, subtitle, icon, items, total, className }: LeaderboardProps) {
  const animate = useMotionEnabled();
  return (
    <Tile className={className} labelledBy={id}>
      <TileHeader id={id} title={title} icon={<Icon name={icon} size={17} />} subtitle={subtitle} />
      {items.length === 0 ? (
        <p className="chart-empty">Brak danych dla wybranych filtrów.</p>
      ) : (
        <ol className="leaders">
          <Presence enabled={animate}>
            {items.map((item, i) => (
              <motion.li
                key={item.key}
                layout={animate ? 'position' : false}
                className="leaders__row"
                initial={animate ? { opacity: 0, x: -10 } : false}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10, transition: { duration: 0.15 } }}
                transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
              >
                <span className={`leaders__avatar leaders__avatar--${i}`} aria-hidden="true">
                  {icon === 'users' ? initials(item.key) : String(i + 1)}
                </span>
                <div className="leaders__main">
                  <div className="leaders__labels">
                    <span className="leaders__name">
                      <span className="sr-only">{i + 1}. </span>
                      {item.key}
                    </span>
                    <span className="leaders__value num">{formatCurrency(item.revenue)}</span>
                  </div>
                  <div className="leaders__track" aria-hidden="true">
                    <div
                      className="leaders__fill grow-x"
                      style={{ '--v': item.relative, '--d': `${100 + i * 50}ms` } as CSSProperties}
                    />
                  </div>
                  <span className="leaders__detail">
                    {formatOrderCount(item.orders)}
                    {item.detail ? ` · ${item.detail}` : ''}
                  </span>
                </div>
              </motion.li>
            ))}
          </Presence>
        </ol>
      )}
      {items.length > 0 && total > 0 ? (
        <p className="leaders__summary">
          <span className="leaders__summary-value num">
            {formatPercent(items.reduce((s, i) => s + i.revenue, 0) / total)}
          </span>{' '}
          przychodu w okresie przypada na tę piątkę
        </p>
      ) : null}
    </Tile>
  );
}

/** Re-renders only when its own data changes (filters, theme), not on unrelated app updates. */
export const Leaderboard = memo(LeaderboardView);
