import type { ComponentProps, ReactNode } from "react";
import { cn } from "./cn";

// Campo de formulario: etiqueta en mayúsculas, el control, y debajo una pista
// o el error. Envuelve al control en un <label>, así que clicar la etiqueta
// enfoca el input sin ids. Para un grupo de controles (chips, radios), `group`
// lo convierte en <fieldset> con <legend>.
//
//   <Field label={t.submit.urlLabel} hint={t.submit.urlHint}>
//     <Input type="url" required value={url} onChange={…} />
//   </Field>
export function Field({
  label,
  hint,
  error,
  counter,
  group = false,
  className,
  children,
}: {
  label: ReactNode;
  hint?: ReactNode;
  /** Sustituye a la pista y se pinta en rojo. */
  error?: ReactNode;
  /** A la derecha de la etiqueta, p. ej. `${bio.length}/${MAX_BIO}`. */
  counter?: ReactNode;
  group?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const Root = group ? "fieldset" : "label";
  const Label = group ? "legend" : "span";
  return (
    <Root className={cn("flex min-w-0 flex-col", className)}>
      {/* Márgenes y no `gap`: un <legend> no participa del flex del fieldset. */}
      <Label className="mb-2 flex w-full items-center justify-between gap-3 text-xs font-semibold uppercase tracking-wide text-muted">
        <span>{label}</span>
        {counter != null && (
          <span className="font-normal normal-case tabular-nums text-faint">{counter}</span>
        )}
      </Label>
      {children}
      {error ? (
        <span className="mt-2 text-xs text-danger-ink">{error}</span>
      ) : (
        hint && <span className="mt-2 text-xs text-faint">{hint}</span>
      )}
    </Root>
  );
}

// Estilo de los controles. En móvil el texto es de 16px para que iOS no haga
// zoom al enfocar; desde `sm` baja a 14px como el resto de la interfaz.
export function inputClasses({
  compact = false,
  className,
}: { compact?: boolean; className?: string } = {}) {
  return cn(
    "w-full min-w-0 rounded-xl bg-background text-foreground ring-1 ring-inset ring-border transition placeholder:text-faint",
    "hover:ring-border-strong focus:outline-none focus:ring-2 focus:ring-accent/60",
    "disabled:opacity-60 aria-invalid:ring-danger/70",
    compact ? "h-9 px-3 text-sm sm:text-xs" : "px-4 py-2.5 text-base sm:text-sm",
    className
  );
}

type ControlProps = { compact?: boolean };

export function Input({ compact, className, ...props }: ComponentProps<"input"> & ControlProps) {
  return <input className={inputClasses({ compact, className: cn(!compact && "h-11", className) })} {...props} />;
}

export function Textarea({
  compact,
  className,
  rows = 4,
  ...props
}: ComponentProps<"textarea"> & ControlProps) {
  return (
    <textarea rows={rows} className={inputClasses({ compact, className: cn("resize-y", className) })} {...props} />
  );
}

export function Select({ compact, className, ...props }: ComponentProps<"select"> & ControlProps) {
  return (
    <select
      className={inputClasses({ compact, className: cn("w-auto cursor-pointer", !compact && "h-11", className) })}
      {...props}
    />
  );
}
