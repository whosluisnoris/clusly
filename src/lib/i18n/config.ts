// Idiomas de la interfaz. El español es el idioma base y el de respaldo: el
// catálogo son videos en español, así que quien llega sin una preferencia clara
// debe caer en español. El inglés solo aparece si el navegador lo pide antes
// que el español (o si el usuario lo elige a mano).
export const LOCALES = ["es", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "es";

// Cookie donde se recuerda la elección manual. Manda sobre la detección: si
// alguien cambió el idioma a propósito, no se le vuelve a cambiar solo.
export const LOCALE_COOKIE = "clusly_lang";
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // un año

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

// Elige idioma a partir de la cabecera Accept-Language del navegador, que es la
// preferencia que el usuario configuró de verdad (a diferencia del país, que no
// dice nada: hay millones de hispanohablantes fuera de Latinoamérica y España).
//
// Se recorren los idiomas por prioridad (factor q) y gana el primero que
// reconocemos. Si no se reconoce ninguno, español.
export function detectLocale(acceptLanguage: string | null | undefined): Locale {
  if (!acceptLanguage) return DEFAULT_LOCALE;

  const ranked = acceptLanguage
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params
        .map((p) => p.trim())
        .find((p) => p.startsWith("q="))
        ?.slice(2);
      const quality = q === undefined ? 1 : Number.parseFloat(q);
      return {
        tag: tag.trim().toLowerCase(),
        q: Number.isFinite(quality) ? quality : 0,
      };
    })
    .filter((entry) => entry.tag && entry.q > 0)
    .sort((a, b) => b.q - a.q);

  for (const { tag } of ranked) {
    // "es", "es-MX", "es-419"… todas cuentan como español.
    const base = tag.split("-")[0];
    if (isLocale(base)) return base;
  }

  return DEFAULT_LOCALE;
}

// Rutas que NO llevan prefijo de idioma: las APIs, el panel (siempre en
// español, lo usa el staff) y la confirmación de correo, cuyo enlace ya salió
// en correos enviados y no puede cambiar de forma.
export const UNLOCALIZED_PREFIXES = ["/api", "/admin", "/auth", "/_next"];

export function needsLocale(pathname: string): boolean {
  return !UNLOCALIZED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

// Reescribe una ruta para que apunte al mismo sitio en otro idioma:
// /es/blog/hola + "en" → /en/blog/hola
// Deja intactas las rutas sin idioma (/admin, /api) y las URLs absolutas.
export function localizePath(pathname: string, locale: Locale): string {
  if (!pathname.startsWith("/") || !needsLocale(pathname)) return pathname;

  const segments = pathname.split("/").filter(Boolean);
  if (isLocale(segments[0])) segments[0] = locale;
  else segments.unshift(locale);
  return `/${segments.join("/")}`;
}
