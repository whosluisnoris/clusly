import type { ComponentProps, ReactNode } from "react";
import { LocaleLink } from "@/components/LocaleLink";
import { cn } from "./cn";

export type ButtonVariant = "primary" | "secondary" | "soft" | "contrast" | "ghost" | "danger";
export type ButtonSize = "xs" | "sm" | "md" | "lg";

// Variantes (de más a menos peso):
// - primary:   relleno naranja. La acción principal; idealmente una por pantalla.
// - contrast:  relleno del color del texto (blanco en oscuro, carbón en claro).
//              Un CTA fuerte que no compite con el naranja (p. ej. "Crear cuenta").
// - secondary: contorno. La acción alternativa ("Aportar un video" en la landing).
// - soft:      fondo tenue. Acciones de apoyo y atajos.
// - ghost:     solo texto; el fondo aparece al pasar el cursor.
// - danger:    contorno rojo. Acciones destructivas (borrar, quitar); siempre
//              detrás de una confirmación.
const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-accent text-on-accent hover:brightness-110",
  contrast: "bg-foreground text-background hover:opacity-90",
  secondary: "text-foreground ring-1 ring-inset ring-border-strong hover:bg-fill",
  soft: "bg-fill text-foreground ring-1 ring-inset ring-border hover:bg-fill-strong",
  ghost: "text-muted hover:bg-fill hover:text-foreground",
  danger: "text-danger-ink ring-1 ring-inset ring-danger/40 hover:bg-danger/10",
};

// `xs` es para acciones dentro de filas de una lista (paneles de admin).
const SIZES: Record<ButtonSize, string> = {
  xs: "h-8 gap-1 px-3 text-xs",
  sm: "h-9 gap-1.5 px-4 text-sm",
  md: "h-11 gap-2 px-5 text-[15px]",
  lg: "h-13 gap-2.5 px-7 text-base",
};

// Las clases de un botón, para aplicarlas a algo que no sea <button> ni
// ButtonLink (un <a> con analítica, un <label> de subida de archivo…).
export function buttonClasses({
  variant = "primary",
  size = "md",
  block = false,
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Ocupa todo el ancho (útil en móvil: `block` + `sm:w-auto`). */
  block?: boolean;
  className?: string;
} = {}): string {
  return cn(
    "inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap rounded-full font-bold transition active:scale-95 motion-reduce:active:scale-100",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
    "disabled:pointer-events-none disabled:opacity-55 aria-disabled:pointer-events-none aria-disabled:opacity-55",
    VARIANTS[variant],
    SIZES[size],
    block && "w-full",
    className
  );
}

type StyleProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
};

// <button> con el estilo de la marca. `loading` lo deshabilita y muestra
// `loadingText` (o el mismo texto) con un indicador giratorio.
//
//   <Button type="submit" loading={saving} loadingText={t.common.saving}>
//     {t.profile.saveChanges}
//   </Button>
export function Button({
  variant,
  size,
  block,
  loading = false,
  loadingText,
  className,
  children,
  disabled,
  type = "button",
  ...props
}: ComponentProps<"button"> &
  StyleProps & {
    loading?: boolean;
    loadingText?: ReactNode;
  }) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClasses({ variant, size, block, className })}
      {...props}
    >
      {loading && <Spinner />}
      {loading && loadingText ? loadingText : children}
    </button>
  );
}

// Enlace con forma de botón. Las rutas internas pasan por LocaleLink (llevan el
// idioma); con `external` es un <a> que abre en otra pestaña.
export function ButtonLink({
  href,
  external = false,
  variant,
  size,
  block,
  className,
  children,
  ...props
}: Omit<ComponentProps<"a">, "href"> &
  StyleProps & {
    href: string;
    external?: boolean;
  }) {
  const classes = buttonClasses({ variant, size, block, className });
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={classes} {...props}>
        {children}
      </a>
    );
  }
  return (
    <LocaleLink href={href} className={classes} {...props}>
      {children}
    </LocaleLink>
  );
}

function Spinner() {
  return (
    <span
      aria-hidden="true"
      className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-r-transparent motion-reduce:animate-none"
    />
  );
}
