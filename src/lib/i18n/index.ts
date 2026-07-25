import { es, type Dictionary } from "./dictionaries/es";
import { en } from "./dictionaries/en";
import { DEFAULT_LOCALE, type Locale } from "./config";

export type { Dictionary };
export * from "./config";

const DICTIONARIES: Record<Locale, Dictionary> = { es, en };

// Diccionario de un idioma. Ambos se importan de forma estática (son objetos
// pequeños) para poder usarlos igual desde Server y Client Components.
export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale] ?? DICTIONARIES[DEFAULT_LOCALE];
}

// Rellena los huecos `{clave}` de una cadena del diccionario.
//   fmt("{n} recursos", { n: 12 }) → "12 recursos"
export function fmt(
  template: string,
  vars: Record<string, string | number>
): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in vars ? String(vars[key]) : match
  );
}

// Elige singular o plural y rellena `{n}` de una vez.
//   plural(t.card.videoCount, 1) → "1 video"
export function plural(
  entry: { one: string; other: string },
  n: number
): string {
  return fmt(n === 1 ? entry.one : entry.other, { n });
}
