import { LocaleLink } from "@/components/LocaleLink";
import { getActiveCategories, getCategoryResourceCounts } from "@/lib/catalog";
import { getCurrentUser } from "@/lib/auth";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { SITE_NAME } from "@/lib/constants";
import { CategoryIcon } from "@/components/CategoryIcon";
import { HowToAddVideo } from "@/components/HowToAddVideo";
import {
  getDictionary,
  isLocale,
  fmt,
  plural,
  DEFAULT_LOCALE,
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

  // Intro editorial (sin tarjetas): tres ideas numeradas separadas por hairlines.
  const principles = [
    { n: "01", title: t.landing.principle1Title, text: t.landing.principle1Text },
    { n: "02", title: t.landing.principle2Title, text: t.landing.principle2Text },
    { n: "03", title: t.landing.principle3Title, text: t.landing.principle3Text },
  ];

  const [categories, counts, user] = await Promise.all([
    getActiveCategories(),
    getCategoryResourceCounts(),
    getCurrentUser(),
  ]);

  // Firma de la landing: degradado que mezcla toda la paleta (definido por tema
  // en globals.css). El acento naranja es único, así que la mezcla vive aquí.
  const blend = "var(--blend)";

  return (
    // El recorte del resplandor va en su propio contenedor y no aquí: un
    // `overflow-hidden` en el envoltorio de la página rompería el `position:
    // sticky` de la barra de navegación.
    <div className="relative flex min-h-screen flex-col">
      {/* Resplandor de acento (flame) de fondo, muy sutil */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div
          className="absolute -left-32 -top-40 h-[36rem] w-[36rem] rounded-full opacity-20 blur-[120px]"
          style={{ background: "var(--brand-flame)" }}
        />
        <div
          className="absolute -right-40 top-10 h-[30rem] w-[30rem] rounded-full opacity-10 blur-[120px]"
          style={{ background: "var(--brand-dust)" }}
        />
        <div
          className="absolute bottom-0 left-1/3 h-[26rem] w-[26rem] rounded-full opacity-15 blur-[120px]"
          style={{ background: "var(--brand-flame)" }}
        />
      </div>

      {/* La misma barra que el resto de la plataforma */}
      <SiteHeader user={user} lang={uiLang} />

      {/* Hero */}
      <section className="mx-auto w-full max-w-[1500px] px-5 pb-14 pt-14 sm:px-8 sm:pt-24">
        <p className="mb-6 text-xs uppercase tracking-[0.25em] text-muted">
          {t.landing.eyebrow}
        </p>
        <h1 className="max-w-4xl text-5xl font-black leading-[0.98] tracking-tight text-foreground sm:text-7xl">
          {t.landing.titleLead}{" "}
          <span className="brand-text">{t.landing.titleAccent}</span>
        </h1>
        <p className="mt-7 max-w-xl text-lg leading-relaxed text-muted">
          {fmt(t.landing.subtitle, { site: SITE_NAME })}
        </p>

        {/* Un solo CTA dominante (ley de Hick) + una acción secundaria discreta */}
        <div className="mt-9 flex flex-wrap items-center gap-5">
          <LocaleLink
            href="/todo"
            className="brand-gradient rounded-full px-7 py-3.5 text-sm font-bold text-on-accent shadow-lg shadow-black/20 transition hover:brightness-110 active:scale-95"
          >
            {t.landing.ctaPrimary}
          </LocaleLink>
          <LocaleLink
            href="/platzi-lives"
            className="text-sm font-semibold text-foreground underline decoration-2 underline-offset-4 transition hover:text-muted"
          >
            {t.landing.ctaSecondary}
          </LocaleLink>
        </div>

        {/* Barra que mezcla los colores de las temáticas */}
        <div
          className="mt-14 h-1.5 w-full max-w-3xl rounded-full"
          style={{ backgroundImage: blend }}
          aria-hidden="true"
        />
      </section>

      {/* Cómo funciona — editorial, sin tarjetas, separado por hairlines */}
      <section className="mx-auto w-full max-w-[1500px] px-5 py-10 sm:px-8">
        <div className="grid gap-0 sm:grid-cols-3">
          {principles.map((p, i) => (
            <div
              key={p.n}
              className={`py-6 sm:px-8 sm:py-2 ${
                i > 0 ? "border-t border-border sm:border-l sm:border-t-0" : "sm:pl-0"
              }`}
            >
              <span className="text-sm font-bold text-complement">{p.n}</span>
              <h3 className="mt-3 text-xl font-bold tracking-tight text-foreground">
                {p.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{p.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Temáticas — cada una con su color predominante */}
      {categories.length > 0 && (
        <section className="mx-auto w-full max-w-[1500px] px-5 py-12 sm:px-8">
          <div className="mb-2 flex items-end justify-between">
            <h2 className="text-2xl font-black tracking-tight text-foreground">
              {t.landing.topicsTitle}
            </h2>
            <LocaleLink
              href="/todo"
              className="text-sm font-semibold text-muted transition hover:text-foreground"
            >
              {t.landing.seeAll}
            </LocaleLink>
          </div>

          <div className="border-t border-border">
            {categories.map((c) => {
              const n = counts.get(c.id) ?? 0;
              return (
                <LocaleLink
                  key={c.id}
                  href={`/categoria/${c.slug}`}
                  className="group flex items-center gap-5 border-b border-border py-6 transition hover:bg-fill"
                >
                  <span
                    className="grid h-12 w-12 shrink-0 place-items-center rounded-full text-on-complement transition group-hover:scale-105"
                    style={{ backgroundColor: "var(--complement)" }}
                  >
                    <CategoryIcon slug={c.slug} className="h-6 w-6" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
                      {c.name}
                    </h3>
                    {c.description && (
                      <p className="mt-0.5 truncate text-sm text-muted">{c.description}</p>
                    )}
                  </div>
                  <span className="shrink-0 text-sm text-muted">
                    {plural(t.landing.resourceCount, n)}
                  </span>
                  <span
                    className="shrink-0 text-xl text-complement transition group-hover:translate-x-1"
                    aria-hidden="true"
                  >
                    →
                  </span>
                </LocaleLink>
              );
            })}
          </div>
        </section>
      )}

      {/* Cómo aportar un video: los pasos a la izquierda, la pantalla de cada
          uno a la derecha. Las categorías reales alimentan la maqueta del paso
          en el que se eligen. */}
      <HowToAddVideo categories={categories.map((c) => c.name)} />

      <div className="flex-1" />
      <SiteFooter lang={uiLang} />
    </div>
  );
}
