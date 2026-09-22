import type { ReactNode } from "react";
import { cn } from "./cn";

export type AlertTone = "success" | "neutral" | "error";

const TONES: Record<AlertTone, string> = {
  success: "bg-accent/10 ring-accent/25",
  neutral: "bg-fill ring-border",
  error: "bg-danger/10 ring-danger/30",
};

// Aviso en línea: resultado de un envío, error de red, nota de privacidad.
// Con `title` el cuerpo va en gris debajo; sin él, el cuerpo es el mensaje (en
// rojo si es un error). `action` va al final (un TextLink, un Button).
//
// Los errores se anuncian a lectores de pantalla (role="alert"); el resto,
// con cortesía (role="status").
export function Alert({
  tone = "neutral",
  title,
  action,
  className,
  children,
}: {
  tone?: AlertTone;
  title?: ReactNode;
  action?: ReactNode;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn("rounded-xl px-4 py-3.5 text-sm ring-1 ring-inset", TONES[tone], className)}
    >
      {title && <p className="font-semibold text-foreground">{title}</p>}
      {children && (
        <div
          className={cn(
            !!title && "mt-1",
            tone === "error" ? "text-danger-ink" : title ? "text-muted" : "text-foreground"
          )}
        >
          {children}
        </div>
      )}
      {action && <div className="mt-2.5">{action}</div>}
    </div>
  );
}
