import { HomePageSkeleton } from "@/components/Skeletons";

// Al volver al inicio (p. ej. con el logo) la pantalla cambia al instante en
// vez de quedarse esperando a la consulta de temáticas.
export default function HomeLoading() {
  return <HomePageSkeleton />;
}
