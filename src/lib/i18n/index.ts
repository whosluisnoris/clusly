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

// Nombre y descripción de una temática en el idioma activo. Las temáticas
// vienen de la base de datos en español; el diccionario las traduce por slug.
// Si el slug no está traducido (una temática nueva creada desde el panel) se
// devuelve tal cual viene de la base, que siempre es mejor que nada.
export function localizeCategory<
  T extends { slug: string; name: string; description?: string | null },
>(category: T, t: Dictionary): { name: string; description: string | null } {
  const translations = t.categories as Record<
    string,
    { name: string; description: string } | undefined
  >;
  const entry = translations[category.slug];
  return {
    name: entry?.name ?? category.name,
    description: entry?.description ?? category.description ?? null,
  };
}

// Elige singular o plural y rellena `{n}` de una vez.
//   plural(t.card.videoCount, 1) → "1 video"
export function plural(
  entry: { one: string; other: string },
  n: number
): string {
  return fmt(n === 1 ? entry.one : entry.other, { n });
}
