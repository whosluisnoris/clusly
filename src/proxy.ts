import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  detectLocale,
  isLocale,
  needsLocale,
  type Locale,
} from "@/lib/i18n/config";

// Proxy (antes "middleware" — renombrado en Next.js 16). Hace dos cosas:
//
//   1. Idioma: la plataforma pública vive bajo /es o /en. Si la URL llega sin
//      prefijo, se redirige al idioma que corresponda.
//   2. Sesión: refresca las cookies de Supabase para que no expiren y el estado
//      esté disponible en Server Components. No hace autorización — las rutas
//      protegidas verifican la sesión por su cuenta.

function pickLocale(request: NextRequest): Locale {
  // La elección manual manda: si el usuario cambió el idioma, no se le vuelve
  // a cambiar solo por lo que diga el navegador.
  const saved = request.cookies.get(LOCALE_COOKIE)?.value;
  if (isLocale(saved)) return saved;
  return detectLocale(request.headers.get("accept-language"));
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const skipsLocale = !needsLocale(pathname);

  if (!skipsLocale) {
    const first = pathname.split("/")[1];

    if (!isLocale(first)) {
      // Sin prefijo: redirige al idioma detectado conservando la ruta y la query.
      const locale = pickLocale(request);
      const url = request.nextUrl.clone();
      url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
      const redirect = NextResponse.redirect(url);
      redirect.cookies.set(LOCALE_COOKIE, locale, {
        maxAge: LOCALE_COOKIE_MAX_AGE,
        sameSite: "lax",
        path: "/",
      });
      return redirect;
    }
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    }
  );

  // Tocar getUser() dispara el refresco del token si hace falta.
  await supabase.auth.getUser();

  // Deja anotado el idioma de la URL para que navegar por el sitio en un idioma
  // lo recuerde en la próxima visita, sin tener que tocar el selector.
  if (!skipsLocale) {
    const first = pathname.split("/")[1];
    const current = isLocale(first) ? first : DEFAULT_LOCALE;
    if (request.cookies.get(LOCALE_COOKIE)?.value !== current) {
      response.cookies.set(LOCALE_COOKIE, current, {
        maxAge: LOCALE_COOKIE_MAX_AGE,
        sameSite: "lax",
        path: "/",
      });
    }
  }

  return response;
}

export const config = {
  matcher: [
    // Todas las rutas salvo estáticos, imágenes y assets con extensión.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
