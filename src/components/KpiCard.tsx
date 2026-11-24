import type { Delta } from '../lib/aggregate';
import { formatDelta } from '../lib/format';

interface KpiCardProps {
  label: string;
  value: string;
  delta: Delta | null;
  /** Previous period value, already formatted */
  previous: string;
  note?: string;
}

export function KpiCard({ label, value, delta, previous, note }: KpiCardProps) {
  const text = formatDelta(delta);
  const tone =
    !delta || delta.favourable === null ? 'neutral' : delta.favourable ? 'good' : 'bad';

  return (
    <article className="card kpi">
      <h3 className="kpi__label">{label}</h3>
      <p className="kpi__value num">{value}</p>
      {text ? (
        <p className={`kpi__delta kpi__delta--${tone}`}>
          <span className="kpi__badge num" aria-hidden="true">
            <span className="kpi__arrow">{text.symbol}</span> {text.text}
          </span>
          <span className="sr-only">{text.label}</span>
          <span className="kpi__vs" aria-hidden="true">
            vs poprzedni okres
          </span>
        </p>
      ) : (
        <p className="kpi__delta kpi__delta--neutral">
          <span className="kpi__vs">Brak danych do porównania</span>
        </p>
      )}
      <p className="kpi__prev">
        Poprzednio: <span className="num">{previous}</span>
        {note ? <span className="kpi__note"> · {note}</span> : null}
      </p>
    </article>
  );
}
