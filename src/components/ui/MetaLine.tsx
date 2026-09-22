import { Fragment, type ReactNode } from "react";
import { cn } from "./cn";

// Metadatos separados por "·" (autor · fecha · minutos de lectura). Los huecos
// vacíos (null, false, "") se saltan, así que no quedan puntos colgando.
export function MetaLine({
  items,
  className,
}: {
  items: ReactNode[];
  className?: string;
}) {
  const shown = items.filter((item) => item !== null && item !== undefined && item !== false && item !== "");
  if (shown.length === 0) return null;
  return (
    <p className={cn("flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-faint", className)}>
      {shown.map((item, i) => (
        <Fragment key={i}>
          {i > 0 && <span aria-hidden="true">·</span>}
          <span>{item}</span>
        </Fragment>
      ))}
    </p>
  );
}
