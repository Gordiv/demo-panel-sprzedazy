export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'panel-theme';

/** Storage can be blocked (private mode, strict settings), so every access is guarded. */
export function readStoredTheme(): Theme | null {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value === 'light' || value === 'dark' ? value : null;
  } catch {
    return null;
  }
}

export function storeTheme(theme: Theme): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // The choice simply will not survive a reload.
  }
}

/** Colours the SVG charts need as plain values (they mirror the CSS tokens). */
export interface ChartPalette {
  /** Channel slots in fixed order */
  series: readonly [string, string, string];
  lineFrom: string;
  lineTo: string;
  previous: string;
  grid: string;
  tick: string;
  dotFill: string;
  cursor: string;
}

export const CHART_PALETTES: Record<Theme, ChartPalette> = {
  light: {
    series: ['#6a4cf5', '#0891b2', '#d97706'],
    lineFrom: '#6a4cf5',
    lineTo: '#0891b2',
    previous: '#6b7196',
    grid: 'rgba(40, 46, 110, 0.12)',
    tick: '#454c72',
    dotFill: '#ffffff',
    cursor: 'rgba(60, 56, 160, 0.35)',
  },
  dark: {
    series: ['#9d8cff', '#3fd0f0', '#f5b84a'],
    lineFrom: '#a594ff',
    lineTo: '#4fd8f5',
    previous: '#9aa1cc',
    grid: 'rgba(200, 205, 255, 0.10)',
    tick: '#b9bfe6',
    dotFill: '#0d1030',
    cursor: 'rgba(200, 205, 255, 0.4)',
  },
};
