import { useId, useState } from 'react';
import { Area, CartesianGrid, ComposedChart, Line, Tooltip, XAxis, YAxis } from 'recharts';
import type { Delta, Granularity, SeriesPoint } from '../lib/aggregate';
import {
  formatBucketLabel,
  formatBucketTick,
  formatCompactOrDash,
  formatCurrency,
  formatCurrencyCompact,
  formatInteger,
  formatPercent,
} from '../lib/format';
import { niceTicks } from '../lib/scale';
import { CHART_PALETTES, type Theme } from '../lib/theme';
import { AnimatedNumber } from './AnimatedNumber';
import { ChartTable } from './ChartTable';
import { DeltaChip } from './DeltaChip';
import { Icon } from './Icon';
import { Tile } from './Tile';

interface RevenueChartProps {
  data: SeriesPoint[];
  granularity: Granularity;
  total: number;
  delta: Delta | null;
  theme: Theme;
  animate: boolean;
  /** False when the previous period has no data at all */
  hasPrevious: boolean;
  className?: string;
}

function change(point: SeriesPoint): number | null {
  return point.previousRevenue && point.previousRevenue > 0
    ? (point.revenue - point.previousRevenue) / point.previousRevenue
    : null;
}

function GlassTooltip({ point, granularity, hasPrevious }: { point: SeriesPoint; granularity: Granularity; hasPrevious: boolean }) {
  const diff = change(point);
  return (
    <div className="chart-tooltip glass-pop">
      <p className="chart-tooltip__title">{formatBucketLabel(point.start, point.end, granularity)}</p>
      <dl className="chart-tooltip__rows">
        <div>
          <dt>
            <span className="swatch swatch--line" aria-hidden="true" /> Przychód
          </dt>
          <dd className="num">{formatCurrency(point.revenue)}</dd>
        </div>
        <div>
          <dt>
            <span className="swatch swatch--none" aria-hidden="true" /> Zamówienia
          </dt>
          <dd className="num">{formatInteger(point.orders)}</dd>
        </div>
        {hasPrevious && point.previousStart && point.previousEnd ? (
          <div>
            <dt>
              <span className="swatch swatch--dashed" aria-hidden="true" />{' '}
              {formatBucketLabel(point.previousStart, point.previousEnd, granularity)}
            </dt>
            <dd className="num">{formatCurrency(point.previousRevenue)}</dd>
          </div>
        ) : null}
        {diff !== null ? (
          <div>
            <dt>
              <span className="swatch swatch--none" aria-hidden="true" /> Zmiana
            </dt>
            <dd className={`num ${diff >= 0 ? 'text-good' : 'text-bad'}`}>
              {diff >= 0 ? '+' : '−'}
              {formatPercent(Math.abs(diff))}
            </dd>
          </div>
        ) : null}
      </dl>
    </div>
  );
}

