import Link from "next/link";

// Pie de página con crédito y acceso a las opiniones, compartido por el
// catálogo y la landing.
export function SiteFooter() {
  return (
    <footer className="mx-auto mb-2 w-full max-w-[1500px] px-4 pb-4 pt-8 text-center text-xs text-faint sm:px-4">
      <p className="mb-2">
        <Link
          href="/opiniones"
          className="underline underline-offset-2 transition-colors hover:text-accent-ink"
        >
          ¿Qué opinas de Clusly?
        </Link>
      </p>
      Hecho con cariño para quienes aprenden IA y datos en español. Por{" "}
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
