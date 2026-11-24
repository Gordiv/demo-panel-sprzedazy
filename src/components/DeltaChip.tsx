import type { Delta } from '../lib/aggregate';
import { formatDelta, formatPercentMagnitude, formatPointsMagnitude } from '../lib/format';
import { AnimatedNumber } from './AnimatedNumber';
import { Icon } from './Icon';

interface DeltaChipProps {
  delta: Delta | null;
  /** Shown after the chip, e.g. "vs poprzedni okres" */
  suffix?: string;
}

/** Change against the previous period: arrow shape, colour and spoken text, never colour alone. */
export function DeltaChip({ delta, suffix = 'vs poprzedni okres' }: DeltaChipProps) {
  const text = formatDelta(delta);
  if (!delta || !text) {
    return <span className="delta delta--none">Brak danych do porównania</span>;
  }
  const tone = delta.favourable === null ? 'neutral' : delta.favourable ? 'good' : 'bad';
  const icon = delta.trend === 'up' ? 'arrowUp' : delta.trend === 'down' ? 'arrowDown' : 'flat';
  return (
    <span className="delta">
      <span className={`delta__chip delta__chip--${tone}`} aria-hidden="true">
        <Icon name={icon} size={13} />
        {delta.trend === 'flat' ? (
          'bez zmian'
        ) : (
          <AnimatedNumber
            value={Math.abs(delta.value)}
            format={delta.unit === 'percent' ? formatPercentMagnitude : formatPointsMagnitude}
            duration={900}
            className="num"
          />
        )}
      </span>
      <span className="sr-only">{text.label}</span>
      <span className="delta__suffix" aria-hidden="true">
        {suffix}
      </span>
    </span>
  );
}
