import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RootHtml } from "@/components/RootHtml";
import { I18nProvider } from "@/components/I18nProvider";
import { SITE_NAME } from "@/lib/constants";
import {
  LOCALES,
  fmt,
  getDictionary,
  isLocale,
  localizePath,
  type Locale,
} from "@/lib/i18n";

// URL canónica de producción (se usa como base para resolver enlaces absolutos
// de Open Graph / Twitter, que las redes sociales exigen).
const SITE_URL = "https://clusly.com";

// Ambos idiomas se conocen de antemano.
export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

// Metadatos por idioma, con `alternates.languages` para que los buscadores
// sepan que /es y /en son la misma página en dos idiomas (hreflang).
export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale: Locale = isLocale(lang) ? lang : "es";
  const t = getDictionary(locale);
  const title = fmt(t.meta.defaultTitle, { site: SITE_NAME });

  return {
    metadataBase: new URL(SITE_URL),
    title: { default: title, template: `%s · ${SITE_NAME}` },
    description: t.meta.description,
    applicationName: SITE_NAME,
    authors: [
      { name: "Luis Noris", url: "https://www.linkedin.com/in/luisnorisgarcia/" },
    ],
    creator: "Luis Noris",
    alternates: {
      canonical: `/${locale}`,
      languages: Object.fromEntries(LOCALES.map((l) => [l, localizePath("/", l)])),
    },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title,
      description: t.meta.description,
      url: `${SITE_URL}/${locale}`,
      locale: locale === "es" ? "es_MX" : "en_US",
      images: [
        {
          url: "/og.png",
          width: 1200,
          height: 630,
          alt: `${SITE_NAME} — ${t.meta.tagline}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: t.meta.description,
      images: ["/og.png"],
    },
  };
}

// Layout raíz de la plataforma pública. El idioma sale del primer segmento de
// la URL (el proxy garantiza que siempre esté), se pinta en <html lang> y se
// publica al árbol de cliente con I18nProvider.
export default async function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  return (
    <RootHtml lang={lang}>
      <I18nProvider lang={lang} dictionary={getDictionary(lang)}>
        {children}
      </I18nProvider>
    </RootHtml>
  );
}
