"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AuthNav } from "./AuthNav";
import { getCachedMe, refreshMe, type MeUser } from "@/lib/me";

type JwtPayload = {
  sub?: string;
  role?: string;
  fullName?: string;
  name?: string;
  exp?: number;
  iat?: number;
};

function decodeJwt(token: string): JwtPayload | null {
  try {
    const payload = token.split(".")[1];
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function readToken() {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem("laqta_token");
}

export default function SiteHeader() {
  const [token, setToken] = useState<string | null>(null);
  const [me, setMe] = useState<MeUser | null>(null);

  useEffect(() => {
    const syncToken = () => setToken(readToken());
    syncToken();

    // load cached me immediately (fast UI)
    setMe(getCachedMe());

    const onAuth = async () => {
      syncToken();
      const next = await refreshMe();
      setMe(next);
    };

    const onMe = () => setMe(getCachedMe());

    // refresh on mount (so role updates without relogin)
    refreshMe().then(setMe);

    // refresh when user returns to the tab
    const onFocus = () => refreshMe().then(setMe);

    window.addEventListener("laqta:auth", onAuth);
    window.addEventListener("laqta:me", onMe);
    window.addEventListener("focus", onFocus);

    return () => {
      window.removeEventListener("laqta:auth", onAuth);
      window.removeEventListener("laqta:me", onMe);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  const payload = useMemo(() => (token ? decodeJwt(token) : null), [token]);

  // ✅ role now comes from server /auth/me (fresh), fallback to token if needed
  const role = me?.role || payload?.role;

  const sellHref =
    !token
      ? "/auth/login"
      : role === "SELLER" || role === "ADMIN"
        ? "/seller/auctions/new"
        : "/seller/onboarding";

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/20 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-white/10 ring-1 ring-white/10" />
          <div className="leading-tight">
            <div className="text-base font-extrabold">Laqta (لقطة)</div>
            <div className="text-xs text-white/60">Jordan Auction Hub</div>
          </div>
        </Link>

        <nav className="flex items-center gap-5 text-sm font-semibold text-white/80">
          <Link className="hover:text-[#FF7A1A]" href="/auctions/live">
            Live Auctions
          </Link>

          <Link className="hover:text-[#FF7A1A]" href={sellHref}>
            Sell
          </Link>

          {role === "ADMIN" && (
            <Link className="hover:text-[#FF7A1A]" href="/admin">
              Admin
            </Link>
          )}

          <AuthNav />
        </nav>
      </div>
    </header>
  );
}
