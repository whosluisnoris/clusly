import { cn } from "./cn";

// Bloque gris que late, para los esqueletos de carga. La forma (alto, ancho,
// radio) va en `className`.
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse rounded-lg bg-surface motion-reduce:animate-none", className)}
    />
  );
}
