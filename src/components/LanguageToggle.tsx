"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useI18n } from "@/components/I18nProvider";
import {
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  localizePath,
  type Locale,
} from "@/lib/i18n/config";

// Botón ES/EN de la barra. Cambia el idioma **sin salir de la página**: lleva a
// la misma ruta con el otro prefijo, conservando la query.
//
// La elección se guarda en cookie y a partir de ahí manda sobre la detección
// del navegador: si alguien eligió a mano, no se le vuelve a cambiar solo.
export function LanguageToggle({ className = "" }: { className?: string }) {
  const { lang, t } = useI18n();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const next: Locale = lang === "es" ? "en" : "es";

  function switchTo() {
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; samesite=lax`;
    const qs = searchParams.toString();
    const target = localizePath(pathname, next);
    router.push(qs ? `${target}?${qs}` : target);
    // El diccionario se resuelve en el servidor: hay que repintar la ruta.
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={switchTo}
      aria-label={t.language.switchTo}
      title={t.language.switchTo}
      className={`flex h-9 shrink-0 items-center gap-1 rounded-full px-2.5 text-xs font-bold text-muted transition hover:bg-fill hover:text-foreground ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        width="16"
        height="16"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3a15 15 0 0 1 0 18a15 15 0 0 1 0-18" />
      </svg>
      {next === "en" ? t.language.enShort : t.language.esShort}
    </button>
  );
}
