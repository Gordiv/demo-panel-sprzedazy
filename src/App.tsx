import { useEffect, useMemo, useState } from 'react';
import { CategoryChart } from './components/CategoryChart';
import { ChannelChart } from './components/ChannelChart';
import { Filters } from './components/Filters';
import { KpiCard } from './components/KpiCard';
import { OrdersTable } from './components/OrdersTable';
import { RevenueChart } from './components/RevenueChart';
import { ThemeToggle } from './components/ThemeToggle';
import { DATA_END_DATE, DATA_END_MONTH, generateOrders } from './data/generate';
import {
  computeKpis,
  filterOrders,
  getPeriods,
  monthlySeries,
  revenueByCategory,
  revenueByChannel,
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
import { useMediaQuery, usePrefersReducedMotion } from './lib/hooks';
import { readStoredTheme, storeTheme, type Theme } from './lib/theme';

const ORDERS = generateOrders();

const DEFAULT_FILTERS: FilterState = { months: 12, category: 'all', channel: 'all' };

export default function App() {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [storedTheme, setStoredTheme] = useState<Theme | null>(() => readStoredTheme());
  const systemDark = useMediaQuery('(prefers-color-scheme: dark)');
  const theme: Theme = storedTheme ?? (systemDark ? 'dark' : 'light');
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const changeTheme = (next: Theme) => {
    setStoredTheme(next);
    storeTheme(next);
  };

  const periods = useMemo(() => getPeriods(DATA_END_MONTH, filters.months), [filters.months]);

  const view = useMemo(() => {
    const current = filterOrders(ORDERS, filters, periods.current);
    const previous = filterOrders(ORDERS, filters, periods.previous);
    return {
      current,
      previousCount: previous.length,
      kpis: computeKpis(current, previous),
      monthly: monthlySeries(current, previous, periods),
      categories: revenueByCategory(current),
      channels: revenueByChannel(current),
    };
  }, [filters, periods]);

  const { kpis } = view;
  const isDefault =
    filters.months === DEFAULT_FILTERS.months &&
    filters.category === DEFAULT_FILTERS.category &&
    filters.channel === DEFAULT_FILTERS.channel;

  const currentLabel = `${formatMonthShort(periods.current.start)} – ${formatMonthShort(periods.current.end)}`;
  const previousLabel = `${formatMonthShort(periods.previous.start)} – ${formatMonthShort(periods.previous.end)}`;

  return (
    <>
      <a className="skip-link" href="#main">
        Przejdź do treści
      </a>
      <header className="site-header">
        <div className="container site-header__inner">
          <div>
            <h1 className="site-title">Panel sprzedaży</h1>
            <p className="site-subtitle">Demo: analityka zamówień (dane przykładowe)</p>
          </div>
          <ThemeToggle theme={theme} onChange={changeTheme} />
        </div>
      </header>

      <main id="main" className="container main" tabIndex={-1}>
        <section className="toolbar card" aria-labelledby="filters-title">
          <h2 id="filters-title" className="sr-only">
            Filtry
          </h2>
          <Filters
            value={filters}
            onChange={setFilters}
            onReset={() => setFilters(DEFAULT_FILTERS)}
            isDefault={isDefault}
          />
          <p className="toolbar__period">
            <span>
              Okres: <strong>{currentLabel}</strong>
            </span>
            <span>
              Porównanie z: <strong>{previousLabel}</strong>
            </span>
            <span>Dane do {formatDate(DATA_END_DATE)}</span>
          </p>
        </section>

        <section aria-labelledby="kpi-title">
          <h2 id="kpi-title" className="section-title">
            Kluczowe wskaźniki
          </h2>
          <div className="kpi-grid">
            <KpiCard
              label="Przychód"
              value={formatCurrencyWhole(kpis.revenue.current)}
              delta={kpis.revenue.delta}
              previous={formatCurrencyWhole(kpis.revenue.previous)}
            />
            <KpiCard
              label="Liczba zamówień"
              value={formatInteger(kpis.orders.current)}
              delta={kpis.orders.delta}
              previous={formatInteger(kpis.orders.previous)}
            />
            <KpiCard
              label="Średnia wartość zamówienia"
              value={formatCurrency(kpis.averageOrderValue.current)}
              delta={kpis.averageOrderValue.delta}
              previous={formatCurrency(kpis.averageOrderValue.previous)}
            />
            <KpiCard
              label="Zwroty"
              value={formatPercent(kpis.returnRate.current)}
              delta={kpis.returnRate.delta}
              previous={formatPercent(kpis.returnRate.previous)}
              note="mniej = lepiej"
            />
          </div>
          <p className="footnote">
            Przychód i średnia wartość nie obejmują zamówień zwróconych ani anulowanych. Zwroty to odsetek
            wszystkich zamówień w okresie.
          </p>
        </section>

        <div className="charts">
          <RevenueChart
            data={view.monthly}
            theme={theme}
            animate={!reducedMotion}
            hasPrevious={view.previousCount > 0}
          />
          <div className="charts__row">
            <CategoryChart data={view.categories} theme={theme} animate={!reducedMotion} />
            <ChannelChart data={view.channels} theme={theme} animate={!reducedMotion} />
          </div>
        </div>

        <OrdersTable
          orders={view.current}
          periodLabel={`${periods.current.start}_${periods.current.end}`}
        />
      </main>

      <footer className="site-footer">
        <div className="container">
          <p>
            Projekt demonstracyjny. Wszystkie zamówienia, klienci i kwoty są fikcyjne i powstają w
            przeglądarce z ustalonego ziarna losowania, bez połączenia z serwerem.
          </p>
          <p>© 2026 Gordiv · Licencja MIT</p>
        </div>
      </footer>
    </>
  );
}
