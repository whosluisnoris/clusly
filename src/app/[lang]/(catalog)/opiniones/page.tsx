import { getCurrentUser } from "@/lib/auth";
import { OpinionForm } from "@/components/OpinionForm";
import { getDictionary, isLocale, DEFAULT_LOCALE } from "@/lib/i18n";
import { Alert, Page, PageHeader } from "@/components/ui";

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
    <Page size="narrow">
      <PageHeader title={t.opinions.title} description={t.opinions.subtitle} />

      <OpinionForm displayName={user?.displayName} />

      <Alert className="mt-5">{t.opinions.privacy}</Alert>
    </Page>
  );
}
