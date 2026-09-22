import { SiteShell } from "@/components/SiteShell";
import { isLocale, DEFAULT_LOCALE } from "@/lib/i18n";

export const dynamic = "force-dynamic";

// Layout de la landing: el mismo marco (barra + pie) que el resto de la
// plataforma. Vive en su propio grupo para poder tener un `loading.tsx` que
// solo aplique al inicio.
export default async function HomeLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  return (
    <SiteShell lang={isLocale(lang) ? lang : DEFAULT_LOCALE}>{children}</SiteShell>
  );
}
