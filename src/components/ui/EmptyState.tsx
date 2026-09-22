import type { ReactNode } from "react";
import { cn } from "./cn";

// Lo que se ve cuando una lista está vacía: un mensaje centrado dentro de una
// superficie, con un ícono opcional y una acción para salir del vacío.
//
//   <EmptyState
//     title={t.saved.empty}
//     description={t.saved.emptyBody}
//     action={<ButtonLink href="/todo" variant="secondary">{t.saved.emptyLink}</ButtonLink>}
//   />
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-2xl bg-surface px-6 py-12 text-center ring-1 ring-border sm:py-16",
        className
      )}
    >
      {icon && <div className="mb-4">{icon}</div>}
      {title && (
        <p className="font-display text-lg font-bold text-foreground sm:text-xl">{title}</p>
      )}
      {description && (
        <p className={cn("max-w-md text-sm leading-relaxed text-muted sm:text-[15px]", !!title && "mt-1.5")}>
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
