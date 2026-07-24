import type { ReactNode } from "react";

// Renderizador de un subconjunto de Markdown para los artículos del blog.
//
// Devuelve **nodos de React**, nunca HTML crudo: no hay `dangerouslySetInnerHTML`
// en ninguna parte, así que un artículo no puede inyectar etiquetas ni scripts
// por más que lo intente. Los enlaces además solo se pintan si son http/https.
//
// Soporta: encabezados (#, ##, ###), listas (- / 1.), citas (>), separadores
// (---), bloques de código (```) y párrafos; en línea: **negrita**, *cursiva*,
// `código` y [enlaces](https://…).

const INLINE_RE = /(\*\*[^*]+\*\*|\*[^*\n]+\*|`[^`]+`|\[[^\]]+\]\([^)\s]+\))/g;
const LINK_RE = /^\[([^\]]+)\]\(([^)\s]+)\)$/;

function isSafeHref(url: string): boolean {
  try {
    const { protocol } = new URL(url);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

// Texto con marcas en línea → nodos. Lo que no coincida se deja tal cual.
function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const parts = text.split(INLINE_RE).filter((p) => p !== "");

  return parts.map((part, i) => {
    const key = `${keyPrefix}-${i}`;

    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={key} className="font-bold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={key}
          className="rounded bg-fill-strong px-1.5 py-0.5 font-mono text-[0.9em]"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    const link = part.match(LINK_RE);
    if (link) {
      const [, label, href] = link;
      // Un enlace que no sea http/https se degrada a texto plano.
      if (!isSafeHref(href)) return <span key={key}>{label}</span>;
      return (
        <a
          key={key}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent-ink underline decoration-2 underline-offset-2 hover:opacity-80"
        >
          {label}
        </a>
      );
    }

    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return <em key={key}>{part.slice(1, -1)}</em>;
    }

    return <span key={key}>{part}</span>;
  });
}

// Agrupa las líneas en bloques y pinta cada uno.
export function Markdown({ children }: { children: string }) {
  const lines = children.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];

  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Línea vacía: separa bloques.
    if (trimmed === "") {
      i += 1;
      continue;
    }

    // Bloque de código: ```…```
    if (trimmed.startsWith("```")) {
      const code: string[] = [];
      i += 1;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        code.push(lines[i]);
        i += 1;
      }
      i += 1; // cierra el bloque (o llegamos al final del texto)
      blocks.push(
        <pre
          key={key++}
          className="custom-scroll my-5 overflow-x-auto rounded-xl bg-elevated p-4 text-sm ring-1 ring-border"
        >
          <code className="font-mono text-foreground">{code.join("\n")}</code>
        </pre>
      );
      continue;
    }

    // Separador
    if (/^-{3,}$/.test(trimmed)) {
      blocks.push(<hr key={key++} className="my-8 border-border" />);
      i += 1;
      continue;
    }

    // Encabezados
    const heading = trimmed.match(/^(#{1,3})\s+(.*)$/);
    if (heading) {
      const [, hashes, text] = heading;
      const content = renderInline(text, `h${key}`);
      if (hashes.length === 1) {
        blocks.push(
          <h2 key={key++} className="mt-10 text-2xl font-black text-foreground">
            {content}
          </h2>
        );
      } else if (hashes.length === 2) {
        blocks.push(
          <h3 key={key++} className="mt-8 text-xl font-bold text-foreground">
            {content}
          </h3>
        );
      } else {
        blocks.push(
          <h4 key={key++} className="mt-6 text-base font-bold text-foreground">
            {content}
          </h4>
        );
      }
      i += 1;
      continue;
    }

    // Cita
    if (trimmed.startsWith("> ")) {
      const quote: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("> ")) {
        quote.push(lines[i].trim().slice(2));
        i += 1;
      }
      blocks.push(
        <blockquote
          key={key++}
          className="my-5 border-l-4 border-accent/50 pl-4 text-muted italic"
        >
          {renderInline(quote.join(" "), `q${key}`)}
        </blockquote>
      );
      continue;
    }

    // Lista con viñetas
    if (/^[-*]\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*]\s+/, ""));
        i += 1;
      }
      blocks.push(
        <ul key={key++} className="my-4 list-disc space-y-1.5 pl-5 text-muted">
          {items.map((item, n) => (
            <li key={n}>{renderInline(item, `ul${key}-${n}`)}</li>
          ))}
        </ul>
      );
      continue;
    }

    // Lista numerada
    if (/^\d+\.\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s+/, ""));
        i += 1;
      }
      blocks.push(
        <ol key={key++} className="my-4 list-decimal space-y-1.5 pl-5 text-muted">
          {items.map((item, n) => (
            <li key={n}>{renderInline(item, `ol${key}-${n}`)}</li>
          ))}
        </ol>
      );
      continue;
    }

    // Párrafo: líneas seguidas hasta la próxima línea en blanco.
    const paragraph: string[] = [];
    while (i < lines.length && lines[i].trim() !== "") {
      paragraph.push(lines[i].trim());
      i += 1;
    }
    blocks.push(
      <p key={key++} className="my-4 leading-relaxed text-muted">
        {renderInline(paragraph.join(" "), `p${key}`)}
      </p>
    );
  }

  return <>{blocks}</>;
}
