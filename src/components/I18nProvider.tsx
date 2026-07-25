"use client";

import { createContext, useContext, useCallback } from "react";
import { localizePath } from "@/lib/i18n/config";
import type { Dictionary, Locale } from "@/lib/i18n";

interface I18nValue {
  lang: Locale;
  t: Dictionary;
}

const I18nContext = createContext<I18nValue | null>(null);

// El diccionario del idioma activo, disponible en los Client Components sin
// tener que pasarlo por props por toda la aplicación. Se monta una sola vez en
// el layout de `[lang]`; el objeto es serializable (solo cadenas), así que
// cruza sin problema la frontera servidor → cliente.
export function I18nProvider({
  lang,
  dictionary,
  children,
}: {
  lang: Locale;
  dictionary: Dictionary;
  children: React.ReactNode;
}) {
  return (
    <I18nContext.Provider value={{ lang, t: dictionary }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nValue {
  const value = useContext(I18nContext);
  if (!value) {
    throw new Error("useI18n debe usarse dentro de <I18nProvider>");
  }
  return value;
}

// Atajo para el caso común: solo el diccionario.
export function useT(): Dictionary {
  return useI18n().t;
}

// Antepone el idioma activo a una ruta interna. Para los `router.push(...)` de
// los componentes cliente; para los enlaces está `<LocaleLink>`.
export function useLocalePath(): (path: string) => string {
  const { lang } = useI18n();
  return useCallback((path: string) => localizePath(path, lang), [lang]);
}
