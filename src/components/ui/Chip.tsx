import type { ComponentProps } from "react";
import { cn } from "./cn";

// Botón de alternar (aria-pressed) en forma de píldora, para filtros y
// selecciones.
// - solid: el elegido se rellena de naranja. Para elegir contenido (categorías,
//          idioma del video, sentimiento).
// - soft:  el elegido se tiñe; los demás son solo texto. Para opciones de
//          vista que conviven con chips sólidos (orden, idioma del filtro).
export function Chip({
  pressed,
  variant = "solid",
  size = "md",
  className,
  type = "button",
  ...props
}: ComponentProps<"button"> & {
  pressed: boolean;
  variant?: "solid" | "soft";
  size?: "sm" | "md";
}) {
  return (
    <button
      type={type}
      aria-pressed={pressed}
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full font-semibold transition active:scale-95 motion-reduce:active:scale-100",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        "disabled:pointer-events-none disabled:opacity-55",
        size === "sm" ? "h-8 px-3 text-xs" : "h-9 px-3.5 text-sm",
        variant === "solid"
          ? pressed
            ? "bg-accent text-on-accent"
            : "bg-fill text-muted ring-1 ring-inset ring-border hover:bg-fill-strong hover:text-foreground"
          : pressed
            ? "bg-accent/15 text-accent-ink ring-1 ring-inset ring-accent/40"
            : "text-muted hover:bg-fill hover:text-foreground",
        className
      )}
      {...props}
    />
  );
}
