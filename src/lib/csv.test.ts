import { describe, expect, it } from 'vitest';
import type { Order } from '../data/types';
import {
  escapeCsvField,
  formatCsvAmount,
  formatCsvDate,
  ordersToCsv,
  protectFormula,
  toCsv,
} from './csv';

describe('escapeCsvField', () => {
  it('leaves plain values alone', () => {
    expect(escapeCsvField('Anna Nowak')).toBe('Anna Nowak');
    expect(escapeCsvField('')).toBe('');
  });

  it('quotes values with the separator', () => {
    expect(escapeCsvField('Dom; ogród')).toBe('"Dom; ogród"');
  });

  it('doubles inner quotes', () => {
    expect(escapeCsvField('Sklep "Pod Lipą"')).toBe('"Sklep ""Pod Lipą"""');
  });

  it('quotes line breaks', () => {
    expect(escapeCsvField('linia 1\nlinia 2')).toBe('"linia 1\nlinia 2"');
    expect(escapeCsvField('a\r\nb')).toBe('"a\r\nb"');
  });

  it('quotes leading or trailing spaces so they survive', () => {
    expect(escapeCsvField(' x')).toBe('" x"');
  });

  it('does not quote a comma when the separator is a semicolon', () => {
    expect(escapeCsvField('1234,56')).toBe('1234,56');
    expect(escapeCsvField('1234,56', ',')).toBe('"1234,56"');
  });
});

describe('protectFormula', () => {
  it('neutralizes values that a spreadsheet would run as formulas', () => {
    expect(protectFormula('=SUM(A1:A2)')).toBe("'=SUM(A1:A2)");
    expect(protectFormula('+48 600')).toBe("'+48 600");
    expect(protectFormula('@cmd')).toBe("'@cmd");
    expect(protectFormula('Anna')).toBe('Anna');
  });
});

describe('toCsv', () => {
  it('joins with semicolons and CRLF', () => {
    expect(
      toCsv([
        ['a', 'b;c'],
        ['"q"', 'd'],
      ]),
    ).toBe('a;"b;c"\r\n"""q""";d');
  });
});

describe('ordersToCsv', () => {
  const orders: Order[] = [
    {
      id: 'ZAM-2026-00123',
      date: '2026-03-07',
      client: 'Jan "Janek" Kowalski; ',
      category: 'Dom i ogród',
      channel: 'Sklep online',
      amount: 1234.5,
      status: 'Zwrócone',
    },
  ];

  it('writes a Polish header and Excel-friendly values', () => {
    const csv = ordersToCsv(orders);
    const lines = csv.split('\r\n');
    expect(lines[0]).toBe('Numer;Data;Klient;Kategoria;Kanał;Kwota (zł);Status');
    expect(lines[1]).toBe('ZAM-2026-00123;07.03.2026;"Jan ""Janek"" Kowalski; ";Dom i ogród;Sklep online;1234,50;Zwrócone');
    expect(csv.endsWith('\r\n')).toBe(true);
  });

  it('formats amounts and dates without locale surprises', () => {
    expect(formatCsvAmount(0.1 + 0.2)).toBe('0,30');
    expect(formatCsvAmount(12345)).toBe('12345,00');
    expect(formatCsvDate('2025-12-01')).toBe('01.12.2025');
  });

  it('writes only the header for an empty list', () => {
    expect(ordersToCsv([])).toBe('Numer;Data;Klient;Kategoria;Kanał;Kwota (zł);Status\r\n');
  });
});
