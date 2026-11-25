# Panel sprzedaży

Demo dashboardu analityki zamówień w stylu aplikacji fintech: półprzezroczyste „szklane” kafelki na
animowanym tle, wykresy, ranking klientów i produktów, mapa godzin zakupów oraz pełna lista zamówień
z eksportem. Całość działa w przeglądarce, bez serwera i bez zewnętrznych zasobów (font jest dołączony lokalnie).

> Wszystkie dane są fikcyjne: około 400 zamówień z ostatnich 12 miesięcy (plus rok wcześniej do porównań),
> z produktami, godzinami zakupów, stałymi klientami i planem sprzedaży. Powstają w kodzie z ustalonego
> ziarna losowania, więc każdy widzi te same liczby.

## Funkcje

- **Filtry** w górnym pasku: okres (3 / 6 / 12 miesięcy) jako przełącznik z animowanym wskaźnikiem,
  kategoria i kanał jako własne listy wyboru (obsługa klawiatury: strzałki, Enter, Esc, wpisywanie liter).
  Filtry działają na wszystkie widżety.
- **4 wskaźniki (KPI)** z licznikiem animowanym od poprzedniej wartości, mini wykresem trendu
  i zmianą względem poprzedniego okresu tej samej długości (strzałka, kolor i tekst).
- **Przychód w czasie**: linia z gradientem i poświatą, linia poprzedniego okresu, celownik i szklany
  dymek; nagłówek kafelka pokazuje wartość przedziału pod kursorem.
- **Realizacja planu**: pierścień „% celu”, plan, wykonanie i różnica oraz słupki plan/wykonanie dla
  każdego miesiąca. Dla kategorii lub kanału plan wynika z założonego udziału w planie sklepu.
- **Przychód według kategorii** (ranking z udziałami), **Top 5 produktów** i **Top 5 klientów**.
- **Kanały sprzedaży**: wykres pierścieniowy z sumą w środku; najechanie na legendę lub fragment
  wyróżnia kanał i przygasza pozostałe.
- **Kiedy klienci kupują**: mapa dzień tygodnia × godzina z dymkiem i wskazaniem szczytu.
- **Ostatnia aktywność**: oś czasu najnowszych zamówień z ikonami statusów.
- **Lista zamówień**: wyszukiwanie po kliencie lub numerze (z opóźnieniem, działa też bez polskich znaków),
  sortowanie, stronicowanie po 8 pozycji, statusy z ikoną i tekstem, pusty stan z ilustracją.
- **Eksport CSV** przefiltrowanych zamówień: UTF-8 z BOM, separator `;`, gotowy do otwarcia w polskim Excelu.
- **Motyw jasny i ciemny** (domyślnie według systemu, wybór zapamiętany) z płynnym przejściem.
- **Skróty klawiszowe**: `/` przechodzi do wyszukiwania, `T` przełącza motyw.
- **Nawigacja**: boczny pasek z sekcjami (na telefonie pływający pasek na dole), aktywna sekcja
  podświetla się podczas przewijania.
- **Responsywność** od 360 px do ekranów 1920 px i szerszych.
- **Dostępność**: landmarki, kolejność nagłówków, `aria-sort`, `aria-live` dla liczby wyników, podpisy
  tabel, „Pokaż dane w tabeli” pod każdym wykresem, widoczny fokus, kontrast min. 4,5:1 także w najgorszym
  miejscu tła, znaczenie nigdy nie tylko kolorem, `prefers-reduced-motion` (animacje zamieniają się w
  natychmiastowe zmiany lub krótkie przenikanie).
- **Płynność**: efekt szkła bez kosztownego rozmycia tła, animacje oparte na `transform` i `opacity`,
  tło zatrzymuje się na czas przewijania, a poświata za kursorem przesuwa jedną warstwę bez
  przerysowywania kafelka. Liczniki zapisują tekst bez przerysowywania całego widoku, a zmiana filtrów
  odświeża widok w dwóch krótkich krokach zamiast jednego długiego.

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

React 19, TypeScript (tryb ścisły), Vite, Recharts, Motion, Vitest, font Inter (OFL) dołączony lokalnie.
Bez bibliotek komponentów UI.

## Struktura

```
src/
  data/              dane przykładowe: katalog produktów, generator zamówień, plan sprzedaży
  lib/aggregate.ts   filtrowanie, porównanie okresów, przedziały tygodniowe i miesięczne, podziały, KPI
  lib/insights.ts    trendy KPI, realizacja planu, mapa godzin, rankingi, ostatnie zamówienia
  lib/animation.ts   funkcje wygładzania dla liczników
  lib/geometry.ts    ścieżki mini wykresów i łuki wykresu pierścieniowego
  lib/format.ts      formatowanie pl-PL
  lib/csv.ts         eksport CSV
  components/        kafelki i widżety (KpiCard, RevenueChart, GoalRing, CategoryChart, ChannelChart,
                     Heatmap, Leaderboard, ActivityFeed, OrdersTable, Filters, Select, ThemeToggle, Sidebar)
```

## Licencja

MIT, © 2026 Gordiv

---

*English: a fintech-style sales analytics dashboard demo (React, TypeScript, Vite, Recharts, Motion) with glass
tiles, animated widgets, goal tracking, a sales heatmap, leaderboards and a searchable orders table with CSV
export, running fully in the browser on deterministic sample data.*
