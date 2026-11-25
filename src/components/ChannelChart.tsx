import { memo, useState, type CSSProperties } from 'react';
import type { Channel } from '../data/types';
import type { Share } from '../lib/aggregate';
import { formatCompactOrDash, formatCurrency, formatOrderCount, formatPercent } from '../lib/format';
import { donutArcs } from '../lib/geometry';
import { AnimatedNumber } from './AnimatedNumber';
import { ChartTable } from './ChartTable';
import { Icon } from './Icon';
import { Tile, TileHeader } from './Tile';

interface ChannelChartProps {
  data: Share<Channel>[];
  className?: string;
}

const SIZE = 200;
const STROKE = 24;
const R = (SIZE - STROKE) / 2;
const SLOT_COLORS = ['var(--series-1)', 'var(--series-2)', 'var(--series-3)'] as const;
const SLOT_MARKS = ['circle', 'square', 'diamond'] as const;

/** Donut drawn by hand: arcs sweep in, legend and arcs highlight each other. */
function ChannelChartView({ data, className }: ChannelChartProps) {
  const [focus, setFocus] = useState<Channel | null>(null);
  const total = data.reduce((s, d) => s + d.revenue, 0);
  const arcs = donutArcs(
    data.map((d) => d.revenue),
    0.012,
  );
  const focused = data.find((d) => d.key === focus);

  return (
    <Tile className={className} labelledBy="channel-title">
      <TileHeader
        id="channel-title"
        title="Kanały sprzedaży"
        icon={<Icon name="channels" size={17} />}
        subtitle="Udział w przychodzie"
      />
      {total === 0 ? (
        <p className="chart-empty">Brak przychodu dla wybranych filtrów.</p>
      ) : (
        <div className="donut">
          <div className="donut__chart">
            <svg viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden="true" focusable="false">
              <circle className="ring-track" cx={SIZE / 2} cy={SIZE / 2} r={R} strokeWidth={STROKE} fill="none" />
              {data.map((d, i) => {
                const arc = arcs[i];
                if (!arc || arc.length <= 0) return null;
                const dimmed = focus !== null && focus !== d.key;
                return (
                  <circle
                    key={d.key}
                    className={`donut__arc sweep${dimmed ? ' is-dimmed' : ''}`}
                    cx={SIZE / 2}
                    cy={SIZE / 2}
                    r={R}
                    fill="none"
                    strokeWidth={STROKE}
                    pathLength={1}
                    transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
                    style={
                      {
                        stroke: SLOT_COLORS[i],
                        '--len': arc.length,
                        '--start': arc.start,
                        '--d': `${100 + i * 140}ms`,
                      } as CSSProperties
                    }
                    onPointerEnter={() => setFocus(d.key)}
                    onPointerLeave={() => setFocus(null)}
                  />
                );
              })}
            </svg>
            <div className="donut__center">
              <span className="donut__center-label">{focused ? focused.key : 'Razem'}</span>
              <span className="donut__center-value num">
                {focused ? (
                  formatPercent(focused.share)
                ) : (
                  <AnimatedNumber value={total} format={formatCompactOrDash} duration={1300} />
                )}
              </span>
              {focused ? <span className="donut__center-sub num">{formatCurrency(focused.revenue)}</span> : null}
            </div>
          </div>

          <ul className="donut__legend" aria-label="Kanały sprzedaży">
            {data.map((d, i) => (
              <li key={d.key}>
                <div
                  className={`legend-item${focus !== null && focus !== d.key ? ' is-dimmed' : ''}`}
                  onPointerEnter={() => setFocus(d.key)}
                  onPointerLeave={() => setFocus(null)}
                >
                  <span className={`mark mark--${SLOT_MARKS[i]}`} style={{ background: SLOT_COLORS[i] }} aria-hidden="true" />
                  <span className="legend-item__name">{d.key}</span>
                  <span className="legend-item__share num">{formatPercent(d.share)}</span>
                  <span className="legend-item__value num">
                    {formatCurrency(d.revenue)}
                    <span className="legend-item__orders">{formatOrderCount(d.orders)}</span>
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      <ChartTable
        caption="Przychód według kanałów sprzedaży"
        columns={['Kanał', 'Przychód', 'Udział', 'Zamówienia']}
        rows={data.map((d) => [d.key, formatCurrency(d.revenue), formatPercent(d.share), String(d.orders)])}
      />
    </Tile>
  );
}

/** Re-renders only when its own data changes (filters, theme), not on unrelated app updates. */
export const ChannelChart = memo(ChannelChartView);
