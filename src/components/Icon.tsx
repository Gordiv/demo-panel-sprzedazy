import type { ReactNode } from 'react';

/** One consistent line icon set: 24px grid, 1.75 stroke, round caps. */
const PATHS = {
  overview: (
    <>
      <rect x="3.5" y="3.5" width="7" height="9" rx="2" />
      <rect x="13.5" y="3.5" width="7" height="5" rx="2" />
      <rect x="13.5" y="11.5" width="7" height="9" rx="2" />
      <rect x="3.5" y="15.5" width="7" height="5" rx="2" />
    </>
  ),
  revenue: (
    <>
      <path d="M3.5 17.5 9 12l3.5 3.5 8-8" />
      <path d="M15 7.5h5.5V13" />
    </>
  ),
  channels: (
    <>
      <path d="M12 3.5a8.5 8.5 0 1 0 8.5 8.5H12Z" />
      <path d="M15 3.9A8.5 8.5 0 0 1 20.1 9H15Z" />
    </>
  ),
  orders: (
    <>
      <path d="M6 3.5h12a1.5 1.5 0 0 1 1.5 1.5v15.5l-3-2-2.5 2-2.5-2-2.5 2-2.5-2-2 2V5A1.5 1.5 0 0 1 6 3.5Z" />
      <path d="M8.5 8.5h7M8.5 12h7M8.5 15.5h4" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-4.2-4.2" />
    </>
  ),
  download: (
    <>
      <path d="M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5" />
      <path d="M5 19.5h14" />
    </>
  ),
  arrowUp: <path d="M7 17 17 7M9 7h8v8" />,
  arrowDown: <path d="M7 7l10 10M17 9v8H9" />,
  flat: <path d="M5 12h14" />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  returned: (
    <>
      <path d="M9 14 4.5 9.5 9 5" />
      <path d="M4.5 9.5H14a5.5 5.5 0 0 1 0 11h-3" />
    </>
  ),
  cancelled: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m9 9 6 6M15 9l-6 6" />
    </>
  ),
  chevronDown: <path d="m6.5 9.5 5.5 5.5 5.5-5.5" />,
  chevronLeft: <path d="m14.5 6-6 6 6 6" />,
  chevronRight: <path d="m9.5 6 6 6-6 6" />,
  target: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="0.8" />
    </>
  ),
  wallet: (
    <>
      <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H17v3" />
      <rect x="4" y="8" width="16" height="11.5" rx="2.5" />
      <path d="M16 13.75h1.5" />
    </>
  ),
  bag: (
    <>
      <path d="M5.5 8h13l-1 12h-11Z" />
      <path d="M9 10V7a3 3 0 0 1 6 0v3" />
    </>
  ),
  basket: (
    <>
      <path d="M3.5 9.5h17l-1.8 9a1.5 1.5 0 0 1-1.5 1.2H6.8a1.5 1.5 0 0 1-1.5-1.2Z" />
      <path d="m8 9.5 3-5.5M16 9.5l-3-5.5M9.5 13v3.5M14.5 13v3.5" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8.5" r="3.5" />
      <path d="M3.5 19.5a5.5 5.5 0 0 1 11 0" />
      <path d="M15.5 5.3a3.5 3.5 0 0 1 0 6.4M17.5 14.4a5.5 5.5 0 0 1 3 5.1" />
    </>
  ),
  box: (
    <>
      <path d="M12 3.5 20 7.5v9L12 20.5 4 16.5v-9Z" />
      <path d="m4 7.5 8 4 8-4M12 11.5v9" />
    </>
  ),
  activity: <path d="M3.5 12h4l2.5-6.5 4 13 2.5-6.5h4" />,
  grid: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="3" />
      <path d="M3.5 9.2h17M3.5 14.8h17M9.2 3.5v17M14.8 3.5v17" />
    </>
  ),
  layers: (
    <>
      <path d="m12 4 8.5 4.5L12 13 3.5 8.5Z" />
      <path d="m3.5 12.5 8.5 4.5 8.5-4.5M3.5 16.5 12 21l8.5-4.5" />
    </>
  ),
  reset: (
    <>
      <path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3" />
      <path d="M4.5 4.5v4h4" />
    </>
  ),
  table: (
    <>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
      <path d="M3.5 9.5h17M9.5 9.5v10" />
    </>
  ),
  sparkle: <path d="M12 3.5c.6 4.4 2.1 5.9 6.5 6.5-4.4.6-5.9 2.1-6.5 6.5-.6-4.4-2.1-5.9-6.5-6.5 4.4-.6 5.9-2.1 6.5-6.5Z" />,
  close: <path d="m6.5 6.5 11 11M17.5 6.5l-11 11" />,
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof PATHS;

interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
}

export function Icon({ name, size = 18, className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {PATHS[name]}
    </svg>
  );
}
