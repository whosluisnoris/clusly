import { getCurrentUser } from "@/lib/auth";
import { getActiveCategories } from "@/lib/catalog";
import { SubmitForm } from "@/components/SubmitForm";
import { getDictionary, isLocale, DEFAULT_LOCALE } from "@/lib/i18n";
import { Page, PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";


// Abierta a todo el mundo: se puede llenar el formulario sin cuenta y la sesión
// se pide al confirmar (o el aporte queda pendiente de aprobación).
export default async function EnviarPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const t = getDictionary(isLocale(lang) ? lang : DEFAULT_LOCALE);

  const [user, categories] = await Promise.all([
    getCurrentUser(),
    getActiveCategories(),
  ]);

  return (
    <Page size="narrow">
      <PageHeader
        title={t.submit.title}
        description={user ? t.submit.subtitleUser : t.submit.subtitleGuest}
      />

      <SubmitForm categories={categories} loggedIn={!!user} />
    </Page>
  );
}
