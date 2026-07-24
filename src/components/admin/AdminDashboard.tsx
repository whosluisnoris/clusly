"use client";

import { useState } from "react";
import { StreamsManager } from "@/components/admin/StreamsManager";
import { StatsPanel } from "@/components/admin/StatsPanel";
import { CategoriesManager } from "@/components/admin/CategoriesManager";
import { ResourcesManager } from "@/components/admin/ResourcesManager";
import { OpinionsManager } from "@/components/admin/OpinionsManager";
import { BlogManager } from "@/components/admin/BlogManager";

type Tab = "catalogo" | "platzi" | "blog" | "stats" | "opiniones";

const TABS: { key: Tab; label: string }[] = [
  { key: "catalogo", label: "Catálogo" },
  { key: "platzi", label: "Platzi Lives" },
  { key: "blog", label: "Blog" },
  { key: "stats", label: "Estadísticas" },
  { key: "opiniones", label: "Opiniones" },
];

// Cuerpo del panel admin (pestañas + managers). La autorización ya la resolvió
// el Server Component de /admin por rol de sesión; aquí no se maneja secreto: las
// rutas /api/admin/* autorizan por la cookie de sesión.
export function AdminDashboard() {
  const [tab, setTab] = useState<Tab>("catalogo");

  return (
    <>
      <div className="mb-8 flex gap-1 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition ${
              tab === t.key
                ? "border-accent text-accent-ink"
                : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "catalogo" && (
        <>
          <CategoriesManager />
          <ResourcesManager />
        </>
      )}
      {tab === "platzi" && <StreamsManager />}
      {tab === "blog" && <BlogManager />}
      {tab === "stats" && <StatsPanel />}
      {tab === "opiniones" && <OpinionsManager />}
    </>
  );
}
