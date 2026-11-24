import { Icon } from './Icon';

interface ChartTableProps {
  caption: string;
  columns: readonly string[];
  rows: ReadonlyArray<ReadonlyArray<string>>;
}

/** The numbers behind a chart, for keyboard and screen reader users (and anyone who prefers a table). */
export function ChartTable({ caption, columns, rows }: ChartTableProps) {
  return (
    <details className="chart-table">
      <summary>
        <Icon name="table" size={15} />
        Pokaż dane w tabeli
      </summary>
      <div className="chart-table__scroll">
        <table className="data-table data-table--compact">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr>
              {columns.map((c, i) => (
                <th key={c} scope="col" className={i > 0 ? 'num-cell' : undefined}>
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row[0]}>
                {row.map((cell, i) =>
                  i === 0 ? (
                    <th key={i} scope="row">
                      {cell}
                    </th>
                  ) : (
                    <td key={i} className="num-cell num">
                      {cell}
                    </td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
