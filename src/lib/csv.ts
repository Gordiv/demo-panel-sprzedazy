import type { Order } from '../data/types';

export const CSV_SEPARATOR = ';';
/** Excel needs a byte order mark to open UTF-8 files with Polish letters correctly. */
export const UTF8_BOM = '﻿';

/**
 * Quotes a field when it holds the separator, a quote, a line break or
 * surrounding spaces. Inner quotes are doubled (RFC 4180).
 */
export function escapeCsvField(value: string, separator = CSV_SEPARATOR): string {
  const needsQuotes =
    value.includes(separator) ||
    value.includes('"') ||
    value.includes('\n') ||
    value.includes('\r') ||
    value !== value.trim();
  return needsQuotes ? `"${value.replace(/"/g, '""')}"` : value;
}

/**
 * Text cells starting with =, +, -, @ could run as formulas in a spreadsheet,
 * so they get a leading apostrophe.
 */
export function protectFormula(value: string): string {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

export function toCsv(rows: ReadonlyArray<ReadonlyArray<string>>, separator = CSV_SEPARATOR): string {
  return rows.map((row) => row.map((cell) => escapeCsvField(cell, separator)).join(separator)).join('\r\n');
}

/** Plain decimal with a comma and no thousands separator, so Excel reads it as a number. */
export function formatCsvAmount(value: number): string {
  return value.toFixed(2).replace('.', ',');
}

/** "2026-03-07" -> "07.03.2026" */
export function formatCsvDate(isoDate: string): string {
  const [y, m, d] = isoDate.split('-');
  return `${d}.${m}.${y}`;
}

export const ORDER_CSV_HEADER = [
  'Numer',
  'Data',
  'Godzina',
  'Klient',
  'Produkt',
  'Kategoria',
  'Kanał',
  'Kwota (zł)',
  'Status',
] as const;

export function ordersToCsv(orders: readonly Order[]): string {
  const rows = orders.map((o) => [
    protectFormula(o.id),
    formatCsvDate(o.date),
    o.time,
    protectFormula(o.client),
    protectFormula(o.product),
    protectFormula(o.category),
    protectFormula(o.channel),
    formatCsvAmount(o.amount),
    protectFormula(o.status),
  ]);
  return toCsv([[...ORDER_CSV_HEADER], ...rows]) + '\r\n';
}

/** Saves text as a UTF-8 CSV file with BOM through a temporary link. */
export function downloadCsv(fileName: string, content: string): void {
  const blob = new Blob([UTF8_BOM + content], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Give the browser a moment to start the download before freeing the URL.
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
