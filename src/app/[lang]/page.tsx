import { LocaleLink } from "@/components/LocaleLink";
import { getActiveCategories, getCategoryResourceCounts } from "@/lib/catalog";
import { getCurrentUser } from "@/lib/auth";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { CategoryIcon } from "@/components/CategoryIcon";
import { HowToAddVideo } from "@/components/HowToAddVideo";
import { topicColor } from "@/lib/color";
import {
  getDictionary,
  isLocale,
  fmt,
  plural,
  localizeCategory,
  DEFAULT_LOCALE,
  type Dictionary,
} from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function LandingPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const uiLang = isLocale(lang) ? lang : DEFAULT_LOCALE;
  const t = getDictionary(uiLang);

  const [categories, counts, user] = await Promise.all([
    getActiveCategories(),
    getCategoryResourceCounts(),
    getCurrentUser(),
  ]);

  // Las temáticas vienen de la base en español; el diccionario las traduce.
  const localizedCategories = categories.map((c) => ({ ...c, ...localizeCategory(c, t) }));
  const webName = localizedCategories.find((c) => c.slug === "web")?.name ?? "Web";

  const claims = [t.landing.claim1, t.landing.claim2, t.landing.claim3];

  return (
    <div className="flex min-h-screen flex-col">
      {/* La misma barra que el resto de la plataforma */}
      <SiteHeader user={user} lang={uiLang} />

      {/* Hero: mensaje y un solo CTA a la izquierda; a la derecha, el producto
          (una ruta a medio recorrer) en vez de decoración. */}
      <section className="mx-auto grid w-full max-w-[1500px] items-center gap-10 px-4 pb-4 pt-10 sm:px-8 sm:pt-20 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-20 lg:pb-16 lg:pt-24">
        <div className="flex flex-col">
          <h1 className="text-[2.6rem] font-extrabold leading-[1.02] tracking-tight text-foreground sm:text-6xl lg:text-[4.25rem] lg:leading-none">
            {t.landing.titleLead}{" "}
            <span className="text-accent-ink">{t.landing.titleAccent}</span>
          </h1>
          <p className="mt-5 max-w-md text-[17px] leading-relaxed text-muted sm:mt-7 sm:text-lg">
            {t.landing.subtitle}
          </p>

          {/* El único botón naranja de la pantalla */}
          <div className="mt-7 flex flex-col items-stretch gap-2 sm:mt-9 sm:flex-row sm:items-center sm:gap-6">
            <LocaleLink
              href="/todo"
              className="inline-flex h-13 items-center justify-center gap-2.5 rounded-full bg-accent px-7 text-base font-bold text-on-accent transition hover:brightness-110 active:scale-95"
            >
              {t.landing.ctaPrimary} <span aria-hidden="true">→</span>
            </LocaleLink>
            <LocaleLink
              href="/platzi-lives"
              className="self-center p-2 text-[15px] text-muted underline underline-offset-4 transition hover:text-foreground sm:p-0"
            >
              {t.landing.ctaSecondary}
            </LocaleLink>
          </div>

          <ul className="mt-5 flex flex-wrap justify-center gap-x-5 gap-y-2 text-[13px] text-muted sm:mt-12 sm:justify-start sm:gap-x-7 sm:text-sm">
            {claims.map((claim) => (
              <li key={claim} className="flex items-center gap-2">
                <CheckIcon className="h-4 w-4 text-complement" />
                {claim}
              </li>
            ))}
          </ul>
        </div>

        <RoutePreview t={t} topicName={webName} />
      </section>

      {/* Temáticas: justo después del hero, que es a lo que viene quien llega.
          Cada una con su color, que entra como brillo al pasar el cursor. */}
      {categories.length > 0 && (
        <section className="mx-auto w-full max-w-[1500px] px-4 pt-12 sm:px-8 lg:pt-4">
          <div className="mb-4 flex items-baseline justify-between sm:mb-6">
            <h2 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
              {t.landing.topicsTitle}
            </h2>
            <LocaleLink
              href="/todo"
              className="py-2 text-sm font-semibold text-complement transition hover:text-foreground sm:text-[15px]"
            >
              {t.landing.seeAll}
            </LocaleLink>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:grid-cols-6">
            {localizedCategories.map((c) => {
              const n = counts.get(c.id) ?? 0;
              return (
                <div
                  key={c.id}
                  className="topic-wrap"
                  style={{ ["--line" as string]: topicColor(c.slug) }}
                >
                  <span aria-hidden="true" className="topic-glow" />
                  <LocaleLink
                    href={`/categoria/${c.slug}`}
                    className="topic-card flex min-h-16 items-center gap-3 rounded-xl px-2.5 py-3 focus-visible:outline-none sm:flex-col sm:items-start sm:gap-3.5 sm:rounded-2xl sm:p-[18px]"
                  >
                    <span
                      className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px] sm:h-11 sm:w-11 sm:rounded-xl"
                      style={{
                        color: "var(--line)",
                        backgroundColor: "color-mix(in srgb, var(--line) 14%, transparent)",
                      }}
                    >
                      <CategoryIcon slug={c.slug} className="h-5 w-5 sm:h-[22px] sm:w-[22px]" />
                    </span>
                    <span className="flex min-w-0 flex-col gap-0.5 sm:gap-1">
                      <span className="font-display truncate text-[15px] font-bold text-foreground sm:text-[17px]">
                        {c.name}
                      </span>
                      <span className="text-xs text-muted sm:text-[13px]">
                        {plural(t.landing.resourceCount, n)}
                      </span>
                    </span>
                  </LocaleLink>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Aportar: una franja compacta, el único sitio con números */}
      <HowToAddVideo t={t} />

      <div className="flex-1" />
      <SiteFooter lang={uiLang} />
    </div>
  );
}

// Tarjeta ilustrativa del hero: una ruta con su progreso. No son videos reales
// (por eso los renglones grises y la etiqueta de "ejemplo"): enseña la idea de
// avanzar en orden sin gastar un párrafo en explicarla.
function RoutePreview({ t, topicName }: { t: Dictionary; topicName: string }) {
  const rows = [
    { w: "78%", state: "done" },
    { w: "64%", state: "done" },
    { w: "82%", state: "next" },
    { w: "58%", state: "todo" },
  ] as const;
  const done = rows.filter((r) => r.state === "done").length;

  return (
    <div
      aria-hidden="true"
      className="flex flex-col gap-3 rounded-[18px] bg-surface p-4 ring-1 ring-border sm:gap-4 sm:rounded-[20px] sm:p-6"
      style={{ ["--line" as string]: topicColor("web") }}
    >
      <div className="flex items-center gap-2.5">
        <span className="hidden sm:block" style={{ color: "var(--line)" }}>
          <CategoryIcon slug="web" className="h-5 w-5" />
        </span>
        <span className="font-display flex-1 text-base font-bold text-foreground sm:text-lg">
          {topicName} · {t.landing.routeSample}
        </span>
        <span className="text-[13px] text-muted">
          {fmt(t.landing.routeProgress, { done, total: rows.length })}
        </span>
      </div>

      <div className="h-1 rounded-full bg-fill-strong">
        <div
          className="h-1 rounded-full"
          style={{ width: `${(done / rows.length) * 100}%`, backgroundColor: "var(--line)" }}
        />
      </div>

      <div className="flex flex-col gap-2">
        {rows.map((r, i) => (
          <div
            key={i}
            className={`flex items-center gap-3 rounded-xl p-2 sm:gap-3.5 sm:p-2.5 ${
              r.state === "next" ? "bg-fill ring-1 ring-border" : ""
            } ${r.state === "todo" ? "max-sm:hidden" : ""}`}
          >
            <span className="grid h-[42px] w-[72px] shrink-0 place-items-center rounded-md bg-surface-2 sm:h-[54px] sm:w-24 sm:rounded-lg">
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current text-faint">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
            <span className="flex flex-1 flex-col gap-2">
              <span className="block h-2.5 rounded-full bg-border-strong" style={{ width: r.w }} />
              <span className="block h-2 w-[36%] rounded-full bg-border" />
            </span>
            {r.state === "done" && (
              <span
                className="grid h-7 w-7 place-items-center rounded-full"
                style={{
                  color: "var(--line)",
                  backgroundColor: "color-mix(in srgb, var(--line) 16%, transparent)",
                }}
              >
                <CheckIcon className="h-3.5 w-3.5" />
              </span>
            )}
            {r.state === "next" && (
              <span className="rounded-full bg-accent px-3 py-1.5 text-xs font-bold text-on-accent">
                {t.landing.routeNext}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function CheckIcon({ className }: { className: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
      aria-hidden="true"
    >
      <path d="M5 12l5 5L20 7" />
    </svg>
  );
}
