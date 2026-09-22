import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CategoryIcon } from "@/components/CategoryIcon";
import { topicColor } from "@/lib/color";
import { ResourceGrid } from "@/components/ResourceGrid";
import type { ResourceRow } from "@/lib/types";
import {
  Alert,
  Avatar,
  Badge,
  Button,
  ButtonLink,
  Card,
  Chip,
  EmptyState,
  Field,
  GlowCard,
  IconTile,
  Input,
  MetaLine,
  Page,
  PageHeader,
  SectionHeader,
  Select,
  Skeleton,
  TextLink,
  Textarea,
} from "@/components/ui";

export const metadata: Metadata = {
  title: "Componentes UI",
  robots: { index: false, follow: false },
};

// Catálogo vivo de los componentes de `@/components/ui`, para verlos en ambos
// temas y a cualquier ancho mientras se desarrolla (npm run dev → /es/ui). En
// producción no existe. La guía escrita está en docs/10-componentes-ui.md.
export default function UiShowcasePage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <Page>
      <PageHeader
        title={
          <>
            Componentes <span className="text-accent-ink">UI</span>
          </>
        }
        description="Todo lo que vive en @/components/ui, con sus variantes. Cambia el tema y el ancho de la ventana para revisarlos."
        back={{ href: "/", label: "Inicio" }}
        actions={
          <>
            <ButtonLink href="/todo" variant="secondary">
              Secundario
            </ButtonLink>
            <ButtonLink href="/todo">Primario</ButtonLink>
          </>
        }
      />

      <div className="flex flex-col gap-14">
        <Demo title="Button / ButtonLink">
          <Row label="variant">
            <Button>primary</Button>
            <Button variant="contrast">contrast</Button>
            <Button variant="secondary">secondary</Button>
            <Button variant="soft">soft</Button>
            <Button variant="ghost">ghost</Button>
          </Row>
          <Row label="size">
            <Button size="sm">sm</Button>
            <Button size="md">md</Button>
            <Button size="lg">
              lg <span aria-hidden="true">→</span>
            </Button>
          </Row>
          <Row label="estado">
            <Button loading loadingText="Guardando…">
              Guardar
            </Button>
            <Button disabled>disabled</Button>
            <Button variant="secondary" block className="sm:w-auto">
              block en móvil
            </Button>
          </Row>
        </Demo>

        <Demo title="TextLink">
          <Row label="tone">
            <TextLink href="/todo">accent</TextLink>
            <TextLink href="/todo" tone="complement">
              complement →
            </TextLink>
            <TextLink href="/todo" tone="muted">
              muted
            </TextLink>
          </Row>
        </Demo>

        <Demo title="Chip">
          <Row label="solid">
            <Chip pressed>Elegido</Chip>
            <Chip pressed={false}>Sin elegir</Chip>
            <Chip size="sm" pressed>
              sm
            </Chip>
          </Row>
          <Row label="soft">
            <Chip variant="soft" pressed>
              Más votados
            </Chip>
            <Chip variant="soft" pressed={false}>
              Recientes
            </Chip>
          </Row>
        </Demo>

        <Demo title="Badge">
          <Row label="tone">
            <Badge>neutral</Badge>
            <Badge tone="accent">accent</Badge>
            <Badge tone="complement">complement</Badge>
            <Badge tone="live" dot="pulse">
              En vivo
            </Badge>
            <Badge size="md" dot>
              md con punto
            </Badge>
          </Row>
        </Demo>

        <Demo title="Card / GlowCard / IconTile">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <p className="font-semibold text-foreground">surface</p>
              <p className="mt-1 text-sm text-muted">Lo normal para contenido.</p>
            </Card>
            <Card variant="glass">
              <p className="font-semibold text-foreground">glass</p>
              <p className="mt-1 text-sm text-muted">Paneles que flotan.</p>
            </Card>
            <Card variant="outline">
              <p className="font-semibold text-foreground">outline</p>
              <p className="mt-1 text-sm text-muted">Agrupar sin peso.</p>
            </Card>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {["web", "ia", "datos", "diseno"].map((slug) => (
              <GlowCard
                key={slug}
                href={`/categoria/${slug}`}
                color={topicColor(slug)}
                className="flex flex-col items-start gap-3.5 p-[18px]"
              >
                <IconTile color={topicColor(slug)}>
                  <CategoryIcon slug={slug} />
                </IconTile>
                <span className="font-display font-bold text-foreground">{slug}</span>
              </GlowCard>
            ))}
          </div>
          <Row label="IconTile size" className="mt-4">
            <IconTile size="sm">
              <CategoryIcon slug="ia" />
            </IconTile>
            <IconTile size="md">
              <CategoryIcon slug="ia" />
            </IconTile>
            <IconTile size="lg">
              <CategoryIcon slug="ia" />
            </IconTile>
          </Row>
        </Demo>

        <Demo title="ResourceCard (ResourceGrid)">
          <ResourceGrid
            resources={SAMPLE_RESOURCES}
            empty=""
            categoriesByResource={{
              v1: [{ slug: "web", name: "Web", color: null }],
              p1: [
                { slug: "ia", name: "IA", color: null },
                { slug: "datos", name: "Datos", color: null },
                { slug: "programacion", name: "Programación", color: null },
              ],
              p2: [{ slug: "diseno", name: "Diseño", color: null }],
            }}
          />
        </Demo>

        <Demo title="Field / Input / Textarea / Select">
          <Card padding="lg" className="flex max-w-xl flex-col gap-6">
            <Field label="Correo" hint="Nunca lo mostramos.">
              <Input type="email" placeholder="tu@correo.com" />
            </Field>
            <Field label="Biografía" counter="0/300">
              <Textarea placeholder="Cuéntanos algo" />
            </Field>
            <Field label="Con error" error="Este enlace no es de YouTube.">
              <Input aria-invalid defaultValue="https://vimeo.com/123" />
            </Field>
            <Field group label="Grupo (fieldset)">
              <div className="flex gap-2">
                <Chip pressed>Español</Chip>
                <Chip pressed={false}>Inglés</Chip>
              </div>
            </Field>
            <Row label="Select compact">
              <Select compact defaultValue="desc" aria-label="Orden">
                <option value="desc">Más recientes primero</option>
                <option value="asc">Más antiguos primero</option>
              </Select>
            </Row>
          </Card>
        </Demo>

        <Demo title="Alert">
          <div className="flex max-w-xl flex-col gap-3">
            <Alert
              tone="success"
              title="¡Listo, ya está publicado!"
              action={<TextLink href="/todo">Ver tu aporte →</TextLink>}
            >
              La comunidad ya puede votarlo.
            </Alert>
            <Alert title="Ese video ya estaba">Alguien lo aportó antes.</Alert>
            <Alert>Nota neutra sin título.</Alert>
            <Alert tone="error">No hay conexión. Inténtalo de nuevo.</Alert>
          </div>
        </Demo>

        <Demo title="EmptyState">
          <EmptyState
            icon={
              <IconTile size="lg">
                <CategoryIcon slug="producto" />
              </IconTile>
            }
            title="Todavía no hay nada aquí"
            description="Guarda videos con el corazón y aparecerán en esta lista."
            action={<ButtonLink href="/todo">Ir a explorar →</ButtonLink>}
          />
        </Demo>

        <Demo title="Avatar / MetaLine / Skeleton">
          <Row label="Avatar">
            <Avatar name="Luis" />
            <Avatar name="Ana" size="md" />
            <Avatar name="Clusly" size="lg" />
          </Row>
          <Row label="MetaLine" className="mt-4">
            <MetaLine items={["Luis Noris", "hace 3 días", null, "5 min de lectura"]} />
          </Row>
          <div className="mt-4 flex max-w-sm flex-col gap-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="aspect-video w-full rounded-2xl" />
          </div>
        </Demo>

        <Demo title="SectionHeader">
          <SectionHeader
            title="Explora por temática"
            action={
              <TextLink href="/todo" tone="complement">
                Ver todo →
              </TextLink>
            }
          />
          <SectionHeader size="sm" title="Tu actividad" />
        </Demo>
      </div>
    </Page>
  );
}

