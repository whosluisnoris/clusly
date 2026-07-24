import { getCurrentUser } from "@/lib/auth";
import { OpinionForm } from "@/components/OpinionForm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Opiniones",
  description:
    "Cuéntanos qué te parece Clusly: qué te sirve, qué te falta y qué agregarías.",
};

// Sección de feedback. Es un buzón privado: lo que se escribe aquí llega solo
// al equipo (se lee en /admin → Opiniones), no se publica ni se muestran los
// conteos. Por eso la página es únicamente el formulario.
export default async function OpinionesPage() {
  const user = await getCurrentUser();

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-8">
      <div className="mb-8 flex items-start gap-4">
        <span
          className="brand-gradient mt-1.5 h-10 w-1.5 shrink-0 rounded-full"
          aria-hidden="true"
        />
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
            Opiniones
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            Clusly se construye con lo que dice quien la usa. Cuéntanos qué te
            sirve, qué te falta y qué agregarías.
          </p>
        </div>
      </div>

      <OpinionForm displayName={user?.displayName} />

      <p className="mt-6 rounded-2xl bg-surface p-5 text-sm text-muted ring-1 ring-border">
        🔒 Lo que escribas aquí <b className="text-foreground">no se publica</b>: llega
        directo al equipo de Clusly y lo leemos todo. Si quieres respuesta, deja tu
        correo en el mensaje.
      </p>
    </main>
  );
}
