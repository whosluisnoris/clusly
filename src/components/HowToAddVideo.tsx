"use client";

import { useRef, useState } from "react";
import { LocaleLink } from "@/components/LocaleLink";
import { useT } from "@/components/I18nProvider";

// A partir de aquí la lista y la pantalla van en dos columnas (`lg`), que es
// donde el cursor manda y no hace falta desplegar nada.
const DESKTOP = "(min-width: 1024px)";

// Aire entre la barra superior y el paso al que se desplaza.
const SCROLL_GAP = 12;

// El cursor solo manda en la disposición de dos columnas. Debajo de `lg` la
// selección es por toque: si el cursor también contara, el desplazamiento suave
// haría pasar otros pasos por debajo del puntero y le robarían la selección al
// paso recién tocado a media animación.
function isDesktop() {
  return window.matchMedia(DESKTOP).matches;
}

// Cómo aportar un video, contado en cuatro pasos: a la izquierda la lista, a la
// derecha la pantalla de ese paso. Al pasar el cursor por un paso (o al
// enfocarlo con el teclado, o al tocarlo en móvil) la pantalla cambia.
//
// Las pantallas no son capturas: se dibujan con los mismos tokens de color y
// los mismos textos que el formulario real (`t.submit.*`), así que siguen el
// tema claro/oscuro y el idioma sin mantenimiento aparte, y no se quedan
// desactualizadas cuando el formulario cambia de palabras.
//
// En escritorio la pantalla vive en una columna pegajosa a la derecha; en móvil
// no hay cursor que pasar, así que la del paso activo se despliega debajo de él.
export function HowToAddVideo({ categories }: { categories: string[] }) {
  const t = useT();
  const [active, setActive] = useState(0);
  const items = useRef<(HTMLLIElement | null)[]>([]);
  const panels = useRef<(HTMLDivElement | null)[]>([]);

  const steps = [
    { n: "01", title: t.landing.howToStep1Title, text: t.landing.howToStep1Text },
    { n: "02", title: t.landing.howToStep2Title, text: t.landing.howToStep2Text },
    { n: "03", title: t.landing.howToStep3Title, text: t.landing.howToStep3Text },
    { n: "04", title: t.landing.howToStep4Title, text: t.landing.howToStep4Text },
  ];

  // En móvil, al tocar un paso este sube hasta justo debajo de la barra, para
  // que él y su pantalla ocupen la vista sin que haya que buscarlos.
  //
  // El desplazamiento se calcula en el clic, antes de que la animación mueva
  // nada: si el paso que se cierra estaba por encima, al plegarse sube todo lo
  // que hay debajo, así que se descuenta su alto a mano. Medir después no
  // sirve: durante el medio segundo de transición la geometría está a medias.
  function selectStep(index: number) {
    const previous = active;
    setActive(index);

    // En escritorio la pantalla vive en la columna pegajosa: nada que mover.
    if (window.matchMedia(DESKTOP).matches) return;

    const item = items.current[index];
    if (!item) return;

    // Los cuatro paneles miden lo mismo, así que cualquiera sirve de medida.
    // `offsetHeight` ignora los transforms y da el alto real aunque esté plegado.
    const collapsing = previous < index ? (panels.current[previous]?.offsetHeight ?? 0) : 0;
    const header = document.querySelector("header")?.offsetHeight ?? 0;
    const top =
      item.getBoundingClientRect().top + window.scrollY - header - collapsing - SCROLL_GAP;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: Math.max(top, 0), behavior: reduceMotion ? "auto" : "smooth" });
  }

  return (
    <section className="mx-auto w-full max-w-[1500px] px-5 py-12 sm:px-8">
      <div className="max-w-2xl">
        <p className="text-xs uppercase tracking-[0.25em] text-muted">
          {t.landing.howToEyebrow}
        </p>
        <h2 className="mt-4 text-3xl font-black tracking-tight text-foreground sm:text-4xl">
          {t.landing.howToTitle}
        </h2>
        <p className="mt-4 text-base leading-relaxed text-muted">
          {t.landing.howToSubtitle}
        </p>
      </div>

      <div className="mt-10 grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-16">
        {/* Pasos */}
        <div>
          <ol className="border-t border-border">
            {steps.map((step, i) => {
              const on = i === active;
              return (
                <li
                  key={step.n}
                  ref={(el) => {
                    items.current[i] = el;
                  }}
                  className="relative border-b border-border"
                >
                  {/* Marca de acento del paso activo */}
                  <span
                    aria-hidden="true"
                    className={`absolute left-0 top-0 h-full w-[3px] transition ${
                      on ? "bg-accent" : "bg-transparent"
                    }`}
                  />
                  <button
                    type="button"
                    onMouseEnter={() => isDesktop() && setActive(i)}
                    onFocus={() => isDesktop() && setActive(i)}
                    onClick={() => selectStep(i)}
                    aria-pressed={on}
                    className={`flex w-full items-start gap-4 py-6 pl-5 pr-2 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 ${
                      on ? "bg-fill" : "hover:bg-fill"
                    }`}
                  >
                    <span
                      className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-bold tabular-nums transition ${
                        on
                          ? "bg-accent text-on-accent"
                          : "bg-fill text-muted ring-1 ring-border"
                      }`}
                    >
                      {step.n}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className={`font-display block text-xl font-bold tracking-tight transition sm:text-2xl ${
                          on ? "text-foreground" : "text-muted"
                        }`}
                      >
                        {step.title}
                      </span>
                      <span className="mt-1.5 block text-sm leading-relaxed text-muted">
                        {step.text}
                      </span>
                    </span>
                  </button>

                  {/* Móvil: la pantalla del paso, que se despliega debajo de él.
                      Las cuatro se quedan montadas y se animan con `grid-rows`
                      de 0fr a 1fr, que es la forma de llegar al alto natural
                      del contenido: hacia `height: auto` no se puede animar, y
                      montarla y desmontarla la hacía aparecer de golpe. */}
                  <div
                    aria-hidden="true"
                    className={`grid overflow-hidden transition-[grid-template-rows] duration-500 ease-out motion-reduce:transition-none lg:hidden ${
                      on ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                    }`}
                  >
                    <div className="min-h-0">
                      <div
                        ref={(el) => {
                          panels.current[i] = el;
                        }}
                        className={`px-5 pb-6 transition-[opacity,transform] duration-500 ease-out motion-reduce:transition-none ${
                          on ? "translate-y-0 opacity-100" : "-translate-y-3 opacity-0"
                        }`}
                      >
                        {/* Alto atado a la vista para que el paso y su pantalla
                            llenen la pantalla del teléfono, con suelo para que
                            la maqueta no se recorte y techo para que en
                            pantallas muy altas no se estire de más. */}
                        <div className="h-[clamp(21rem,58vh,30rem)] w-full">
                          <StepShot index={i} categories={categories} />
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>

          <div className="mt-8">
            <LocaleLink
              href="/enviar"
              className="brand-gradient inline-block rounded-full px-6 py-3 text-sm font-bold text-on-accent shadow-lg shadow-black/20 transition hover:brightness-110 active:scale-95"
            >
              {t.nav.submit}
            </LocaleLink>
          </div>
        </div>

        {/* Escritorio: las cuatro pantallas apiladas, visible la del paso activo */}
        <div className="hidden lg:sticky lg:top-24 lg:block">
          <div className="relative">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -inset-6 -z-10 rounded-[2rem] bg-accent/10 blur-2xl"
            />
            <div className="relative mx-auto aspect-[16/10] w-full max-w-[38rem]">
              {steps.map((step, i) => (
                <div
                  key={step.n}
                  aria-hidden="true"
                  className={`absolute inset-0 transition-all duration-500 ease-out motion-reduce:transition-none ${
                    i === active
                      ? "translate-y-0 scale-100 opacity-100"
                      : "pointer-events-none translate-y-2 scale-[0.98] opacity-0"
                  }`}
                >
                  <StepShot index={i} categories={categories} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function StepShot({ index, categories }: { index: number; categories: string[] }) {
  switch (index) {
    case 0:
      return <ShotCopyLink />;
    case 1:
      return <ShotPaste />;
    case 2:
      return <ShotClassify categories={categories} />;
    default:
      return <ShotPublish />;
  }
}

// Marco de ventana común a las cuatro pantallas: barra con la URL y el lienzo.
// `urlSelected` pinta la URL como recién seleccionada, para el paso de copiar.
function Frame({
  url,
  urlSelected = false,
  children,
}: {
  url: string;
  urlSelected?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl bg-surface shadow-2xl shadow-black/20 ring-1 ring-border">
      <div className="flex shrink-0 items-center gap-2.5 border-b border-border px-3 py-2.5">
        <span className="flex gap-1.5">
          <span className="h-2 w-2 rounded-full bg-border-strong" />
          <span className="h-2 w-2 rounded-full bg-border-strong" />
          <span className="h-2 w-2 rounded-full bg-border-strong" />
        </span>
        <span
          className={`flex min-w-0 flex-1 items-center gap-2 rounded-full px-3 py-1 text-[11px] ${
            urlSelected
              ? "bg-accent/20 text-accent-ink ring-1 ring-accent/40"
              : "bg-fill text-muted"
          }`}
        >
          <span className="truncate">{url}</span>
          {urlSelected && <CopyIcon />}
        </span>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-3.5 overflow-hidden p-5">
        {children}
      </div>
    </div>
  );
}

// 01 — El enlace, ya seleccionado en YouTube.
function ShotCopyLink() {
  return (
    <Frame url="youtube.com/watch?v=…" urlSelected>
      <div className="relative min-h-0 flex-1 overflow-hidden rounded-lg bg-fill ring-1 ring-border">
        <span className="absolute inset-0 grid place-items-center">
          <span className="grid h-10 w-14 place-items-center rounded-xl bg-accent text-on-accent shadow-lg shadow-black/20">
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        </span>
      </div>
      <div className="flex shrink-0 flex-col gap-2">
        <Bar className="w-3/4" strong />
        <Bar className="w-1/2" />
      </div>
    </Frame>
  );
}

// 02 — El enlace pegado en el formulario, con lo que Clusly saca solo de él.
function ShotPaste() {
  const t = useT();
  return (
    <Frame url="clusly.com/enviar">
      <Label>{t.submit.urlLabel}</Label>
      <div className="flex items-center gap-0.5 rounded-lg bg-background px-3 py-2.5 text-[13px] text-foreground ring-2 ring-accent/50">
        <span className="truncate">https://youtube.com/watch?v=…</span>
        <span className="h-4 w-px shrink-0 bg-accent" />
      </div>
      <div className="text-[11px] leading-relaxed text-faint">{t.submit.urlHint}</div>

      {/* Lo que sale del enlace sin que nadie lo escriba */}
      <CardRow />

      <SubmitButton>{t.submit.submitButton}</SubmitButton>
    </Frame>
  );
}

// 03 — Categorías e idioma, tal cual se eligen en el formulario.
function ShotClassify({ categories }: { categories: string[] }) {
  const t = useT();
  const chips = categories.slice(0, 5);

  return (
    <Frame url="clusly.com/enviar">
      <Label>{t.submit.categoriesLabel}</Label>
      <div className="flex flex-wrap gap-1.5">
        {chips.length > 0
          ? chips.map((name, i) => (
              <span
                key={i}
                className={`max-w-[9rem] truncate rounded-full px-3 py-1.5 text-[12px] font-medium ${
                  i < 2
                    ? "bg-accent text-on-accent"
                    : "bg-fill text-muted ring-1 ring-border"
                }`}
              >
                {i < 2 ? `✓ ${name}` : name}
              </span>
            ))
          : // Catálogo sin categorías todavía: chips en blanco, sin inventar nombres.
            PLACEHOLDER_CHIPS.map((width, i) => (
              <span
                key={i}
                style={{ width }}
                className={`h-7 rounded-full ${
                  i < 2 ? "bg-accent" : "bg-fill ring-1 ring-border"
                }`}
              />
            ))}
      </div>

      <Label className="mt-2">{t.language.videoLabel}</Label>
      <div className="flex gap-2">
        <span className="rounded-full bg-accent px-3.5 py-1.5 text-[12px] font-medium text-on-accent">
          {t.language.videoEs}
        </span>
        <span className="rounded-full bg-fill px-3.5 py-1.5 text-[12px] font-medium text-muted ring-1 ring-border">
          {t.language.videoEn}
        </span>
      </div>

      <SubmitButton>{t.submit.submitButton}</SubmitButton>
    </Frame>
  );
}

const PLACEHOLDER_CHIPS = ["4.5rem", "6rem", "5rem", "7rem", "4rem"];

// 04 — Publicado: el aviso de éxito y el video ya en el catálogo, con sus votos.
function ShotPublish() {
  const t = useT();
  return (
    <Frame url="clusly.com/todo">
      <div className="shrink-0 rounded-lg bg-accent/10 p-3 text-[12px] font-semibold leading-relaxed text-foreground ring-1 ring-accent/25">
        {t.submit.successTitle}
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-2">
        <CardRow votes="128" />
        <CardRow votes="96" muted />
        <CardRow votes="71" muted />
      </div>
    </Frame>
  );
}

// Renglón gris de "texto" para las maquetas.
function Bar({ className, strong = false }: { className: string; strong?: boolean }) {
  return (
    <span
      className={`block rounded-full ${
        strong ? "h-2.5 bg-border-strong" : "h-2 bg-border"
      } ${className}`}
    />
  );
}

function Label({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`shrink-0 text-[11px] font-semibold uppercase tracking-wide text-muted ${className}`}
    >
      {children}
    </div>
  );
}

function SubmitButton({ children }: { children: React.ReactNode }) {
  return (
    <div className="brand-gradient mt-auto w-fit shrink-0 rounded-full px-4 py-2 text-[12px] font-bold text-on-accent shadow-lg shadow-black/20">
      {children}
    </div>
  );
}

// Fila de un recurso: miniatura, título y (donde toca) su control de votos.
function CardRow({ votes, muted = false }: { votes?: string; muted?: boolean }) {
  return (
    <div
      className={`flex shrink-0 items-center gap-3 rounded-lg p-2.5 ring-1 ${
        muted ? "opacity-50 ring-border" : "bg-fill ring-border"
      }`}
    >
      <span className="h-10 w-16 shrink-0 rounded-md bg-border" />
      <span className="flex min-w-0 flex-1 flex-col gap-1.5">
        <Bar className="w-4/5" strong />
        <Bar className="w-2/5" />
      </span>
      {votes && (
        <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-background px-1.5 py-1 text-[11px] ring-1 ring-border">
          <span className={muted ? "text-muted" : "text-accent-ink"}>▲</span>
          <span
            className={`font-bold tabular-nums ${muted ? "text-foreground" : "text-accent-ink"}`}
          >
            {votes}
          </span>
          <span className="text-muted">▼</span>
        </span>
      )}
    </div>
  );
}

function CopyIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="ml-auto h-3.5 w-3.5 shrink-0"
      aria-hidden="true"
    >
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h8" />
    </svg>
  );
}

