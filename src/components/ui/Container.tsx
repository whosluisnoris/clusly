import type { ComponentProps } from "react";
import { cn } from "./cn";

// Anchos de página. `wide` es el de la landing y las cuadrículas; `content`
// para listas de lectura (blog, perfil); `narrow` para formularios y artículos.
export type ContainerSize = "wide" | "content" | "narrow";

const WIDTHS: Record<ContainerSize, string> = {
  wide: "max-w-[1500px]",
  content: "max-w-3xl",
  narrow: "max-w-2xl",
};

// Centrado + ancho máximo + el mismo margen lateral que la landing (16px en
// móvil, 32px desde `sm`). Úsalo cuando necesites el ancho sin el <main>.
export function containerClasses(size: ContainerSize = "wide"): string {
  return cn("mx-auto w-full px-4 sm:px-8", WIDTHS[size]);
}

export function Container({
  size = "wide",
  className,
  ...props
}: ComponentProps<"div"> & { size?: ContainerSize }) {
  return <div className={cn(containerClasses(size), className)} {...props} />;
}
