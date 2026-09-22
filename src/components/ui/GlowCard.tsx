import type { ComponentProps, ReactNode } from "react";
import { LocaleLink } from "@/components/LocaleLink";
import { cn } from "./cn";

// El efecto de las tarjetas de temática de la landing: al pasar el cursor (o
// con el foco del teclado dentro) su color entra como un brillo difuminado por
// detrás, un reflejo arriba y el borde, y la tarjeta se levanta un poco. Los
// estilos viven en globals.css (`.glow-*`).
//
// Hay dos piezas:
// - GlowFrame: solo la superficie con el efecto (un <div>). Para tarjetas con
//   varias zonas clicables dentro, como la de un video (enlace + voto +
//   corazón).
// - GlowCard: la tarjeta entera es un enlace. La de las temáticas.
//
// `color` es cualquier color CSS; por defecto, el acento. El layout interno va
// en `className`/`children`: el componente solo pone la superficie y el efecto.

export function GlowFrame({
  color = "var(--accent)",
  className,
  children,
  ...props
}: ComponentProps<"div"> & { color?: string }) {
  return (
    <div className="glow-wrap h-full" style={{ ["--line" as string]: color }}>
      <span aria-hidden="true" className="glow-halo" />
      <div className={cn("glow-card rounded-2xl", className)} {...props}>
        {children}
      </div>
    </div>
  );
}

//   <GlowCard href={`/categoria/${slug}`} color={topicColor(slug)} className="flex gap-3 p-4">
//     <IconTile color={topicColor(slug)}><CategoryIcon slug={slug} /></IconTile>
//     …
//   </GlowCard>
export function GlowCard({
  href,
  color = "var(--accent)",
  title,
  className,
  children,
}: {
  href: string;
  color?: string;
  title?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className="glow-wrap" style={{ ["--line" as string]: color }}>
      <span aria-hidden="true" className="glow-halo" />
      <LocaleLink
        href={href}
        title={title}
        className={cn("glow-card block rounded-2xl focus-visible:outline-none", className)}
      >
        {children}
      </LocaleLink>
    </div>
  );
}
