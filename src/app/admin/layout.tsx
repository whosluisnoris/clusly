import { RootHtml } from "@/components/RootHtml";
import { I18nProvider } from "@/components/I18nProvider";
import { SiteShell } from "@/components/SiteShell";
import { getDictionary } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export const metadata = { title: "Panel Admin" };

// El panel es el **segundo layout raíz** (la plataforma pública vive bajo
// `[lang]`). Se queda siempre en español: lo usa el staff, no los visitantes,
// así que su URL no lleva prefijo de idioma. Aun así monta I18nProvider porque
// comparte la barra y el pie con el resto del sitio.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RootHtml lang="es">
      <I18nProvider lang="es" dictionary={getDictionary("es")}>
        <SiteShell>{children}</SiteShell>
      </I18nProvider>
    </RootHtml>
  );
}