// Recursos de ejemplo para ver la tarjeta sin base de datos: un video en
// inglés, una playlist y una playlist sin miniatura.
const SAMPLE_BASE = {
  channel_title: "Canal de ejemplo",
  description: null,
  published_at: null,
  added_at: "2026-01-01T00:00:00Z",
  synced_at: null,
  source: "manual",
} satisfies Partial<ResourceRow>;

const SAMPLE_RESOURCES: ResourceRow[] = [
  {
    ...SAMPLE_BASE,
    id: "v1",
    kind: "video",
    youtube_id: "dQw4w9WgXcQ",
    title: "Un video suelto, en inglés, con título de dos líneas para ver el recorte",
    thumbnail_url: null,
    video_count: null,
    duration_seconds: 754,
    vote_count: 12,
    language: "en",
  },
  {
    ...SAMPLE_BASE,
    id: "p1",
    kind: "playlist",
    youtube_id: "PLsample1",
    title: "Una playlist curada de principio a fin",
    thumbnail_url: "https://i.ytimg.com/vi/tRsQsTMvPNg/hqdefault.jpg",
    video_count: 24,
    duration_seconds: null,
    vote_count: 31,
    language: "es",
  },
  {
    ...SAMPLE_BASE,
    id: "p2",
    kind: "playlist",
    youtube_id: "PLsample2",
    title: "Playlist sin miniatura",
    thumbnail_url: null,
    video_count: 1,
    duration_seconds: null,
    vote_count: 0,
    language: "es",
  },
];

function Demo({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-border pt-8">
      <SectionHeader size="sm" title={title} />
      {children}
    </section>
  );
}

function Row({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`flex flex-wrap items-center gap-3 ${className ?? "mb-3"}`}>
      <span className="w-full text-xs text-faint sm:w-28">{label}</span>
      {children}
    </div>
  );
}
