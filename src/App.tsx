import { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { flushSync } from 'react-dom';
import { MotionConfig } from 'motion/react';
import { ActivityFeed } from './components/ActivityFeed';
import { Background } from './components/Background';
import { CategoryChart } from './components/CategoryChart';
import { ChannelChart } from './components/ChannelChart';
import { Filters } from './components/Filters';
import { GoalRing } from './components/GoalRing';
import { Heatmap } from './components/Heatmap';
import { Icon } from './components/Icon';
import { KpiCard } from './components/KpiCard';
import { Leaderboard } from './components/Leaderboard';
import { ORDER_SEARCH_ID, OrdersTable } from './components/OrdersTable';
import { RevenueChart } from './components/RevenueChart';
import { LogoMark, Sidebar, type NavSection } from './components/Sidebar';
import { ThemeToggle } from './components/ThemeToggle';
import { Bento } from './components/Tile';
import { DATA_END_DATE, DATA_END_MONTH, generateOrders } from './data/generate';
import { PLAN_CATEGORY_MIX, PLAN_CHANNEL_MIX, monthlyPlan } from './data/plan';
import {
  bucketSeries,
  computeKpis,
  filterOrders,
  getPeriods,
  revenueByCategory,
  revenueByChannel,
  timeSeries,
  type Filters as FilterState,
} from './lib/aggregate';
import {
  formatCurrency,
  formatCurrencyWhole,
  formatDate,
  formatInteger,
  formatMonthShort,
  formatPercent,
} from './lib/format';
import { useActiveSection, useMediaQuery, usePrefersReducedMotion } from './lib/hooks';
import { goalProgress, kpiSparklines, monthlyGoals, recentOrders, salesHeatmap, topBy, type PlanInputs } from './lib/insights';
import { useMotionEnabled } from './lib/motion';
import { readStoredTheme, storeTheme, type Theme } from './lib/theme';

const ORDERS = generateOrders();
const PLAN: PlanInputs = { monthlyPlan, categoryMix: PLAN_CATEGORY_MIX, channelMix: PLAN_CHANNEL_MIX };
const DEFAULT_FILTERS: FilterState = { months: 12, category: 'all', channel: 'all' };

const SECTIONS: readonly NavSection[] = [
  { id: 'przeglad', label: 'Przegląd', icon: 'overview' },
  { id: 'przychody', label: 'Przychody', icon: 'revenue' },
  { id: 'kanaly', label: 'Kanały', icon: 'channels' },
  { id: 'zamowienia', label: 'Zamówienia', icon: 'orders' },
];
const SECTION_IDS = SECTIONS.map((s) => s.id);

function isTyping(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.getAttribute('role') === 'combobox')
  );
}

