import { LocaleLink } from "@/components/LocaleLink";
import { getDictionary, type Locale } from "@/lib/i18n";

// Pie de página con crédito y acceso a las opiniones, compartido por el
// catálogo y la landing.
export function SiteFooter({ lang }: { lang: Locale }) {
  const t = getDictionary(lang);

  return (
    <footer className="mx-auto mb-2 w-full max-w-[1500px] px-4 pb-4 pt-8 text-center text-xs text-faint sm:px-4">
      <p className="mb-2">
        <LocaleLink
          href="/opiniones"
          className="underline underline-offset-2 transition-colors hover:text-accent-ink"
        >
          {t.footer.opinionLink}
        </LocaleLink>
      </p>
      {t.footer.credit}{" "}
      <a
        href="https://www.linkedin.com/in/luisnorisgarcia/"
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-2 transition-colors hover:text-accent-ink"
      >
        Luis Noris
      </a>
    </footer>
  );
}
