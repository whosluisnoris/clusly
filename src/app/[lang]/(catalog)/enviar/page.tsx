import { getCurrentUser } from "@/lib/auth";
import { getActiveCategories } from "@/lib/catalog";
import { SubmitForm } from "@/components/SubmitForm";
import { getDictionary, isLocale, DEFAULT_LOCALE } from "@/lib/i18n";

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
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 sm:px-8">
      <div className="mb-8 flex items-start gap-4">
        <span
          className="brand-gradient mt-1.5 h-10 w-1.5 shrink-0 rounded-full"
          aria-hidden="true"
        />
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
            {t.submit.title}
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            {user ? t.submit.subtitleUser : t.submit.subtitleGuest}
          </p>
        </div>
      </div>

      <SubmitForm categories={categories} loggedIn={!!user} />
    </main>
  );
}
