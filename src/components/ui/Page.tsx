import type { ComponentProps } from "react";
import { cn } from "./cn";
import { containerClasses, type ContainerSize } from "./Container";

// El <main> de cada página del sitio: ancho, márgenes y el aire vertical de la
// landing (más generoso cuanto más ancha es la pantalla). `flex-1` empuja el pie
// al fondo dentro de SiteShell.
//
//   <Page size="narrow">
//     <PageHeader title="…" description="…" />
//     …
//   </Page>
export function Page({
  size = "wide",
  className,
  ...props
}: ComponentProps<"main"> & { size?: ContainerSize }) {
  return (
    <main
      className={cn(
        containerClasses(size),
        "flex-1 pb-16 pt-8 sm:pb-20 sm:pt-12 lg:pt-14",
        className
      )}
      {...props}
    />
  );
}
