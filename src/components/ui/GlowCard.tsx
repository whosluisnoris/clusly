import type { ReactNode } from "react";
import { LocaleLink } from "@/components/LocaleLink";
import { cn } from "./cn";

// La tarjeta enlazada de las temáticas de la landing: al pasar el cursor (o
// con el foco del teclado) su color entra como un brillo difuminado por detrás,
// un reflejo arriba y el borde, y la tarjeta se levanta un poco. Los estilos
// viven en globals.css (`.glow-*`).
//
// `color` es cualquier color CSS; por defecto, el acento. El contenido y el
// layout interno van en `className`/`children`: el componente solo pone la
// superficie y el efecto.
//
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
