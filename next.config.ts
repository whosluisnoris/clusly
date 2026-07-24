import type { NextConfig } from "next";

// Host del proyecto de Supabase, de donde salen las imágenes del blog
// (bucket público `blog`). Se deriva de la env en vez de escribirlo a mano para
// que siga funcionando si el proyecto cambia; si la variable falta o no es una
// URL, simplemente no se añade el patrón.
const supabaseHost = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").hostname;
  } catch {
    return null;
  }
})();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "i.ytimg.com", pathname: "/vi/**" },
      ...(supabaseHost
        ? ([
            {
              protocol: "https" as const,
              hostname: supabaseHost,
              pathname: "/storage/v1/object/public/**",
            },
          ])
        : []),
    ],
  },
};

export default nextConfig;
