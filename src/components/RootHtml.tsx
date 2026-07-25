import { Bricolage_Grotesque, Roboto } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import type { Locale } from "@/lib/i18n";
import "@/app/globals.css";

// Bricolage Grotesque para títulos (display), Roboto para el resto del texto.
const bricolage = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const roboto = Roboto({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

// Fija el tema antes del primer paint: elección guardada o preferencia del sistema.
const themeScript = `(function(){try{var t=localStorage.getItem('pl_theme');if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';}document.documentElement.setAttribute('data-theme',t);}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();`;

// El envoltorio <html>/<body> de la aplicación. Vive en un componente aparte
// porque hay **dos** layouts raíz: el público (`app/[lang]/layout.tsx`, que sí
// conoce el idioma de la URL) y el del panel (`app/admin/layout.tsx`, que se
// queda en español). Así las fuentes, el tema y la analítica no se duplican.
export function RootHtml({
  lang,
  children,
}: {
  lang: Locale;
  children: React.ReactNode;
}) {
  return (
    <html
      lang={lang}
      data-theme="dark"
      suppressHydrationWarning
      className={`${bricolage.variable} ${roboto.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col overflow-x-clip bg-background text-foreground">
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
