"use client";

import { useEffect, useRef, useState } from "react";
import { CategoryIcon } from "@/components/CategoryIcon";

// Anchos de los renglones grises de cada video (solo decorativos).
const ROWS = ["78%", "64%", "82%", "58%"];

// Cada cuánto se completa un video, y la pausa con la ruta ya terminada.
const STEP_MS = 1500;
const DONE_MS = 2600;

// Paso con el que llega el HTML del servidor, antes de que arranque el ciclo.
const INITIAL_STEP = 2;

// Tarjeta ilustrativa del hero: una ruta que se completa video a video. No son
// videos reales (por eso los renglones grises y la etiqueta de "ejemplo"):
// enseña la idea de avanzar en orden sin gastar un párrafo en explicarla.
//
// Todo cuelga de un único estado, `step`: al cambiar, en el mismo render se
// actualizan la barra, el contador, el resaltado y los ✓, así que se mueven a
// la vez. Solo hay transiciones de CSS entre un paso y el siguiente.
//
// Con "reducir movimiento" la ruta sigue avanzando (es información, no
// adorno), pero sin transiciones: cada paso cambia de golpe. El ciclo se para
// mientras la tarjeta no está en pantalla o la pestaña está oculta.
export function RoutePreview({
  topicName,
  sampleLabel,
  nextLabel,
  progressLabels,
  color,
}: {
  topicName: string;
  sampleLabel: string;
  nextLabel: string;
  /** Una etiqueta por paso: "0 de 4", "1 de 4", … "4 de 4". */
  progressLabels: string[];
  color: string;
}) {
  const total = ROWS.length;
  const [step, setStep] = useState(INITIAL_STEP);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // El ciclo lleva su propio contador y lo publica con `setStep`: un único
    // cambio por paso, del que sale todo lo demás.
    let current = INITIAL_STEP;
    let visible = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const stop = () => clearTimeout(timer);
    const run = () => {
      stop();
      if (!visible || document.hidden) return;
      timer = setTimeout(() => {
        current = current >= total ? 0 : current + 1;
        setStep(current);
        run();
      }, current >= total ? DONE_MS : STEP_MS);
    };

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      run();
    });
    observer.observe(el);
    document.addEventListener("visibilitychange", run);

    return () => {
      stop();
      observer.disconnect();
      document.removeEventListener("visibilitychange", run);
    };
  }, [total]);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="flex flex-col gap-3 rounded-[18px] bg-surface p-4 ring-1 ring-border sm:gap-4 sm:rounded-[20px] sm:p-6"
      style={{ ["--line" as string]: color }}
    >
      <div className="flex items-center gap-2.5">
        <span className="hidden sm:block" style={{ color: "var(--line)" }}>
          <CategoryIcon slug="web" className="h-5 w-5" />
        </span>
        <span className="font-display flex-1 text-base font-bold text-foreground sm:text-lg">
          {topicName} · {sampleLabel}
        </span>
        <span className="text-[13px] tabular-nums text-muted">{progressLabels[step]}</span>
      </div>

      <div className="h-1 overflow-hidden rounded-full bg-fill-strong">
        <div
          className="h-1 rounded-full transition-[width] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
          style={{ width: `${(step / total) * 100}%`, backgroundColor: "var(--line)" }}
        />
      </div>

      <div className="flex flex-col gap-2">
        {ROWS.map((w, i) => {
          const done = i < step;
          const next = i === step;
          return (
            <div
              key={i}
              className={`flex items-center gap-3 rounded-xl p-2 ring-1 transition-colors duration-500 motion-reduce:transition-none sm:gap-3.5 sm:p-2.5 ${
                next ? "bg-fill ring-border" : "bg-transparent ring-transparent"
              }`}
            >
              <span className="grid h-[42px] w-[72px] shrink-0 place-items-center rounded-md bg-surface-2 sm:h-[54px] sm:w-24 sm:rounded-lg">
                <svg
                  viewBox="0 0 24 24"
                  className={`h-4 w-4 fill-current transition-colors duration-500 motion-reduce:transition-none ${
                    next ? "text-accent" : "text-faint"
                  }`}
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              </span>
              <span
                className={`flex flex-1 flex-col gap-2 transition-opacity duration-500 motion-reduce:transition-none ${
                  done ? "opacity-55" : "opacity-100"
                }`}
              >
                <span className="block h-2.5 rounded-full bg-border-strong" style={{ width: w }} />
                <span className="block h-2 w-[36%] rounded-full bg-border" />
              </span>
              {/* ✓ y "Siguiente" comparten hueco: el paso decide cuál se ve */}
              <span className="relative h-7 w-[84px] shrink-0">
                <span
                  className={`absolute right-0 top-0 grid h-7 w-7 place-items-center rounded-full transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] motion-reduce:transition-none ${
                    done ? "scale-100 opacity-100" : "scale-40 opacity-0"
                  }`}
                  style={{
                    color: "var(--line)",
                    backgroundColor: "color-mix(in srgb, var(--line) 16%, transparent)",
                  }}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.4}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-3.5 w-3.5"
                  >
                    <path d="M5 12l5 5L20 7" />
                  </svg>
                </span>
                <span
                  className={`absolute right-0 top-0 flex h-7 items-center rounded-full bg-accent px-3 text-xs font-bold text-on-accent transition-[opacity,transform] duration-500 motion-reduce:transition-none ${
                    next ? "translate-y-0 opacity-100" : "translate-y-1.5 opacity-0"
                  }`}
                >
                  {nextLabel}
                </span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
