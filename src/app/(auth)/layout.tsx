import { SiteShell } from "@/components/SiteShell";

export const dynamic = "force-dynamic";

// Páginas de acceso: la misma barra y el mismo pie que el resto de la
// plataforma; lo propio de aquí es solo la tarjeta centrada.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <SiteShell>
      <main className="flex flex-1 items-center justify-center px-5 py-10">
        <div className="glass w-full max-w-md rounded-2xl p-7 backdrop-blur-md sm:p-9">
          {children}
        </div>
      </main>
    </SiteShell>
  );
}
