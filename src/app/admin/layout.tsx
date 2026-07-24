import { SiteShell } from "@/components/SiteShell";

export const dynamic = "force-dynamic";

// El panel usa la misma barra y el mismo pie que el resto de la plataforma, para
// poder volver al catálogo sin salir del sitio. Quién puede entrar lo decide la
// página (`/admin`), que redirige a quien no sea staff.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <SiteShell>{children}</SiteShell>;
}
