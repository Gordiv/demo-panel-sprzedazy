import type { CSSProperties } from 'react';
import { motion } from 'motion/react';
import type { Category } from '../data/types';
import type { Share } from '../lib/aggregate';
import { formatCurrency, formatCurrencyCompact, formatOrderCount, formatPercent } from '../lib/format';
import { useMotionEnabled } from '../lib/motion';
import { ChartTable } from './ChartTable';
import { Icon } from './Icon';
import { Tile, TileHeader } from './Tile';

interface CategoryChartProps {
  data: Share<Category>[];
  className?: string;
}

/** Ranked horizontal bars; bars grow with a CSS transform, rows slide to their new rank. */
export function CategoryChart({ data, className }: CategoryChartProps) {
  const animate = useMotionEnabled();
  const sorted = [...data].sort((a, b) => b.revenue - a.revenue);
  const top = sorted[0]?.revenue ?? 0;
  const empty = top === 0;

  return (
    <Tile className={className} labelledBy="category-title">
      <TileHeader
        id="category-title"
        title="Przychód według kategorii"
        icon={<Icon name="layers" size={17} />}
        subtitle="Ranking udziału w przychodzie"
      />
      {empty ? (
        <p className="chart-empty">Brak przychodu dla wybranych filtrów.</p>
      ) : (
        <ol className="ranked">
          {sorted.map((d, i) => (
            <motion.li
              key={d.key}
              layout={animate ? 'position' : false}
              className="ranked__row"
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <span className="ranked__rank num" aria-hidden="true">
                {String(i + 1).padStart(2, '0')}
              </span>
              <div className="ranked__main">
                <div className="ranked__labels">
                  <span className="ranked__name">{d.key}</span>
                  <span className="ranked__value num">
                    {formatCurrencyCompact(d.revenue)}
                    <span className="ranked__share"> · {formatPercent(d.share)}</span>
                  </span>
                </div>
                <div className="ranked__track" aria-hidden="true">
                  <div
                    className="ranked__fill grow-x"
                    style={{ '--v': top > 0 ? d.revenue / top : 0, '--d': `${i * 60}ms` } as CSSProperties}
                  />
                </div>
                <span className="ranked__detail">{formatOrderCount(d.orders)}</span>
              </div>
            </motion.li>
          ))}
        </ol>
      )}
      <ChartTable
        caption="Przychód według kategorii"
        columns={['Kategoria', 'Przychód', 'Udział', 'Zamówienia']}
        rows={sorted.map((d) => [d.key, formatCurrency(d.revenue), formatPercent(d.share), String(d.orders)])}
      />
    </Tile>
  );
}
