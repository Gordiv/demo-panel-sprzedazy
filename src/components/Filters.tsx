import { useId } from 'react';
import { CATEGORIES, CHANNELS, type Category, type Channel } from '../data/types';
import { PERIODS, type Filters as FilterState, type PeriodMonths } from '../lib/aggregate';

interface FiltersProps {
  value: FilterState;
  onChange: (next: FilterState) => void;
  onReset: () => void;
  isDefault: boolean;
}

const PERIOD_LABELS: Record<PeriodMonths, string> = {
  3: '3 miesiące',
  6: '6 miesięcy',
  12: '12 miesięcy',
};

function isCategory(value: string): value is Category {
  return (CATEGORIES as readonly string[]).includes(value);
}

function isChannel(value: string): value is Channel {
  return (CHANNELS as readonly string[]).includes(value);
}

export function Filters({ value, onChange, onReset, isDefault }: FiltersProps) {
  const id = useId();
  const categoryId = `${id}-category`;
  const channelId = `${id}-channel`;

  return (
    <form className="filters" onSubmit={(e) => e.preventDefault()} aria-label="Filtry">
      <fieldset className="filters__group">
        <legend className="field-label">Okres</legend>
        <div className="segmented segmented--wide">
          {PERIODS.map((months) => (
            <label key={months} className="segmented__radio">
              <input
                type="radio"
                name={`${id}-period`}
                value={months}
                checked={value.months === months}
                onChange={() => onChange({ ...value, months })}
              />
              <span>
                {/* The prefix is visually dropped on phones but always read out. */}
                <span>
                  <span className="period-prefix">Ostatnie </span>
                  {PERIOD_LABELS[months]}
                </span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="filters__group">
        <label className="field-label" htmlFor={categoryId}>
          Kategoria
        </label>
        <select
          id={categoryId}
          className="select"
          value={value.category}
          onChange={(e) => {
            const v = e.target.value;
            onChange({ ...value, category: isCategory(v) ? v : 'all' });
          }}
        >
          <option value="all">Wszystkie</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="filters__group">
        <label className="field-label" htmlFor={channelId}>
          Kanał sprzedaży
        </label>
        <select
          id={channelId}
          className="select"
          value={value.channel}
          onChange={(e) => {
            const v = e.target.value;
            onChange({ ...value, channel: isChannel(v) ? v : 'all' });
          }}
        >
          <option value="all">Wszystkie</option>
          {CHANNELS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="filters__actions">
        <button type="button" className="btn btn--ghost" onClick={onReset} disabled={isDefault}>
          Wyczyść filtry
        </button>
      </div>
    </form>
  );
}
