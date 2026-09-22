"use client";

import { useState } from "react";
import { LocaleLink } from "@/components/LocaleLink";
import { useT } from "@/components/I18nProvider";
import type { SessionUser } from "@/lib/auth";
import { Avatar, ButtonLink, Card } from "@/components/ui";

// Controles de sesión para la barra de navegación. Sin sesión: enlaces de entrar
// y registro. Con sesión: botón para aportar video + menú con "Mis videos" y salir.
export function AuthNav({ user }: { user: SessionUser | null }) {
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const t = useT();

  async function logout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      window.location.assign("/");
    }
  }

  if (!user) {
    return (
      <div className="flex shrink-0 items-center gap-1.5">
        {/* Aportar está abierto sin cuenta: la sesión se pide al confirmar */}
        <ButtonLink href="/enviar" variant="soft" size="sm" className="hidden px-3.5 sm:inline-flex">
          {t.nav.submit}
        </ButtonLink>
        <ButtonLink href="/entrar" variant="ghost" size="sm" className="hidden px-3 sm:inline-flex">
          {t.nav.signIn}
        </ButtonLink>
        <ButtonLink href="/registro" variant="contrast" size="sm">
          {t.nav.signUp}
        </ButtonLink>
      </div>
    );
  }

  return (
    <div className="flex shrink-0 items-center gap-2">
      <ButtonLink href="/enviar" variant="soft" size="sm" className="hidden px-3.5 sm:inline-flex">
        {t.nav.submit}
      </ButtonLink>

      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label={user.displayName}
          title={user.displayName}
          className="rounded-full transition hover:brightness-125 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-95"
        >
          <Avatar name={user.displayName} />
        </button>

        {open && (
          <>
            <button
              type="button"
              aria-hidden="true"
              tabIndex={-1}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 cursor-default"
            />
            <Card
              role="menu"
              variant="glass"
              padding="none"
              className="absolute right-0 z-50 mt-2 w-56 rounded-xl p-1.5 shadow-xl"
            >
              <div className="truncate px-3 py-2 text-xs text-faint">{user.email}</div>
              <MenuLink href="/perfil" onClick={() => setOpen(false)}>
                {t.nav.myProfile}
              </MenuLink>
              <MenuLink href="/guardados" onClick={() => setOpen(false)}>
                {t.nav.saved}
              </MenuLink>
              <MenuLink href="/mis-videos" onClick={() => setOpen(false)}>
                {t.nav.myVideos}
              </MenuLink>
              <MenuLink href="/enviar" onClick={() => setOpen(false)}>
                {t.nav.submitShort}
              </MenuLink>
              <button
                type="button"
                role="menuitem"
                onClick={logout}
                disabled={loggingOut}
                className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-muted transition hover:bg-fill hover:text-foreground disabled:opacity-60"
              >
                {loggingOut ? t.nav.signingOut : t.nav.signOut}
              </button>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

function MenuLink({
  href,
  onClick,
  children,
}: {
  href: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <LocaleLink
      href={href}
      role="menuitem"
      onClick={onClick}
      className="block rounded-lg px-3 py-2 text-sm font-medium text-foreground transition hover:bg-fill"
    >
      {children}
    </LocaleLink>
  );
}
