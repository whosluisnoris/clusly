import { getCurrentUser } from "@/lib/auth";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

// Marco compartido por toda la plataforma: la misma barra de navegación (con la
// sesión resuelta en el servidor) y el mismo pie. Lo usan el catálogo, el panel
// de administración y las páginas de acceso, para que la navegación no cambie
// al pasar de una sección a otra.
//
// La landing no lo usa porque tiene su propio envoltorio (el resplandor de
// fondo), pero monta el mismo `SiteHeader`.
export async function SiteShell({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader user={user} />
      {children}
      <SiteFooter />
    </div>
  );
}
