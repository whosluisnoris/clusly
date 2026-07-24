"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";

// Corazón para guardar un video o playlist. Dos presentaciones:
//   · "floating" — flota en la esquina de la tarjeta del grid. Solo aparece al
//     pasar el cursor (en móvil, donde no hay hover, siempre se ve), y se queda
//     visible si el recurso ya está guardado.
//   · "inline"   — pastilla con texto, para la página de detalle.
// Actualiza optimista y revierte si el servidor falla. Sin sesión, el clic
// lleva a /entrar y vuelve a donde estabas. Vive fuera del <Link> de la tarjeta
// (nunca anidado en un <a>), así que no necesita frenar la navegación.
export function FavoriteButton({
  resourceId,
  initialSaved = false,
  canSave,
  variant = "floating",
  removeOnUnsave = false,
}: {
  resourceId: string;
  initialSaved?: boolean;
  canSave: boolean;
  variant?: "floating" | "inline";
  removeOnUnsave?: boolean;
}) {
  const [saved, setSaved] = useState(initialSaved);
  const [pending, setPending] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!canSave) {
      router.push(`/entrar?next=${encodeURIComponent(pathname)}`);
      return;
    }
    if (pending) return;

    const next = !saved;
    setSaved(next);
    setPending(true);

    try {
      const res = await fetch(`/api/resources/${resourceId}/favorite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ saved: next }),
      });
      if (!res.ok) throw new Error();
      // En la página de "Guardados" el recurso deja de pertenecer a la lista:
      // se recarga para que desaparezca de la cuadrícula.
      if (!next && removeOnUnsave) router.refresh();
    } catch {
      setSaved(!next);
    } finally {
      setPending(false);
    }
  }

  const label = saved ? "Quitar de guardados" : "Guardar";

  if (variant === "inline") {
    return (
      <button
        type="button"
        onClick={toggle}
        aria-pressed={saved}
        aria-label={label}
        className={`inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-semibold transition active:scale-95 ${
          saved
            ? "bg-accent/15 text-accent-ink ring-1 ring-accent/40"
            : "bg-fill text-muted ring-1 ring-border hover:bg-fill-strong hover:text-foreground"
        }`}
      >
        <Heart filled={saved} className="h-4 w-4" />
        {saved ? "Guardado" : "Guardar"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={saved}
      aria-label={label}
      title={label}
      className={`glass absolute right-2 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full shadow-lg backdrop-blur-md transition duration-200 hover:scale-110 active:scale-95 ${
        saved
          ? "text-accent-ink opacity-100"
          : // En móvil no hay hover: siempre visible. En escritorio aparece al
            // pasar el cursor por la tarjeta, o al enfocarlo con el teclado.
            "text-foreground opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
      }`}
    >
      <Heart filled={saved} className="h-[18px] w-[18px]" />
    </button>
  );
}

// Corazón: contorno cuando no está guardado, relleno cuando sí.
function Heart({ filled, className }: { filled: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={filled ? 1.5 : 2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  );
}
