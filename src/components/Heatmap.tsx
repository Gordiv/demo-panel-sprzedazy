import { memo, useState, type PointerEvent } from 'react';
import { HOUR_BLOCK, HOUR_BLOCKS, type HeatCell, type Heatmap as HeatmapData } from '../lib/insights';
import {
  WEEKDAYS_LONG,
  WEEKDAYS_SHORT,
  formatCurrency,
  formatHourBlock,
  formatOrderCount,
} from '../lib/format';
import { ChartTable } from './ChartTable';
import { Icon } from './Icon';
import { Tile, TileHeader } from './Tile';

interface HeatmapProps {
  data: HeatmapData;
  className?: string;
}

interface Hover {
  cell: HeatCell;
  x: number;
  y: number;
}

/** Intensity 0..1 with a gentle curve so mid values stay readable. */
function level(orders: number, max: number): number {
  return max > 0 ? Math.pow(orders / max, 0.75) : 0;
}

function HeatmapView({ data, className }: HeatmapProps) {
  const [hover, setHover] = useState<Hover | null>(null);
  const peak = data.peak;

  const onPointerOver = (e: PointerEvent<HTMLDivElement>) => {
    const target = e.target;
    if (!(target instanceof HTMLElement) || !target.dataset.w) {
      setHover(null);
      return;
    }
    const w = Number(target.dataset.w);
    const b = Number(target.dataset.b);
    const cell = data.rows[w]?.[b];
    if (!cell) return;
    const grid = e.currentTarget.getBoundingClientRect();
    const rect = target.getBoundingClientRect();
    setHover({ cell, x: rect.left - grid.left + rect.width / 2, y: rect.top - grid.top });
  };

  return (
    <Tile className={className} labelledBy="heatmap-title">
      <TileHeader
        id="heatmap-title"
        title="Kiedy klienci kupują"
        icon={<Icon name="grid" size={17} />}
        subtitle={
          peak
            ? `Szczyt: ${WEEKDAYS_LONG[peak.weekday]}, ${formatHourBlock(peak.block, HOUR_BLOCK)} (${formatOrderCount(peak.orders)})`
            : 'Brak zamówień w wybranym okresie'
        }
      />
      <div className="heatmap" onPointerOver={onPointerOver} onPointerLeave={() => setHover(null)} aria-hidden="true">
        <div className="heatmap__grid">
          <span />
          {Array.from({ length: HOUR_BLOCKS }, (_, b) => (
            <span key={b} className="heatmap__hour">
              {b % 2 === 0 ? `${b * HOUR_BLOCK}` : ''}
            </span>
          ))}
          {data.rows.map((row, w) => (
            <div key={w} className="heatmap__row">
              <span className="heatmap__day">{WEEKDAYS_SHORT[w]}</span>
              {row.map((cell) => {
                const l = level(cell.orders, data.maxOrders);
                const isHover = hover?.cell === cell;
                return (
                  <span
                    key={cell.block}
                    className={`heatmap__cell${cell.orders === 0 ? ' is-zero' : ''}${isHover ? ' is-hover' : ''}`}
                    data-w={w}
                    data-b={cell.block}
                    style={{ opacity: cell.orders === 0 ? undefined : 0.14 + 0.86 * l }}
                  />
                );
              })}
            </div>
          ))}
        </div>
        {hover ? (
          <div
            className="heatmap__tooltip glass-pop"
            style={{ transform: `translate(${hover.x}px, ${hover.y}px) translate(-50%, calc(-100% - 10px))` }}
          >
            <strong>
              {WEEKDAYS_LONG[hover.cell.weekday]}, {formatHourBlock(hover.cell.block, HOUR_BLOCK)}
            </strong>
            <span className="num">{formatOrderCount(hover.cell.orders)}</span>
            <span className="num">{formatCurrency(hover.cell.revenue)}</span>
          </div>
        ) : null}
      </div>
      <div className="heatmap__scale" aria-hidden="true">
        <span>mniej</span>
        {[0.14, 0.35, 0.57, 0.78, 1].map((o) => (
          <i key={o} style={{ opacity: o }} />
        ))}
        <span>więcej zamówień</span>
      </div>
      <ChartTable
        caption="Liczba zamówień według dnia tygodnia i godziny"
        columns={['Dzień', ...Array.from({ length: HOUR_BLOCKS }, (_, b) => formatHourBlock(b, HOUR_BLOCK))]}
        rows={data.rows.map((row, w) => [WEEKDAYS_LONG[w] ?? '', ...row.map((c) => String(c.orders))])}
      />
    </Tile>
  );
}

/** Re-renders only when its own data changes (filters, theme), not on unrelated app updates. */
export const Heatmap = memo(HeatmapView);
