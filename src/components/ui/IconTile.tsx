import type { ReactNode } from "react";
import { cn } from "./cn";

type Size = "sm" | "md" | "lg";

// Cada tamaño también dimensiona el <svg> de dentro, así que el ícono no
// necesita clases propias.
const SIZES: Record<Size, string> = {
  sm: "h-9 w-9 rounded-[10px] [&_svg]:size-[18px]",
  md: "h-10 w-10 rounded-[10px] sm:h-11 sm:w-11 sm:rounded-xl [&_svg]:size-5 sm:[&_svg]:size-[22px]",
  lg: "h-12 w-12 rounded-xl sm:h-14 sm:w-14 sm:rounded-2xl [&_svg]:size-6 sm:[&_svg]:size-7",
};

// El cuadrito de color con un ícono de las tarjetas de temática: el ícono en el
// color y el fondo con ese mismo color al 14 %. `color` acepta cualquier valor
// CSS; para una temática, `topicColor(slug)`.
export function IconTile({
  color = "var(--accent)",
  size = "md",
  className,
  children,
}: {
  color?: string;
  size?: Size;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn("grid shrink-0 place-items-center", SIZES[size], className)}
      style={{
        color,
        backgroundColor: `color-mix(in srgb, ${color} 14%, transparent)`,
      }}
    >
      {children}
    </span>
  );
}