export default function App() {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [storedTheme, setStoredTheme] = useState<Theme | null>(() => readStoredTheme());
  const systemDark = useMediaQuery('(prefers-color-scheme: dark)');
  const theme: Theme = storedTheme ?? (systemDark ? 'dark' : 'light');
  const reducedMotion = usePrefersReducedMotion();
  const motionOn = useMotionEnabled();
  const active = useActiveSection(SECTION_IDS);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const toggleTheme = useCallback(() => {
    const next: Theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    const apply = () => {
      flushSync(() => setStoredTheme(next));
      document.documentElement.dataset.theme = next;
    };
    storeTheme(next);
    // Cross-fade the whole page between themes where the browser supports it.
    if (!reducedMotion && typeof document.startViewTransition === 'function') document.startViewTransition(apply);
    else apply();
  }, [reducedMotion]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || isTyping(e.target)) return;
      if (e.key === '/') {
        const input = document.getElementById(ORDER_SEARCH_ID);
        if (input instanceof HTMLInputElement) {
          e.preventDefault();
          input.scrollIntoView({ block: 'center', behavior: reducedMotion ? 'auto' : 'smooth' });
          input.focus({ preventScroll: true });
        }
      } else if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        toggleTheme();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggleTheme, reducedMotion]);

  // Controls update at once; the heavy recalculation and chart re-render follow as an interruptible update.
  const shown = useDeferredValue(filters);

  const periods = useMemo(() => getPeriods(DATA_END_MONTH, shown.months), [shown.months]);

  const view = useMemo(() => {
    const current = filterOrders(ORDERS, shown, periods.current);
    const previous = filterOrders(ORDERS, shown, periods.previous);
    const kpis = computeKpis(current, previous);
    const goals = monthlyGoals(current, periods.current, shown, PLAN);
    return {
      current,
      previousCount: previous.length,
      kpis,
      spark: kpiSparklines(bucketSeries(current, periods.current, shown.months <= 6 ? 'week' : 'month')),
      heroGranularity: shown.months <= 3 ? ('week' as const) : ('month' as const),
      series: timeSeries(current, previous, periods, shown.months <= 3 ? 'week' : 'month'),
      goal: goalProgress(
        kpis.revenue.current ?? 0,
        goals.reduce((s, g) => s + g.target, 0),
      ),
      goals,
      categories: revenueByCategory(current),
      channels: revenueByChannel(current),
      heatmap: salesHeatmap(current),
      topClients: topBy(current, (o) => o.client, 5),
      topProducts: topBy(current, (o) => o.product, 5, (o) => o.category),
      recent: recentOrders(current, 6),
    };
  }, [shown, periods]);

  const { kpis } = view;
  const isDefault =
    filters.months === DEFAULT_FILTERS.months &&
    filters.category === DEFAULT_FILTERS.category &&
    filters.channel === DEFAULT_FILTERS.channel;
  const segment = [shown.category === 'all' ? null : shown.category, shown.channel === 'all' ? null : shown.channel]
    .filter(Boolean)
    .join(' · ');

  return (
    <MotionConfig reducedMotion="user">
      <Background />
      <a className="skip-link" href="#main">
        Przejdź do treści
      </a>
      <Sidebar sections={SECTIONS} active={active} />

      <div className="shell">
        <header className="topbar glass-bar">
          <div className="topbar__brand">
            <span className="topbar__logo">
              <LogoMark size={34} />
            </span>
            <div>
              <h1 className="topbar__title">Panel sprzedaży</h1>
              <p className="topbar__subtitle">Demo: analityka zamówień (dane przykładowe)</p>
            </div>
          </div>
          <Filters value={filters} onChange={setFilters} onReset={() => setFilters(DEFAULT_FILTERS)} isDefault={isDefault} />
          <div className="topbar__actions">
            <p className="shortcuts" aria-hidden="true">
              <kbd>/</kbd> szukaj <kbd>T</kbd> motyw
            </p>
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
          </div>
        </header>

        <main id="main" className="main" tabIndex={-1}>
          <section id="przeglad" className="dash-section" aria-labelledby="przeglad-title" tabIndex={-1}>
            <div className="section-head">
              <div>
                <p className="badge-demo">
                  <Icon name="sparkle" size={13} /> Dane przykładowe
                </p>
                <h2 id="przeglad-title" className="section-title">
                  Przegląd{segment ? <span className="section-title__segment"> · {segment}</span> : null}
                </h2>
              </div>
              <p className="section-meta">
                <span>
                  <Icon name="overview" size={14} /> {formatMonthShort(periods.current.start)} – {formatMonthShort(periods.current.end)}
                </span>
                <span>
                  porównanie: {formatMonthShort(periods.previous.start)} – {formatMonthShort(periods.previous.end)}
                </span>
                <span>dane do {formatDate(DATA_END_DATE)}</span>
              </p>
            </div>
            <Bento>
              <KpiCard
                id="kpi-revenue"
                className="span-3"
                label="Przychód"
                icon="wallet"
                value={kpis.revenue.current}
                format={formatCurrencyWhole}
                delta={kpis.revenue.delta}
                previous={formatCurrencyWhole(kpis.revenue.previous)}
                trend={view.spark.revenue}
                color="var(--series-1)"
              />
              <KpiCard
                id="kpi-orders"
                className="span-3"
                label="Liczba zamówień"
                icon="bag"
                value={kpis.orders.current}
                format={formatInteger}
                delta={kpis.orders.delta}
                previous={formatInteger(kpis.orders.previous)}
                trend={view.spark.orders}
                color="var(--series-2)"
              />
              <KpiCard
                id="kpi-aov"
                className="span-3"
                label="Średnia wartość zamówienia"
                shortLabel="Śr. wartość zamówienia"
                icon="basket"
                value={kpis.averageOrderValue.current}
                format={formatCurrency}
                delta={kpis.averageOrderValue.delta}
                previous={formatCurrency(kpis.averageOrderValue.previous)}
                trend={view.spark.averageOrderValue}
                color="var(--series-3)"
              />
              <KpiCard
                id="kpi-returns"
                className="span-3"
                label="Zwroty"
                icon="returned"
                value={kpis.returnRate.current}
                format={formatPercent}
                delta={kpis.returnRate.delta}
                previous={formatPercent(kpis.returnRate.previous)}
                trend={view.spark.returnRate}
                color="var(--series-4)"
                note="mniej = lepiej"
              />
              <RevenueChart
                className="span-8"
                data={view.series}
                granularity={view.heroGranularity}
                total={kpis.revenue.current ?? 0}
                delta={kpis.revenue.delta}
                theme={theme}
                animate={motionOn}
                hasPrevious={view.previousCount > 0}
              />
              <GoalRing className="span-4" goal={view.goal} months={view.goals} filtered={!!segment} />
            </Bento>
            <p className="footnote">
              Przychód i średnia wartość nie obejmują zamówień zwróconych ani anulowanych. Zwroty to odsetek wszystkich
              zamówień w okresie. Plan dla kategorii lub kanału wynika z założonego udziału w planie całego sklepu.
            </p>
          </section>

          <section id="przychody" className="dash-section" aria-labelledby="przychody-title" tabIndex={-1}>
            <div className="section-head">
              <h2 id="przychody-title" className="section-title">
                Przychody
              </h2>
              <p className="section-meta">Struktura sprzedaży w wybranym okresie</p>
            </div>
            <Bento>
              <CategoryChart className="span-7" data={view.categories} />
              <Leaderboard
                id="top-products-title"
                className="span-5"
                title="Top 5 produktów"
                subtitle="Według przychodu"
                icon="box"
                items={view.topProducts}
                total={kpis.revenue.current ?? 0}
              />
            </Bento>
          </section>

          <section id="kanaly" className="dash-section" aria-labelledby="kanaly-title" tabIndex={-1}>
            <div className="section-head">
              <h2 id="kanaly-title" className="section-title">
                Kanały i pory zakupów
              </h2>
              <p className="section-meta">Gdzie i kiedy klienci składają zamówienia</p>
            </div>
            <Bento>
              <ChannelChart className="span-5" data={view.channels} />
              <Heatmap className="span-7" data={view.heatmap} />
            </Bento>
          </section>

          <section id="zamowienia" className="dash-section" aria-labelledby="zamowienia-title" tabIndex={-1}>
            <div className="section-head">
              <h2 id="zamowienia-title" className="section-title">
                Zamówienia
              </h2>
              <p className="section-meta">Klienci, najnowsze zamówienia i pełna lista z eksportem</p>
            </div>
            <Bento>
              <Leaderboard
                id="top-clients-title"
                className="span-5"
                title="Top 5 klientów"
                subtitle="Według przychodu w okresie"
                icon="users"
                items={view.topClients}
                total={kpis.revenue.current ?? 0}
              />
              <ActivityFeed className="span-7" orders={view.recent} today={DATA_END_DATE} />
              <OrdersTable
                className="span-12"
                orders={view.current}
                periodLabel={`${periods.current.start}_${periods.current.end}`}
              />
            </Bento>
          </section>
        </main>

        <footer className="site-footer">
          <p>
            Projekt demonstracyjny. Wszystkie zamówienia, klienci i kwoty są fikcyjne i powstają w przeglądarce z
            ustalonego ziarna losowania, bez połączenia z serwerem.
          </p>
          <p>© 2026 Gordiv · Licencja MIT</p>
        </footer>
      </div>
    </MotionConfig>
  );
}
