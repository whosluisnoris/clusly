import { SiteShell } from "@/components/SiteShell";

export const dynamic = "force-dynamic";

// Layout del catálogo: el marco compartido de la plataforma (barra + pie).
// La encuesta flotante NO vive aquí: su pregunta es sobre Platzi Lives, así que
// solo se monta en esa página.
export default function CatalogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SiteShell>{children}</SiteShell>;
}
