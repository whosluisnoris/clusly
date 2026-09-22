import { twMerge } from "tailwind-merge";

// Une clases de Tailwind descartando las vacías y resolviendo conflictos: la
// última gana. Así cualquier componente acepta `className` para ajustar lo
// suyo sin pelearse con sus clases por defecto:
//
//   cn("px-4 py-2", active && "bg-accent", "px-8")  →  "py-2 bg-accent px-8"
export function cn(...parts: (string | false | null | undefined)[]): string {
  return twMerge(parts.filter(Boolean).join(" "));
}