export function RevenueChart({ data, granularity, total, delta, theme, animate, hasPrevious, className }: RevenueChartProps) {
  const palette = CHART_PALETTES[theme];
  const uid = useId().replace(/:/g, '');
  const [hover, setHover] = useState<number | null>(null);
  const hovered = hover !== null ? data[hover] : undefined;
  const empty = data.every((d) => d.revenue === 0);
  const ticks = niceTicks(
    Math.max(0, ...data.map((d) => Math.max(d.revenue, hasPrevious ? (d.previousRevenue ?? 0) : 0))),
  );
  const first = data[0];
  const last = data[data.length - 1];
  const unit = granularity === 'month' ? 'miesiące' : 'tygodnie';

  return (
    <Tile className={className} labelledBy="revenue-title">
      <header className="hero__header">
        <div>
          <div className="tile__heading">
            <span className="tile__icon">
              <Icon name="revenue" size={17} />
            </span>
            <h3 id="revenue-title" className="tile__title">
              Przychód w czasie
            </h3>
          </div>
          <p className="eyebrow hero__label">{hovered ? 'Wybrany przedział' : 'Suma w okresie'}</p>
          <p className="hero__value num">
            {hovered ? (
              <span>{formatCurrency(hovered.revenue)}</span>
            ) : (
              <AnimatedNumber value={total} format={formatCompactOrDash} />
            )}
          </p>
          <div className="hero__meta">
            {hovered ? (
              <span className="hero__hovered">
                {formatBucketLabel(hovered.start, hovered.end, granularity)}
                {change(hovered) !== null ? (
                  <span className={(change(hovered) ?? 0) >= 0 ? 'text-good' : 'text-bad'}>
                    {' '}
                    {(change(hovered) ?? 0) >= 0 ? '+' : '−'}
                    {formatPercent(Math.abs(change(hovered) ?? 0))} vs poprzedni okres
                  </span>
                ) : null}
              </span>
            ) : (
              <DeltaChip delta={delta} />
            )}
          </div>
        </div>
        <ul className="legend" aria-label="Legenda">
          <li>
            <span className="swatch swatch--line" aria-hidden="true" />
            Bieżący okres
          </li>
          {hasPrevious ? (
            <li>
              <span className="swatch swatch--dashed" aria-hidden="true" />
              Poprzedni okres
            </li>
          ) : null}
          <li className="legend__unit">Przedziały: {unit}</li>
        </ul>
      </header>

      {empty ? (
        <p className="chart-empty">Brak przychodu dla wybranych filtrów.</p>
      ) : (
        <div className="hero__chart">
          <ComposedChart
            responsive
            style={{ width: '100%', height: '100%' }}
            data={data}
            margin={{ top: 12, right: 8, bottom: 0, left: 0 }}
            onMouseMove={(state) => {
              const i = Number(state.activeTooltipIndex);
              setHover(Number.isInteger(i) && i >= 0 ? i : null);
            }}
            onMouseLeave={() => setHover(null)}
          >
            <defs>
              <linearGradient id={`${uid}-stroke`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor={palette.lineFrom} />
                <stop offset="1" stopColor={palette.lineTo} />
              </linearGradient>
              <linearGradient id={`${uid}-fill`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor={palette.lineFrom} stopOpacity={theme === 'dark' ? 0.42 : 0.3} />
                <stop offset="0.65" stopColor={palette.lineTo} stopOpacity={0.06} />
                <stop offset="1" stopColor={palette.lineTo} stopOpacity={0} />
              </linearGradient>
              <filter id={`${uid}-glow`} x="-5%" y="-40%" width="110%" height="180%">
                <feGaussianBlur stdDeviation="5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <CartesianGrid stroke={palette.grid} vertical={false} strokeDasharray="2 6" />
            <XAxis
              dataKey="start"
              tickFormatter={(s: string) => formatBucketTick(s, granularity)}
              tick={{ fill: palette.tick, fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
              minTickGap={14}
              dy={6}
            />
            <YAxis
              ticks={ticks}
              domain={[0, ticks[ticks.length - 1] ?? 1]}
              tickFormatter={(v: number) => formatCurrencyCompact(v)}
              tick={{ fill: palette.tick, fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              width={76}
            />
            <Tooltip
              cursor={{ stroke: palette.cursor, strokeWidth: 1, strokeDasharray: '4 4' }}
              isAnimationActive={false}
              content={({ active, payload }) => {
                const point = payload?.[0]?.payload as SeriesPoint | undefined;
                return active && point ? (
                  <GlassTooltip point={point} granularity={granularity} hasPrevious={hasPrevious} />
                ) : null;
              }}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="none"
              fill={`url(#${uid}-fill)`}
              isAnimationActive={animate}
              animationDuration={1100}
              animationEasing="ease-out"
              activeDot={false}
            />
            {hasPrevious ? (
              <Line
                type="monotone"
                dataKey="previousRevenue"
                stroke={palette.previous}
                strokeWidth={1.75}
                strokeDasharray="5 5"
                dot={false}
                activeDot={{ r: 4, fill: palette.dotFill, stroke: palette.previous, strokeWidth: 2 }}
                connectNulls={false}
                isAnimationActive={animate}
                animationDuration={1100}
                animationEasing="ease-out"
              />
            ) : null}
            <Line
              type="monotone"
              dataKey="revenue"
              stroke={`url(#${uid}-stroke)`}
              strokeWidth={3}
              filter={`url(#${uid}-glow)`}
              dot={false}
              activeDot={{ r: 6, fill: palette.dotFill, stroke: palette.lineFrom, strokeWidth: 3 }}
              isAnimationActive={animate}
              animationDuration={1300}
              animationEasing="ease-out"
            />
          </ComposedChart>
        </div>
      )}

      <ChartTable
        caption={`Przychód w okresie ${first && last ? formatBucketLabel(first.start, last.end, 'week') : ''}`}
        columns={['Przedział', 'Przychód', 'Zamówienia', 'Poprzedni okres']}
        rows={data.map((d) => [
          formatBucketLabel(d.start, d.end, granularity),
          formatCurrency(d.revenue),
          formatInteger(d.orders),
          hasPrevious && d.previousRevenue !== null ? formatCurrency(d.previousRevenue) : '—',
        ])}
      />
    </Tile>
  );
}
