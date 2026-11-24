import { useId } from 'react';
import { motion } from 'motion/react';
import { CATEGORIES, CHANNELS, type Category, type Channel } from '../data/types';
import { PERIODS, type Filters as FilterState, type PeriodMonths } from '../lib/aggregate';
import { useMotionEnabled } from '../lib/motion';
import { Icon } from './Icon';
import { Select, type SelectOption } from './Select';

interface FiltersProps {
  value: FilterState;
  onChange: (next: FilterState) => void;
  onReset: () => void;
  isDefault: boolean;
}

const PERIOD_LABELS: Record<PeriodMonths, string> = {
  3: '3 mies.',
  6: '6 mies.',
  12: '12 mies.',
};

const PERIOD_SPOKEN: Record<PeriodMonths, string> = {
  3: 'Ostatnie 3 miesiące',
  6: 'Ostatnie 6 miesięcy',
  12: 'Ostatnie 12 miesięcy',
};

const CATEGORY_OPTIONS: ReadonlyArray<SelectOption<Category | 'all'>> = [
  { value: 'all', label: 'Wszystkie' },
  ...CATEGORIES.map((c) => ({ value: c, label: c })),
];

const CHANNEL_OPTIONS: ReadonlyArray<SelectOption<Channel | 'all'>> = [
  { value: 'all', label: 'Wszystkie' },
  ...CHANNELS.map((c) => ({ value: c, label: c })),
];

export function Filters({ value, onChange, onReset, isDefault }: FiltersProps) {
  const id = useId();
  const animate = useMotionEnabled();

  return (
    <div className="filters" role="group" aria-label="Filtry">
      <fieldset className="filters__period">
        <legend className="field-label">Okres</legend>
        <div className="segmented">
          {PERIODS.map((months) => {
            const checked = value.months === months;
            return (
              <label key={months} className={`segmented__item${checked ? ' is-checked' : ''}`}>
                <input
                  type="radio"
                  name={`${id}-period`}
                  value={months}
                  checked={checked}
                  onChange={() => onChange({ ...value, months })}
                  aria-label={PERIOD_SPOKEN[months]}
                />
                {checked ? (
                  <motion.span
                    layoutId={animate ? `${id}-pill` : undefined}
                    className="segmented__pill"
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                  />
                ) : null}
                <span className="segmented__text" aria-hidden="true">
                  {PERIOD_LABELS[months]}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <Select
        label="Kategoria"
        icon="layers"
        value={value.category}
        options={CATEGORY_OPTIONS}
        onChange={(category) => onChange({ ...value, category })}
      />
      <Select
        label="Kanał"
        icon="channels"
        value={value.channel}
        options={CHANNEL_OPTIONS}
        onChange={(channel) => onChange({ ...value, channel })}
      />

      <button
        type="button"
        className="icon-btn filters__reset"
        onClick={onReset}
        disabled={isDefault}
        aria-label="Wyczyść filtry"
        title="Wyczyść filtry"
      >
        <Icon name="reset" size={18} />
      </button>
    </div>
  );
}
