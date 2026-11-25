import { memo, useId, type CSSProperties } from 'react';
import type { GoalProgress, MonthGoal } from '../lib/insights';
import { formatCurrency, formatMonthLong, formatMonthName, formatPercent, formatWholePercent } from '../lib/format';
import { AnimatedNumber } from './AnimatedNumber';
import { ChartTable } from './ChartTable';
import { Icon } from './Icon';
import { Tile, TileHeader } from './Tile';

interface GoalRingProps {
  goal: GoalProgress;
  months: MonthGoal[];
  filtered: boolean;
  className?: string;
}

const SIZE = 168;
const STROKE = 14;
const R = (SIZE - STROKE) / 2;

function GoalRingView({ goal, months, filtered, className }: GoalRingProps) {
  const uid = useId().replace(/:/g, '');
  const ratio = goal.ratio ?? 0;
  const met = ratio >= 1;
  const maxBar = Math.max(1.2, ...months.map((m) => m.ratio ?? 0));

  return (
    <Tile className={`goal ${className ?? ''}`} labelledBy="goal-title">
      <TileHeader
        id="goal-title"
        title="Realizacja planu"
        icon={<Icon name="target" size={17} />}
        subtitle={filtered ? 'Plan zawężony do wybranego segmentu' : 'Plan sprzedaży na wybrany okres'}
      />
      <div className="goal__body">
        <div className="goal__ring">
          <svg viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden="true" focusable="false">
            <defs>
              <linearGradient id={`${uid}-g`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" style={{ stopColor: 'var(--series-1)' }} />
                <stop offset="1" style={{ stopColor: 'var(--series-2)' }} />
              </linearGradient>
            </defs>
            <circle className="ring-track" cx={SIZE / 2} cy={SIZE / 2} r={R} strokeWidth={STROKE} fill="none" />
            <circle
              className="ring-arc sweep"
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={R}
              fill="none"
              stroke={`url(#${uid}-g)`}
              strokeWidth={STROKE}
              strokeLinecap="round"
              pathLength={1}
              transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
              style={{ '--len': Math.min(1, Math.max(0.002, ratio)), '--d': '150ms' } as CSSProperties}
            />
          </svg>
          <div className="goal__center">
            <span className="goal__percent num">
              <AnimatedNumber value={goal.ratio} format={formatWholePercent} duration={1400} />
            </span>
            <span className="goal__caption">celu</span>
          </div>
        </div>
        <dl className="goal__stats">
          <div>
            <dt>Plan</dt>
            <dd className="num">{formatCurrency(goal.target)}</dd>
          </div>
          <div>
            <dt>Wykonanie</dt>
            <dd className="num">{formatCurrency(goal.actual)}</dd>
          </div>
          <div>
            <dt>{met ? 'Nadwyżka' : 'Brakuje'}</dt>
            <dd className={`num ${met ? 'text-good' : ''}`}>
              {met ? <Icon name="check" size={14} /> : null}
              {formatCurrency(met ? goal.surplus : goal.remaining)}
            </dd>
          </div>
        </dl>
      </div>

      <div className="goal__months" aria-hidden="true">
        <div className="goal__target-line" style={{ bottom: `${(1 / maxBar) * 100}%` }} />
        {months.map((m, i) => {
          const r = m.ratio ?? 0;
          return (
            <div key={m.month} className="goal__month" title={`${formatMonthLong(m.month)}: ${formatPercent(r)} planu`}>
              <div className="goal__bar-track">
                <div
                  className={`goal__bar grow-y${r >= 1 ? ' is-met' : ''}`}
                  style={{ '--v': Math.min(1, r / maxBar), '--d': `${200 + i * 40}ms` } as CSSProperties}
                />
              </div>
              <span className="goal__month-label">
                {months.length > 6 ? formatMonthName(m.month).slice(0, 1) : formatMonthName(m.month)}
              </span>
            </div>
          );
        })}
      </div>
      <p className="goal__legend">
        <span className="goal__legend-line" aria-hidden="true" /> 100% planu miesiąca
        <span className="goal__legend-met">
          <i aria-hidden="true" /> plan wykonany
        </span>
      </p>

      <ChartTable
        caption="Plan i wykonanie w kolejnych miesiącach"
        columns={['Miesiąc', 'Plan', 'Wykonanie', 'Realizacja']}
        rows={months.map((m) => [
          formatMonthLong(m.month),
          formatCurrency(m.target),
          formatCurrency(m.actual),
          formatPercent(m.ratio),
        ])}
      />
    </Tile>
  );
}

/** Re-renders only when its own data changes (filters, theme), not on unrelated app updates. */
export const GoalRing = memo(GoalRingView);
