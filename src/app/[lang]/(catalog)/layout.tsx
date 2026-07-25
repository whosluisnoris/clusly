import { SiteShell } from "@/components/SiteShell";
import { isLocale, DEFAULT_LOCALE } from "@/lib/i18n";

export const dynamic = "force-dynamic";

// Layout del catálogo: el marco compartido de la plataforma (barra + pie).
// La encuesta flotante NO vive aquí: su pregunta es sobre Platzi Lives, así que
// solo se monta en esa página.
export default async function CatalogLayout({
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
