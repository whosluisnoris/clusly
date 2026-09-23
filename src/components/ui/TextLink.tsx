import type { ComponentProps } from "react";
import { LocaleLink } from "@/components/LocaleLink";
import { cn } from "./cn";

export type TextLinkTone = "accent" | "complement" | "muted" | "danger";

// Tonos de enlace dentro del texto:
// - accent:     naranja subrayado. Llamadas a la acción dentro de un párrafo
//               ("Crea una cuenta", "Ver tu aporte").
// - complement: ámbar sin subrayado. El "Ver todo →" junto a un título.
// - muted:      gris subrayado que se aclara al pasar. Enlaces secundarios.
// - danger:     rojo. Solo para botones-enlace destructivos ("Borrar").
const TONES: Record<TextLinkTone, string> = {
  accent:
    "font-semibold text-accent-ink underline decoration-2 underline-offset-4 hover:decoration-transparent",
  complement: "font-semibold text-complement hover:text-foreground",
  muted: "text-muted underline underline-offset-4 hover:text-foreground",
  danger: "font-semibold text-danger-ink hover:underline underline-offset-4",
};

// Las clases, para un <button> que debe verse como enlace ("Escribir otra").
export function textLinkClasses(tone: TextLinkTone = "accent", className?: string) {
  return cn(
    "rounded-sm transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-55",
    TONES[tone],
    className
  );
}

export function TextLink({
  href,
  tone = "accent",
  external = false,
  className,
  ...props
}: Omit<ComponentProps<"a">, "href"> & {
  href: string;
  tone?: TextLinkTone;
  external?: boolean;
}) {
  const classes = textLinkClasses(tone, className);
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={classes} {...props} />
    );
  }
  return <LocaleLink href={href} className={classes} {...props} />;
}
