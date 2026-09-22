import { ArticlePageSkeleton } from "@/components/Skeletons";

// Del listado del blog a un artículo solo cambia el `[slug]`; sin este archivo
// el clic se quedaba esperando al servidor sin ninguna señal.
export default function BlogPostLoading() {
  return <ArticlePageSkeleton />;
}
