import type { ReactNode } from "react";
import { cn } from "./cn";

export type BadgeTone = "neutral" | "accent" | "complement" | "live";

// Etiqueta corta en mayúsculas: rol, estado, "EN VIVO".
const TONES: Record<BadgeTone, string> = {
  neutral: "bg-fill text-muted ring-1 ring-inset ring-border",
  accent: "bg-accent/15 text-accent-ink",
  complement: "bg-complement/15 text-complement",
  live: "bg-danger/15 text-danger-ink ring-1 ring-inset ring-danger/40",
};

// `dot` añade un punto del color del texto delante; con "pulse", late (para
// lo que está pasando ahora mismo).
export function Badge({
  tone = "neutral",
  dot = false,
  size = "sm",
  className,
  children,
}: {
  tone?: BadgeTone;
  dot?: boolean | "pulse";
  size?: "sm" | "md";
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full font-bold uppercase tracking-wide",
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
        TONES[tone],
        className
      )}
    >
      {dot && (
        <span
          aria-hidden="true"
          className={cn(
            "h-1.5 w-1.5 rounded-full bg-current",
            dot === "pulse" && "animate-pulse motion-reduce:animate-none"
          )}
        />
      )}
      {children}
    </span>
  );
}
