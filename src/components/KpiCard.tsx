import { memo } from 'react';
import type { Delta } from '../lib/aggregate';
import { AnimatedNumber } from './AnimatedNumber';
import { DeltaChip } from './DeltaChip';
import { Icon, type IconName } from './Icon';
import { Sparkline } from './Sparkline';
import { Tile } from './Tile';

interface KpiCardProps {
  id: string;
  label: string;
  /** Visible label when the full one is too long for the card; the full one is still read out */
  shortLabel?: string;
  icon: IconName;
  value: number | null;
  format: (value: number | null) => string;
  delta: Delta | null;
  /** Previous period value, already formatted */
  previous: string;
  trend: ReadonlyArray<number | null>;
  /** CSS colour for the sparkline, e.g. "var(--series-1)" */
  color: string;
  note?: string;
  className?: string;
}

function KpiCardView({
  id,
  label,
  shortLabel,
  icon,
  value,
  format,
  delta,
  previous,
  trend,
  color,
  note,
  className,
}: KpiCardProps) {
  return (
    <Tile className={`kpi ${className ?? ''}`} labelledBy={id}>
      <div className="kpi__top">
        <h3 id={id} className="eyebrow">
          {shortLabel ? (
            <>
              <span aria-hidden="true">{shortLabel}</span>
              <span className="sr-only">{label}</span>
            </>
          ) : (
            label
          )}
        </h3>
        <span className="kpi__icon" style={{ color }}>
          <Icon name={icon} size={17} />
        </span>
      </div>
      <p className="kpi__value num">
        <AnimatedNumber value={value} format={format} />
      </p>
      <DeltaChip delta={delta} />
      <div className="kpi__spark">
        <Sparkline values={trend} color={color} />
      </div>
      <p className="kpi__prev">
        Poprzednio: <span className="num">{previous}</span>
        {note ? <span className="kpi__note"> · {note}</span> : null}
      </p>
    </Tile>
  );
}

/** Re-renders only when its own data changes (filters, theme), not on unrelated app updates. */
export const KpiCard = memo(KpiCardView);
