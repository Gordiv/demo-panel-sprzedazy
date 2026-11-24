export const FIRST_NAMES_FEMALE = [
  'Anna', 'Maria', 'Katarzyna', 'Małgorzata', 'Agnieszka', 'Barbara', 'Ewa', 'Krystyna',
  'Magdalena', 'Joanna', 'Aleksandra', 'Monika', 'Zofia', 'Natalia', 'Karolina', 'Julia',
  'Marta', 'Dorota', 'Beata', 'Paulina', 'Weronika', 'Justyna', 'Iwona', 'Hanna',
] as const;

export const FIRST_NAMES_MALE = [
  'Piotr', 'Krzysztof', 'Andrzej', 'Tomasz', 'Paweł', 'Jan', 'Michał', 'Marcin',
  'Jakub', 'Adam', 'Łukasz', 'Mateusz', 'Marek', 'Grzegorz', 'Wojciech', 'Kamil',
  'Rafał', 'Bartosz', 'Dariusz', 'Szymon', 'Maciej', 'Robert', 'Filip', 'Kacper',
] as const;

/** [male form, female form]; many Polish surnames change with gender. */
export const SURNAMES: ReadonlyArray<readonly [string, string]> = [
  ['Nowak', 'Nowak'],
  ['Kowalski', 'Kowalska'],
  ['Wiśniewski', 'Wiśniewska'],
  ['Wójcik', 'Wójcik'],
  ['Kowalczyk', 'Kowalczyk'],
  ['Kamiński', 'Kamińska'],
  ['Lewandowski', 'Lewandowska'],
  ['Zieliński', 'Zielińska'],
  ['Szymański', 'Szymańska'],
  ['Woźniak', 'Woźniak'],
  ['Dąbrowski', 'Dąbrowska'],
  ['Kozłowski', 'Kozłowska'],
  ['Jankowski', 'Jankowska'],
  ['Mazur', 'Mazur'],
  ['Kwiatkowski', 'Kwiatkowska'],
  ['Krawczyk', 'Krawczyk'],
  ['Piotrowski', 'Piotrowska'],
  ['Grabowski', 'Grabowska'],
  ['Pawłowski', 'Pawłowska'],
  ['Michalski', 'Michalska'],
  ['Król', 'Król'],
  ['Wieczorek', 'Wieczorek'],
  ['Jabłoński', 'Jabłońska'],
  ['Wróbel', 'Wróbel'],
  ['Majewski', 'Majewska'],
  ['Olszewski', 'Olszewska'],
  ['Stępień', 'Stępień'],
  ['Malinowski', 'Malinowska'],
  ['Górski', 'Górska'],
  ['Sikora', 'Sikora'],
];
