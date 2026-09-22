import { SiteShell } from "@/components/SiteShell";
import { isLocale, DEFAULT_LOCALE } from "@/lib/i18n";
import { Card } from "@/components/ui";

export const dynamic = "force-dynamic";

// Páginas de acceso: la misma barra y el mismo pie que el resto de la
// plataforma; lo propio de aquí es solo la tarjeta centrada.
export default async function AuthLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  return (
    <SiteShell lang={isLocale(lang) ? lang : DEFAULT_LOCALE}>
      <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-8 sm:py-16">
        <Card padding="lg" className="w-full max-w-md">
          {children}
        </Card>
      </main>
    </SiteShell>
  );
}
