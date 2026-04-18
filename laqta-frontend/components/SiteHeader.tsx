"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AuthNav } from "./AuthNav";

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

  useEffect(() => {
    const sync = () => setToken(readToken());
    sync();

    const onAuth = () => sync();
    window.addEventListener("laqta:auth", onAuth);

    return () => {
      window.removeEventListener("laqta:auth", onAuth);
    };
  }, []);

  const payload = useMemo(() => (token ? decodeJwt(token) : null), [token]);
  const role = payload?.role;

  // ✅ Sell should be ONLY "New Auction"
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

          {/* ✅ Admin is visible ONLY for admins */}
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
