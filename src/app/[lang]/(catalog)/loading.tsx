import { GridPageSkeleton } from "@/components/Skeletons";

// Estado de carga del catálogo. Hace que la navegación entre secciones sea
// inmediata: Next prefetchea este esqueleto (junto con la barra) y lo muestra
// al hacer clic mientras la página real se renderiza en el servidor.
//
// Va a nivel del grupo y no dentro de `todo/` a propósito: así, cambiar un
// filtro de la exploración (solo cambia la query) no vuelve a mostrar el
// esqueleto y la página actual se queda visible mientras llega la nueva.
export default function CatalogLoading() {
  return <GridPageSkeleton />;
}
