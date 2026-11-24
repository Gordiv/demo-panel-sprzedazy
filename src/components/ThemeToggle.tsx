import type { Theme } from '../lib/theme';

interface ThemeToggleProps {
  theme: Theme;
  onChange: (theme: Theme) => void;
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2" />
      <path
        d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
      <path
        d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const OPTIONS: ReadonlyArray<{ value: Theme; label: string; icon: () => React.JSX.Element }> = [
  { value: 'light', label: 'Jasny', icon: SunIcon },
  { value: 'dark', label: 'Ciemny', icon: MoonIcon },
];

/** Two pressed-state buttons: the current theme is visible and announced. */
export function ThemeToggle({ theme, onChange }: ThemeToggleProps) {
  return (
    <div className="segmented theme-toggle" role="group" aria-label="Motyw kolorystyczny">
      {OPTIONS.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          className="segmented__option"
          aria-pressed={theme === value}
          onClick={() => onChange(value)}
        >
          <Icon />
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}
