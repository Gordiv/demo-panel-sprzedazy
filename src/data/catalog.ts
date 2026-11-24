import type { Category, Channel } from './types';

export interface Product {
  name: string;
  /** Typical shelf price in PLN */
  price: number;
}

export const PRODUCTS: Record<Category, readonly Product[]> = {
  Elektronika: [
    { name: 'Słuchawki bezprzewodowe', price: 399 },
    { name: 'Smartwatch', price: 899 },
    { name: 'Głośnik Bluetooth', price: 249 },
    { name: 'Czytnik e-booków', price: 549 },
    { name: 'Powerbank 20 000 mAh', price: 149 },
    { name: 'Klawiatura mechaniczna', price: 459 },
    { name: 'Monitor 27 cali', price: 1299 },
    { name: 'Router Wi-Fi 6', price: 389 },
  ],
  'Dom i ogród': [
    { name: 'Ekspres przelewowy', price: 329 },
    { name: 'Zestaw garnków', price: 459 },
    { name: 'Lampa stojąca', price: 279 },
    { name: 'Pościel bawełniana', price: 189 },
    { name: 'Odkurzacz pionowy', price: 999 },
    { name: 'Zestaw narzędzi ogrodowych', price: 219 },
    { name: 'Donica ceramiczna', price: 129 },
    { name: 'Koc z wełny', price: 249 },
  ],
  Moda: [
    { name: 'Kurtka przejściowa', price: 449 },
    { name: 'Sneakersy miejskie', price: 379 },
    { name: 'Sweter z merino', price: 299 },
    { name: 'Jeansy slim', price: 229 },
    { name: 'Plecak miejski', price: 199 },
    { name: 'Sukienka midi', price: 259 },
    { name: 'Szalik wełniany', price: 119 },
    { name: 'Koszula lniana', price: 189 },
  ],
  'Sport i rekreacja': [
    { name: 'Mata do jogi', price: 129 },
    { name: 'Hantle regulowane', price: 499 },
    { name: 'Rower treningowy', price: 1499 },
    { name: 'Buty do biegania', price: 449 },
    { name: 'Namiot 2-osobowy', price: 699 },
    { name: 'Kask rowerowy', price: 249 },
    { name: 'Zegarek sportowy', price: 799 },
    { name: 'Butelka termiczna', price: 89 },
  ],
  'Zdrowie i uroda': [
    { name: 'Krem nawilżający', price: 79 },
    { name: 'Szczoteczka soniczna', price: 349 },
    { name: 'Zestaw kosmetyków', price: 199 },
    { name: 'Suszarka do włosów', price: 299 },
    { name: 'Serum z witaminą C', price: 119 },
    { name: 'Perfumy 50 ml', price: 289 },
    { name: 'Olejek do ciała', price: 69 },
    { name: 'Suplement witaminowy', price: 59 },
  ],
};

/** Order frequency by hour (0-23); online peaks in the evening, the shop keeps opening hours. */
export const HOUR_WEIGHTS: Record<Channel, readonly number[]> = {
  'Sklep online': [1, 0.6, 0.3, 0.2, 0.2, 0.3, 0.6, 1.2, 2, 2.4, 2.6, 2.8, 3.4, 3.2, 2.8, 2.8, 3, 3.4, 4, 5, 5.6, 5.2, 3.6, 2],
  Marketplace: [1.2, 0.8, 0.4, 0.3, 0.3, 0.4, 0.8, 1.4, 2.2, 2.6, 2.8, 3, 3.2, 3, 2.9, 3, 3.1, 3.3, 3.8, 4.4, 4.6, 4.2, 3, 1.8],
  'Sklep stacjonarny': [0, 0, 0, 0, 0, 0, 0, 0, 0, 1.6, 2.4, 3, 3.2, 3, 3, 3.4, 4, 4.4, 3.8, 2.4, 0, 0, 0, 0],
};

/** Weekday weights, Monday first. Most Sundays are non-trading days for the physical shop. */
export const WEEKDAY_WEIGHTS: Record<Channel, readonly number[]> = {
  'Sklep online': [1.15, 1.05, 1, 1, 0.95, 0.85, 1.1],
  Marketplace: [1.05, 1, 1, 1, 1, 0.95, 1.05],
  'Sklep stacjonarny': [0.85, 0.9, 0.95, 1, 1.2, 1.45, 0.12],
};
