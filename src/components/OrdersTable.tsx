import { useEffect, useId, useMemo, useState } from 'react';
import type { Order, OrderStatus } from '../data/types';
import { paginate, searchOrders, sortOrders, type SortDirection, type SortKey } from '../lib/aggregate';
import { downloadCsv, ordersToCsv } from '../lib/csv';
import { formatCurrency, formatDate, formatInteger, formatOrderCount } from '../lib/format';
import { useDebouncedValue } from '../lib/hooks';

const PAGE_SIZE = 8;
const SEARCH_DELAY_MS = 250;

interface Column {
  key: SortKey;
  label: string;
  numeric?: boolean;
}

const COLUMNS: readonly Column[] = [
  { key: 'id', label: 'Numer' },
  { key: 'date', label: 'Data' },
  { key: 'client', label: 'Klient' },
  { key: 'category', label: 'Kategoria' },
  { key: 'channel', label: 'Kanał' },
  { key: 'amount', label: 'Kwota', numeric: true },
  { key: 'status', label: 'Status' },
];

const STATUS_CLASS: Record<OrderStatus, string> = {
  Zrealizowane: 'badge--done',
  'W realizacji': 'badge--progress',
  Zwrócone: 'badge--returned',
  Anulowane: 'badge--cancelled',
};

interface OrdersTableProps {
  orders: readonly Order[];
  /** Used in the CSV file name, e.g. "2025-11_2026-10" */
  periodLabel: string;
}

export function OrdersTable({ orders, periodLabel }: OrdersTableProps) {
  const searchId = useId();
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, SEARCH_DELAY_MS);
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');
  const [page, setPage] = useState(1);

  const results = useMemo(
    () => sortOrders(searchOrders(orders, debouncedQuery), sortKey, sortDir),
    [orders, debouncedQuery, sortKey, sortDir],
  );

  // Any change to what is listed starts again from the first page.
  useEffect(() => setPage(1), [orders, debouncedQuery, sortKey, sortDir]);

  const current = paginate(results, page, PAGE_SIZE);

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir(key === 'date' || key === 'amount' ? 'desc' : 'asc');
    }
  };

  const exportCsv = () => {
    downloadCsv(`zamowienia_${periodLabel}.csv`, ordersToCsv(results));
  };

  const sortName = COLUMNS.find((c) => c.key === sortKey)?.label.toLowerCase() ?? '';
  const isSearching = debouncedQuery.trim().length > 0;

  return (
    <section className="card orders" aria-labelledby="orders-title">
      <header className="card__header orders__header">
        <div>
          <h2 id="orders-title" className="card__title">
            Zamówienia
          </h2>
          <p className="card__subtitle">
            {formatOrderCount(orders.length)} w wybranym okresie
          </p>
        </div>
        <div className="orders__tools">
          <div className="search">
            <label htmlFor={searchId} className="sr-only">
              Szukaj po kliencie lub numerze zamówienia
            </label>
            <svg className="search__icon" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
              <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
              <path d="m20 20-4.2-4.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              id={searchId}
              type="search"
              className="input search__input"
              placeholder="Klient lub numer zamówienia"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
          </div>
          <button
            type="button"
            className="btn btn--primary"
            onClick={exportCsv}
            disabled={results.length === 0}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
              <path
                d="M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M5 19h14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Eksportuj CSV
            <span className="sr-only"> ({formatOrderCount(results.length)})</span>
          </button>
        </div>
      </header>

      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {isSearching
          ? `Znaleziono ${formatOrderCount(results.length)}`
          : `Lista zawiera ${formatOrderCount(results.length)}`}
      </p>

      <div className="table-scroll" role="region" aria-labelledby="orders-title" tabIndex={0}>
        <table className="data-table orders__table">
          <caption className="sr-only">
            Lista zamówień w wybranym okresie, posortowana według kolumny {sortName},{' '}
            {sortDir === 'asc' ? 'rosnąco' : 'malejąco'}
          </caption>
          <thead>
            <tr>
              {COLUMNS.map((col) => {
                const active = col.key === sortKey;
                const ariaSort = active ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none';
                return (
                  <th
                    key={col.key}
                    scope="col"
                    aria-sort={ariaSort}
                    className={`${col.numeric ? 'num-cell' : ''} ${col.key === 'id' ? 'sticky-col' : ''}`.trim() || undefined}
                  >
                    <button type="button" className="sort-btn" onClick={() => toggleSort(col.key)}>
                      {col.label}
                      <span className={`sort-btn__icon${active ? ' is-active' : ''}`} aria-hidden="true">
                        {active ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
                      </span>
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {current.items.length === 0 ? (
              <tr>
                <td colSpan={COLUMNS.length} className="table-empty">
                  <p className="table-empty__title">Brak zamówień dla wybranych filtrów</p>
                  <p className="table-empty__hint">
                    {isSearching
                      ? 'Spróbuj innej frazy albo wyczyść wyszukiwanie.'
                      : 'Zmień okres, kategorię lub kanał sprzedaży.'}
                  </p>
                  {isSearching ? (
                    <button type="button" className="btn btn--ghost" onClick={() => setQuery('')}>
                      Wyczyść wyszukiwanie
                    </button>
                  ) : null}
                </td>
              </tr>
            ) : (
              current.items.map((o) => (
                <tr key={o.id}>
                  <th scope="row" className="sticky-col mono nowrap">
                    {o.id}
                  </th>
                  <td className="num nowrap">{formatDate(o.date)}</td>
                  <td className="nowrap">{o.client}</td>
                  <td className="nowrap">{o.category}</td>
                  <td className="nowrap">{o.channel}</td>
                  <td className="num num-cell nowrap">{formatCurrency(o.amount)}</td>
                  <td>
                    <span className={`badge ${STATUS_CLASS[o.status]}`}>
                      <span className="badge__dot" aria-hidden="true" />
                      {o.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <nav className="pagination" aria-label="Strony listy zamówień">
        <p className="pagination__info num">
          {current.total === 0
            ? 'Brak wyników'
            : `Pokazano ${formatInteger(current.from)}–${formatInteger(current.to)} z ${formatInteger(current.total)}`}
        </p>
        <div className="pagination__controls">
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => setPage(current.page - 1)}
            disabled={current.page <= 1}
          >
            <span aria-hidden="true">←</span> Poprzednia
          </button>
          <span className="pagination__page num">
            Strona {current.page} z {current.pageCount}
          </span>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => setPage(current.page + 1)}
            disabled={current.page >= current.pageCount}
          >
            Następna <span aria-hidden="true">→</span>
          </button>
        </div>
      </nav>
    </section>
  );
}
