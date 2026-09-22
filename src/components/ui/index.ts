// Componentes de interfaz de Clusly. Guía de uso: docs/10-componentes-ui.md
//
//   import { Page, PageHeader, Button, Card } from "@/components/ui";
//
// Ninguno lleva "use client" ni usa hooks: sirven igual en Server y Client
// Components. Los que reciben manejadores (onClick, onChange) solo pueden
// recibirlos desde un Client Component, como cualquier elemento HTML.
export { cn } from "./cn";
export { Container, containerClasses, type ContainerSize } from "./Container";
export { Page } from "./Page";
export { PageHeader } from "./PageHeader";
export { SectionHeader } from "./SectionHeader";
export { BackLink } from "./BackLink";
export {
  Button,
  ButtonLink,
  buttonClasses,
  type ButtonVariant,
  type ButtonSize,
} from "./Button";
export { TextLink, textLinkClasses, type TextLinkTone } from "./TextLink";
export { Card, cardClasses, type CardVariant, type CardPadding } from "./Card";
export { GlowCard } from "./GlowCard";
export { IconTile } from "./IconTile";
export { Chip } from "./Chip";
export { Badge, type BadgeTone } from "./Badge";
export { Field, Input, Textarea, Select, inputClasses } from "./Field";
export { Alert, type AlertTone } from "./Alert";
export { EmptyState } from "./EmptyState";
export { Avatar } from "./Avatar";
export { MetaLine } from "./MetaLine";
export { Skeleton } from "./Skeleton";
