import { getCurrentUser } from "@/lib/auth";
import { OpinionForm } from "@/components/OpinionForm";
import { getDictionary, isLocale, DEFAULT_LOCALE } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const t = getDictionary(isLocale(lang) ? lang : DEFAULT_LOCALE);
  return { title: t.opinions.title, description: t.opinions.subtitle };
}

// Sección de feedback. Es un buzón privado: lo que se escribe aquí llega solo
// al equipo (se lee en /admin → Opiniones), no se publica ni se muestran los
// conteos. Por eso la página es únicamente el formulario.
export default async function OpinionesPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const t = getDictionary(isLocale(lang) ? lang : DEFAULT_LOCALE);
  const user = await getCurrentUser();

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-8">
      <div className="mb-8 flex items-start gap-4">
        <span
          className="brand-gradient mt-1.5 h-10 w-1.5 shrink-0 rounded-full"
          aria-hidden="true"
        />
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
            {t.opinions.title}
          </h1>
          <p className="mt-1.5 text-sm text-muted">{t.opinions.subtitle}</p>
        </div>
      </div>

      <OpinionForm displayName={user?.displayName} />

      <p className="mt-6 rounded-2xl bg-surface p-5 text-sm text-muted ring-1 ring-border">
        {t.opinions.privacy}
      </p>
    </main>
  );
}
