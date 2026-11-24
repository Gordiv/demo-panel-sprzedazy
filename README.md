# Panel sprzedaży

Demo dashboardu analityki zamówień dla małego sklepu: przychód, liczba zamówień, średnia wartość koszyka
i zwroty, z porównaniem do poprzedniego okresu. Całość działa w przeglądarce, bez serwera i bez zewnętrznych
zasobów.

> Wszystkie dane są fikcyjne: około 400 zamówień z ostatnich 12 miesięcy (plus rok wcześniej do porównań)
> powstaje w kodzie z ustalonego ziarna losowania, więc każdy widzi te same liczby.

## Funkcje

- **Filtry**: okres (3 / 6 / 12 miesięcy), kategoria, kanał sprzedaży; działają na wszystko poniżej.
- **4 wskaźniki (KPI)** ze zmianą względem poprzedniego okresu tej samej długości (strzałka, kolor i tekst).
- **Wykresy** (Recharts): przychód miesięczny z linią poprzedniego okresu, przychód według kategorii,
  udział kanałów (wykres pierścieniowy z sumą w środku). Pod każdym wykresem dane w tabeli.
- **Tabela zamówień**: wyszukiwanie po kliencie lub numerze (z opóźnieniem, bez polskich znaków też działa),
  sortowanie kolumn, stronicowanie po 8 pozycji, pusty stan.
- **Eksport CSV** przefiltrowanych zamówień: UTF-8 z BOM, separator `;`, gotowy do otwarcia w polskim Excelu.
- **Motyw jasny i ciemny** (domyślnie według systemu, wybór zapamiętany w przeglądarce).
- **Responsywność** od 360 px do szerokich ekranów, **dostępność** (landmarki, nagłówki, `aria-sort`,
  `aria-live`, widoczny fokus, kontrast min. 4,5:1, `prefers-reduced-motion`).
- Formatowanie liczb, kwot i dat przez `Intl` (`pl-PL`).

## Uruchomienie

Wymagany Node.js 22.12 lub nowszy.

```bash
npm install
npm run dev      # serwer deweloperski
npm run build    # sprawdzenie typów i build do folderu docs/
npm run preview  # podgląd zbudowanej wersji
npm test         # testy jednostkowe (Vitest)
```

Folder `docs/` zawiera gotowy build (ścieżki względne), więc można go opublikować np. przez GitHub Pages
z gałęzi `main` i folderu `/docs`.

## Technologie

React 19, TypeScript (tryb ścisły), Vite, Recharts, Vitest. Bez bibliotek UI i bez zewnętrznych fontów.

## Struktura

```
src/
  data/generate.ts     dane przykładowe z ustalonego ziarna losowania
  lib/aggregate.ts     filtrowanie, porównanie okresów, serie miesięczne, podziały, KPI
  lib/format.ts        formatowanie pl-PL
  lib/csv.ts           eksport CSV
  components/          KpiCard, RevenueChart, CategoryChart, ChannelChart, OrdersTable, Filters, ThemeToggle
```

## Licencja

MIT, © 2026 Gordiv

---

*English: a sales analytics dashboard demo (React, TypeScript, Vite, Recharts) running fully in the browser on
deterministic sample data, with filters, KPIs, charts, a searchable orders table and CSV export.*
