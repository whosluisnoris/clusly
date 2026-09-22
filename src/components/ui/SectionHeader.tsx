import type { ReactNode } from "react";
import { cn } from "./cn";

// Título de sección. `lg` es el de la landing ("Explora por temática" + "Ver
// todo →"); `sm` es la etiqueta en mayúsculas de los paneles y listas
// ("Tu actividad", "Lives anteriores").
//
// `action` va a la derecha, en la misma línea: un TextLink, un Select…
export function SectionHeader({
  title,
  action,
  size = "lg",
  as: Heading = "h2",
  id,
  className,
}: {
  title: ReactNode;
  action?: ReactNode;
  size?: "sm" | "lg";
  as?: "h2" | "h3";
  id?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4",
        size === "lg" ? "mb-4 sm:mb-6" : "mb-3 sm:mb-4",
        className
      )}
    >
      <Heading
        id={id}
        className={
          size === "lg"
            ? "text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl"
            : "text-sm font-bold uppercase tracking-wide text-muted"
        }
      >
        {title}
      </Heading>
      {action}
    </div>
  );
}
