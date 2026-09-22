import type { ReactNode } from "react";
import { LocaleLink } from "@/components/LocaleLink";
import { cn } from "./cn";

// "← Volver a …": enlace discreto encima del título. La flecha la pone el
// componente (y se desliza un poco al pasar el cursor), así que el texto del
// diccionario va sin ella.
export function BackLink({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <LocaleLink
      href={href}
      className={cn(
        "group inline-flex items-center gap-1.5 py-1 text-sm font-medium text-muted transition hover:text-foreground",
        className
      )}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="h-4 w-4 transition-transform group-hover:-translate-x-0.5 motion-reduce:transition-none"
      >
        <path d="M19 12H5M11 18l-6-6 6-6" />
      </svg>
      {children}
    </LocaleLink>
  );
}
