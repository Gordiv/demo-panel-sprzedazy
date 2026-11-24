import { Pie, PieChart, Tooltip } from 'recharts';
import type { Channel } from '../data/types';
import type { Share } from '../lib/aggregate';
import {
  formatCurrency,
  formatCurrencyCompact,
  formatOrderCount,
  formatPercent,
} from '../lib/format';
import { CHART_PALETTES, type Theme } from '../lib/theme';
import { ChartTable } from './ChartTable';

interface ChannelChartProps {
  data: Share<Channel>[];
  theme: Theme;
  animate: boolean;
}

interface Slice extends Share<Channel> {
  fill: string;
  [key: string]: unknown;
}

export function ChannelChart({ data, theme, animate }: ChannelChartProps) {
  const palette = CHART_PALETTES[theme];
  // Colour belongs to the channel (fixed slot), never to its rank.
  const slices: Slice[] = data.map((d, i) => ({ ...d, fill: palette.series[i] ?? palette.accent }));
  const visible = slices.filter((s) => s.revenue > 0);
  const total = data.reduce((sum, d) => sum + d.revenue, 0);

  return (
    <section className="card chart-card" aria-labelledby="channel-title">
      <header className="card__header">
        <div>
          <h2 id="channel-title" className="card__title">
            Udział kanałów sprzedaży
          </h2>
          <p className="card__subtitle">Procent przychodu</p>
        </div>
      </header>

      {total === 0 ? (
        <p className="chart-empty">Brak przychodu dla wybranych filtrów.</p>
      ) : (
        <div className="donut">
          <div className="donut__chart">
            <PieChart responsive style={{ width: '100%', height: '100%' }}>
              <Pie
                data={visible}
                dataKey="revenue"
                nameKey="key"
                innerRadius="64%"
                outerRadius="96%"
                startAngle={90}
                endAngle={-270}
                paddingAngle={visible.length > 1 ? 1.5 : 0}
                stroke={palette.surface}
                strokeWidth={2}
                isAnimationActive={animate}
              />
              <Tooltip
                isAnimationActive={false}
                content={({ active, payload }) => {
                  const row = payload?.[0]?.payload as Slice | undefined;
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
            </PieChart>
            <div className="donut__center" aria-hidden="true">
              <span className="donut__center-label">Razem</span>
              <span className="donut__center-value num">{formatCurrencyCompact(total)}</span>
            </div>
          </div>

          <ul className="donut__legend" aria-label="Kanały sprzedaży">
            {slices.map((s) => (
              <li key={s.key}>
                <span className="swatch swatch--dot" style={{ background: s.fill }} aria-hidden="true" />
                <span className="donut__legend-name">{s.key}</span>
                <span className="donut__legend-share num">{formatPercent(s.share)}</span>
                <span className="donut__legend-value num">{formatCurrency(s.revenue)}</span>
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
    </section>
  );
}
