import { cn } from "./cn";

// Pestañas subrayadas para cambiar de vista dentro de una página (el panel de
// admin). El estado lo lleva quien las usa: `value` es la activa y `onChange`
// recibe la clave pulsada. En móvil la fila se desliza de lado si no cabe.
//
//   <Tabs items={TABS} value={tab} onChange={setTab} label="Secciones del panel" />
//
// Solo cambia la vista; si cada pestaña debe tener su URL, usa enlaces.
export function Tabs<K extends string>({
  items,
  value,
  onChange,
  label,
  className,
}: {
  items: { key: K; label: string }[];
  value: K;
  onChange: (key: K) => void;
  /** Nombre del grupo para lectores de pantalla. */
  label: string;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className={cn(
        "no-scrollbar -mx-4 flex gap-1 overflow-x-auto border-b border-border px-4 sm:mx-0 sm:px-0",
        className
      )}
    >
      {items.map((item) => {
        const active = item.key === value;
        return (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.key)}
            className={cn(
              "-mb-px shrink-0 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold transition",
              "focus-visible:rounded-t-lg focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent",
              active
                ? "border-accent text-foreground"
                : "border-transparent text-muted hover:border-border-strong hover:text-foreground"
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
