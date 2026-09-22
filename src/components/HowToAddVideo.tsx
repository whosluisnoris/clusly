import type { Dictionary } from "@/lib/i18n";
import { ButtonLink, cn, containerClasses } from "@/components/ui";

// Cómo aportar un video, en una franja compacta: título, cuatro pasos de una
// línea y un botón. Es el único sitio de la landing con números, porque es el
// único que de verdad es una secuencia.
export function HowToAddVideo({ t }: { t: Dictionary }) {
  const steps = [
    t.landing.howToStep1,
    t.landing.howToStep2,
    t.landing.howToStep3,
    t.landing.howToStep4,
  ];

  return (
    <section className={cn(containerClasses(), "pt-12 sm:pt-20")}>
      <div className="grid gap-6 border-y border-border py-8 sm:py-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:items-center lg:gap-16">
        <div className="flex flex-col items-start">
          <h2 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            {t.landing.howToTitle}
          </h2>
          <p className="mt-2 text-[15px] text-muted sm:mt-2.5 sm:text-base">
            {t.landing.howToSubtitle}
          </p>
          <ButtonLink href="/enviar" variant="secondary" className="mt-6 hidden lg:inline-flex">
            {t.landing.howToCta}
          </ButtonLink>
        </div>

        <ol className="flex flex-col gap-3.5 sm:grid sm:grid-cols-4 sm:gap-0">
          {steps.map((step, i) => (
            <li key={i} className="flex items-center gap-3.5 sm:flex-col sm:items-stretch sm:gap-3.5 sm:pr-5">
              <span className="flex items-center gap-3">
                <span className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-full text-[13px] font-bold text-complement ring-[1.5px] ring-inset ring-current sm:h-8 sm:w-8 sm:text-sm">
                  {i + 1}
                </span>
                {i < steps.length - 1 && (
                  <span aria-hidden="true" className="hidden h-px flex-1 bg-border sm:block" />
                )}
              </span>
              <span className="text-[15px] font-semibold leading-snug text-foreground sm:text-base">
                {step}
              </span>
            </li>
          ))}
        </ol>

        <ButtonLink href="/enviar" variant="secondary" block className="lg:hidden">
          {t.landing.howToCta}
        </ButtonLink>
      </div>
    </section>
  );
}
