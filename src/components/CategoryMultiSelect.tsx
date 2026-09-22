"use client";

import { useT } from "@/components/I18nProvider";
import { localizeCategory } from "@/lib/i18n";
import type { Category } from "@/lib/types";
import { Chip } from "@/components/ui";

// Chips de categoría con selección múltiple, reutilizable en el admin para
// asignar N categorías a un recurso.
//
// Los nombres salen traducidos al idioma activo. En el panel eso no cambia
// nada: su layout monta el diccionario en español a propósito.
export function CategoryMultiSelect({
  categories,
  selected,
  onChange,
}: {
  categories: Category[];
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  const t = useT();

  if (categories.length === 0) {
    return (
      <p className="text-xs text-faint">
        Crea al menos una categoría para poder asignarla.
      </p>
    );
  }

  function toggle(id: string) {
    onChange(
      selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((c) => {
        const on = selected.includes(c.id);
        return (
          <Chip key={c.id} size="sm" pressed={on} onClick={() => toggle(c.id)}>
            {on && <span aria-hidden="true">✓</span>}
            {localizeCategory(c, t).name}
          </Chip>
        );
      })}
    </div>
  );
}
