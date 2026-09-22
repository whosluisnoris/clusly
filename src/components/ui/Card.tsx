import type { ComponentProps, ElementType } from "react";
import { cn } from "./cn";

export type CardVariant = "surface" | "glass" | "outline";
export type CardPadding = "none" | "sm" | "md" | "lg";

// Superficies:
// - surface: el fondo elevado con borde fino de las tarjetas de temática.
//            Lo normal para contenido (formularios, perfil, artículos).
// - glass:   translúcido con desenfoque. Para lo que flota o convive con
//            imagen (paneles laterales del reproductor, menús).
// - outline: solo el borde, sin fondo. Para agrupar sin añadir peso.
const VARIANTS: Record<CardVariant, string> = {
  surface: "bg-surface ring-1 ring-border",
  glass: "glass backdrop-blur-md",
  outline: "ring-1 ring-border",
};

// El relleno crece en pantallas grandes.
const PADDINGS: Record<CardPadding, string> = {
  none: "",
  sm: "p-4",
  md: "p-5 sm:p-6",
  lg: "p-6 sm:p-8",
};

// `interactive` añade el gesto de las tarjetas enlazadas de la landing: se
// levanta 2px y el borde se marca al pasar el cursor.
export function cardClasses({
  variant = "surface",
  padding = "md",
  interactive = false,
  className,
}: {
  variant?: CardVariant;
  padding?: CardPadding;
  interactive?: boolean;
  className?: string;
} = {}): string {
  return cn(
    "rounded-2xl",
    VARIANTS[variant],
    PADDINGS[padding],
    interactive &&
      "transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:ring-border-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent motion-reduce:hover:translate-y-0",
    className
  );
}

// Contenedor con superficie. `as` cambia la etiqueta (section, article, form,
// aside, li…) sin perder el estilo. Para un enlace con forma de tarjeta, aplica
// `cardClasses({ interactive: true })` al LocaleLink.
export function Card({
  as: Tag = "div",
  variant,
  padding,
  interactive,
  className,
  ...props
}: ComponentProps<"div"> & {
  as?: ElementType;
  variant?: CardVariant;
  padding?: CardPadding;
  interactive?: boolean;
}) {
  return (
    <Tag className={cardClasses({ variant, padding, interactive, className })} {...props} />
  );
}
