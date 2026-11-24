import { Bar, BarChart, CartesianGrid, LabelList, Tooltip, XAxis, YAxis } from 'recharts';
import type { Category } from '../data/types';
import type { Share } from '../lib/aggregate';
import { formatCurrency, formatCurrencyCompact, formatOrderCount, formatPercent } from '../lib/format';
import { niceTicks } from '../lib/scale';
import { CHART_PALETTES, type Theme } from '../lib/theme';
import { ChartTable } from './ChartTable';

interface CategoryChartProps {
  data: Share<Category>[];
  theme: Theme;
  animate: boolean;
}

export function CategoryChart({ data, theme, animate }: CategoryChartProps) {
  const palette = CHART_PALETTES[theme];
  // Bars are one colour (the category is named on the axis), so sorting by value is safe.
  const sorted = [...data].sort((a, b) => b.revenue - a.revenue);
  const empty = sorted.every((d) => d.revenue === 0);
  const ticks = niceTicks(sorted[0]?.revenue ?? 0, 3);

  return (
    <section className="card chart-card" aria-labelledby="category-title">
      <header className="card__header">
        <div>
          <h2 id="category-title" className="card__title">
            Przychód według kategorii
          </h2>
          <p className="card__subtitle">Od największego udziału</p>
        </div>
      </header>

      {empty ? (
        <p className="chart-empty">Brak przychodu dla wybranych filtrów.</p>
      ) : (
        <div className="chart-box">
          <BarChart
            responsive
            style={{ width: '100%', height: '100%' }}
            data={sorted}
            layout="vertical"
            margin={{ top: 0, right: 80, bottom: 0, left: 0 }}
            barCategoryGap={10}
          >
            <CartesianGrid stroke={palette.grid} horizontal={false} />
            <XAxis
              type="number"
              tickFormatter={(v: number) => formatCurrencyCompact(v)}
              tick={{ fill: palette.tick, fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              ticks={ticks}
              domain={[0, ticks[ticks.length - 1] ?? 1]}
            />
            <YAxis
              type="category"
              dataKey="key"
              tick={{ fill: palette.tick, fontSize: 12 }}
              axisLine={{ stroke: palette.axis }}
              tickLine={false}
              width={124}
            />
            <Tooltip
              cursor={{ fill: palette.grid, fillOpacity: 0.6 }}
              isAnimationActive={false}
              content={({ active, payload }) => {
                const row = payload?.[0]?.payload as Share<Category> | undefined;
                if (!active || !row) return null;
                return (
                  <div className="chart-tooltip">
                    <p className="chart-tooltip__title">{row.key}</p>
                    <dl className="chart-tooltip__rows">
                      <div>
                        <dt>Przychód</dt>
                        <dd className="num">{formatCurrency(row.revenue)}</dd>
                      </div>
                      <div>
                        <dt>Udział</dt>
                        <dd className="num">{formatPercent(row.share)}</dd>
                      </div>
                      <div>
                        <dt>Zamówienia</dt>
                        <dd className="num">{formatOrderCount(row.orders)}</dd>
                      </div>
                    </dl>
                  </div>
                );
              }}
            />
            <Bar
              dataKey="revenue"
              name="Przychód"
              fill={palette.accent}
              radius={[0, 4, 4, 0]}
              maxBarSize={28}
              isAnimationActive={animate}
            >
              <LabelList
                dataKey="revenue"
                position="right"
                formatter={(v) => (typeof v === 'number' ? formatCurrencyCompact(v) : '')}
                style={{ fill: palette.tick, fontSize: 12 }}
              />
            </Bar>
          </BarChart>
        </div>
      )}

      <ChartTable
        caption="Przychód według kategorii"
        columns={['Kategoria', 'Przychód', 'Udział', 'Zamówienia']}
        rows={sorted.map((d) => [
          d.key,
          formatCurrency(d.revenue),
          formatPercent(d.share),
          String(d.orders),
        ])}
      />
    </section>
  );
}
