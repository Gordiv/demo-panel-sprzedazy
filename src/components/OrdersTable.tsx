import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { motion } from 'motion/react';
import { useMotionEnabled } from '../lib/motion';
import { Presence } from './Presence';
import type { Order } from '../data/types';
import { paginate, searchOrders, sortOrders, type SortDirection, type SortKey } from '../lib/aggregate';
import { downloadCsv, ordersToCsv } from '../lib/csv';
import { formatCurrency, formatDate, formatInteger, formatOrderCount } from '../lib/format';
import { useDebouncedValue } from '../lib/hooks';
import { EmptyState } from './EmptyState';
import { Icon } from './Icon';
import { StatusPill } from './StatusIcon';
import { Tile } from './Tile';

const PAGE_SIZE = 8;
const SEARCH_DELAY_MS = 250;
export const ORDER_SEARCH_ID = 'order-search';

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

interface OrdersTableProps {
  orders: readonly Order[];
  /** Used in the CSV file name, e.g. "2025-11_2026-10" */
  periodLabel: string;
  className?: string;
}

export function OrdersTable({ orders, periodLabel, className }: OrdersTableProps) {
  const animate = useMotionEnabled();
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
    <Tile className={`orders ${className ?? ''}`} labelledBy="orders-title">
      <header className="tile__header orders__header">
        <div className="tile__heading">
          <span className="tile__icon">
            <Icon name="orders" size={17} />
          </span>
          <div>
            <h3 id="orders-title" className="tile__title">
              Lista zamówień
            </h3>
            <p className="tile__subtitle">{formatOrderCount(orders.length)} w wybranym okresie</p>
          </div>
        </div>
        <div className="orders__tools">
          <div className="search">
            <label htmlFor={ORDER_SEARCH_ID} className="sr-only">
              Szukaj po kliencie lub numerze zamówienia
            </label>
            <Icon name="search" size={16} className="search__icon" />
            <input
              id={ORDER_SEARCH_ID}
              type="search"
              className="input search__input"
              placeholder="Klient lub numer zamówienia"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoComplete="off"
              spellCheck={false}
              aria-keyshortcuts="/"
            />
            <kbd className="search__kbd" aria-hidden="true">
              /
            </kbd>
          </div>
          <button type="button" className="btn btn--primary" onClick={exportCsv} disabled={results.length === 0}>
            <Icon name="download" size={16} />
            Eksportuj CSV
            <span className="sr-only"> ({formatOrderCount(results.length)})</span>
          </button>
        </div>
      </header>

      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {isSearching ? `Znaleziono ${formatOrderCount(results.length)}` : `Lista zawiera ${formatOrderCount(results.length)}`}
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
                const classes = [col.numeric ? 'num-cell' : '', col.key === 'id' ? 'sticky-col' : ''].join(' ').trim();
                return (
                  <th key={col.key} scope="col" aria-sort={ariaSort} className={classes || undefined}>
                    <button type="button" className={`sort-btn${active ? ' is-active' : ''}`} onClick={() => toggleSort(col.key)}>
                      {col.label}
                      <span className="sort-btn__icon" aria-hidden="true">
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
                  <EmptyState
                    title="Brak zamówień dla wybranych filtrów"
                    hint={
                      isSearching
                        ? 'Spróbuj innej frazy albo wyczyść wyszukiwanie.'
                        : 'Zmień okres, kategorię lub kanał sprzedaży.'
                    }
                    action={
                      isSearching ? (
                        <button type="button" className="btn btn--ghost" onClick={() => setQuery('')}>
                          Wyczyść wyszukiwanie
                        </button>
                      ) : null
                    }
                  />
                </td>
              </tr>
            ) : (
              <Presence enabled={animate}>
                {current.items.map((o, i) => (
                  <motion.tr
                    key={o.id}
                    className="row-in"
                    style={{ '--i': i } as CSSProperties}
                    layout={animate ? 'position' : false}
                    exit={{ opacity: 0, transition: { duration: 0.12 } }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <th scope="row" className="sticky-col mono nowrap">
                      {o.id}
                    </th>
                    <td className="nowrap">
                      <span className="num">{formatDate(o.date)}</span>
                      <span className="cell-sub num">{o.time}</span>
                    </td>
                    <td className="nowrap">
                      <span className="cell-main">{o.client}</span>
                      <span className="cell-sub">{o.product}</span>
                    </td>
                    <td className="nowrap">{o.category}</td>
                    <td className="nowrap">{o.channel}</td>
                    <td className="num num-cell nowrap cell-amount">{formatCurrency(o.amount)}</td>
                    <td>
                      <StatusPill status={o.status} />
                    </td>
                  </motion.tr>
                ))}
              </Presence>
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
            <Icon name="chevronLeft" size={16} /> Poprzednia
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
            Następna <Icon name="chevronRight" size={16} />
          </button>
        </div>
      </nav>
    </Tile>
  );
}
