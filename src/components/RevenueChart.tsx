import { Area, CartesianGrid, ComposedChart, Line, Tooltip, XAxis, YAxis } from 'recharts';
import type { MonthPoint } from '../lib/aggregate';
import {
  formatCurrency,
  formatCurrencyCompact,
  formatInteger,
  formatMonthLong,
  formatMonthName,
  formatMonthShort,
  formatPercent,
} from '../lib/format';
import { niceTicks } from '../lib/scale';
import { CHART_PALETTES, type Theme } from '../lib/theme';
import { ChartTable } from './ChartTable';

interface RevenueChartProps {
  data: MonthPoint[];
  theme: Theme;
  animate: boolean;
  /** False when the previous period has no data at all */
  hasPrevious: boolean;
}

interface TooltipBodyProps {
  point: MonthPoint;
  hasPrevious: boolean;
}

function TooltipBody({ point, hasPrevious }: TooltipBodyProps) {
  const change =
    hasPrevious && point.previousRevenue > 0
      ? (point.revenue - point.previousRevenue) / point.previousRevenue
      : null;
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip__title">{formatMonthLong(point.month)}</p>
      <dl className="chart-tooltip__rows">
        <div>
          <dt>
            <span className="swatch swatch--line" aria-hidden="true" /> Przychód
          </dt>
          <dd className="num">{formatCurrency(point.revenue)}</dd>
        </div>
        <div>
          <dt>Zamówienia</dt>
          <dd className="num">{formatInteger(point.orders)}</dd>
        </div>
        {hasPrevious ? (
          <div>
            <dt>
              <span className="swatch swatch--dashed" aria-hidden="true" /> {formatMonthShort(point.previousMonth)}
            </dt>
            <dd className="num">{formatCurrency(point.previousRevenue)}</dd>
          </div>
        ) : null}
        {change !== null ? (
          <div>
            <dt>Zmiana</dt>
            <dd className="num">
              {change >= 0 ? '▲' : '▼'} {formatPercent(Math.abs(change))}
            </dd>
          </div>
        ) : null}
      </dl>
    </div>
  );
}

export function RevenueChart({ data, theme, animate, hasPrevious }: RevenueChartProps) {
  const palette = CHART_PALETTES[theme];
  const first = data[0];
  const last = data[data.length - 1];
  const empty = data.every((d) => d.revenue === 0);
  const ticks = niceTicks(
    Math.max(...data.map((d) => Math.max(d.revenue, hasPrevious ? d.previousRevenue : 0)), 0),
  );

  return (
    <section className="card chart-card" aria-labelledby="revenue-title">
      <header className="card__header">
        <div>
          <h2 id="revenue-title" className="card__title">
            Przychód miesięczny
          </h2>
          {first && last ? (
            <p className="card__subtitle">
              {formatMonthLong(first.month)} – {formatMonthLong(last.month)}
              {hasPrevious ? ', porównanie z poprzednim okresem' : ''}
            </p>
          ) : null}
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
        </ul>
      </header>

      {empty ? (
        <p className="chart-empty">Brak przychodu dla wybranych filtrów.</p>
      ) : (
        <div className="chart-box chart-box--tall">
          <ComposedChart
            responsive
            style={{ width: '100%', height: '100%' }}
            data={data}
            margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
          >
            <CartesianGrid stroke={palette.grid} vertical={false} />
            <XAxis
              dataKey="month"
              tickFormatter={(m: string) => (data.length > 6 ? formatMonthName(m) : formatMonthShort(m))}
              tick={{ fill: palette.tick, fontSize: 12 }}
              axisLine={{ stroke: palette.axis }}
              tickLine={false}
              interval="preserveStartEnd"
              minTickGap={8}
            />
            <YAxis
              ticks={ticks}
              domain={[0, ticks[ticks.length - 1] ?? 1]}
              tickFormatter={(v: number) => formatCurrencyCompact(v)}
              tick={{ fill: palette.tick, fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              width={84}
            />
            <Tooltip
              cursor={{ stroke: palette.cursor, strokeWidth: 1 }}
              isAnimationActive={false}
              content={({ active, payload }) => {
                const point = payload?.[0]?.payload as MonthPoint | undefined;
                return active && point ? <TooltipBody point={point} hasPrevious={hasPrevious} /> : null;
              }}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              name="Bieżący okres"
              stroke={palette.accent}
              strokeWidth={2}
              fill={palette.accent}
              fillOpacity={0.1}
              dot={data.length <= 6 ? { r: 3, fill: palette.accent, strokeWidth: 0 } : false}
              activeDot={{ r: 5, stroke: palette.surface, strokeWidth: 2 }}
              isAnimationActive={animate}
            />
            {hasPrevious ? (
              <Line
                type="monotone"
                dataKey="previousRevenue"
                name="Poprzedni okres"
                stroke={palette.previous}
                strokeWidth={2}
                strokeDasharray="5 4"
                dot={false}
                activeDot={{ r: 4, stroke: palette.surface, strokeWidth: 2, fill: palette.previous }}
                isAnimationActive={animate}
              />
            ) : null}
          </ComposedChart>
        </div>
      )}

      <ChartTable
        caption="Przychód miesięczny w bieżącym i poprzednim okresie"
        columns={['Miesiąc', 'Przychód', 'Zamówienia', 'Poprzedni okres']}
        rows={data.map((d) => [
          formatMonthLong(d.month),
          formatCurrency(d.revenue),
          formatInteger(d.orders),
          hasPrevious ? `${formatCurrency(d.previousRevenue)} (${formatMonthShort(d.previousMonth)})` : '—',
        ])}
      />
    </section>
  );
}
