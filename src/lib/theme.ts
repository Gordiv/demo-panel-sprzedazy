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

export interface ChartPalette {
  /** Categorical slots, assigned in fixed order */
  series: readonly [string, string, string];
  accent: string;
  previous: string;
  grid: string;
  axis: string;
  tick: string;
  surface: string;
  cursor: string;
}

export const CHART_PALETTES: Record<Theme, ChartPalette> = {
  light: {
    series: ['#2a78d6', '#eb6834', '#1baf7a'],
    accent: '#2a78d6',
    previous: '#7a828e',
    grid: '#e6e8ec',
    axis: '#c9cdd4',
    tick: '#4a5260',
    surface: '#ffffff',
    cursor: '#d5d9df',
  },
  dark: {
    series: ['#3987e5', '#d95926', '#199e70'],
    accent: '#5b9cec',
    previous: '#8d96a3',
    grid: '#272d35',
    axis: '#3a414b',
    tick: '#b3bac5',
    surface: '#171b21',
    cursor: '#3a414b',
  },
};
