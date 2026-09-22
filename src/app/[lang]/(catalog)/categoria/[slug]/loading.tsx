import { GridPageSkeleton } from "@/components/Skeletons";

// Al pasar de una categoría a otra solo cambia el `[slug]`, así que el
// esqueleto del catálogo no aplica: este cubre ese salto.
export default function CategoryLoading() {
  return <GridPageSkeleton />;
}
