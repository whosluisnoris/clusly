"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { useI18n } from "@/components/I18nProvider";
import { localizePath } from "@/lib/i18n/config";

type LinkProps = ComponentProps<typeof Link>;

// `next/link` que antepone el idioma activo a las rutas internas: href="/todo"
// se convierte en /es/todo o /en/todo según toque.
//
// Es un Client Component (lee el idioma del contexto) pero se puede renderizar
// igual desde Server Components, así que sirve en toda la aplicación sin tener
// que pasar el idioma por props hasta la última hoja del árbol.
//
// No toca las URLs externas ni las rutas sin idioma (/admin, /api): de eso se
// encarga `localizePath`.
export function LocaleLink({ href, ...props }: LinkProps) {
  const { lang } = useI18n();
  const localized = typeof href === "string" ? localizePath(href, lang) : href;
  return <Link href={localized} {...props} />;
}
