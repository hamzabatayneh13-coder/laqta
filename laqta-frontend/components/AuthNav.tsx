"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
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

export function AuthNav() {
  const [token, setToken] = useState<string | null>(null);
  const [me, setMe] = useState<MeUser | null>(null);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const syncToken = () => setToken(readToken());
    syncToken();

    // Fast paint from cache, then refresh from server
    setMe(getCachedMe());
    refreshMe().then(setMe);

    const onAuth = async () => {
      syncToken();
      const next = await refreshMe();
      setMe(next);
    };

    const onMe = () => setMe(getCachedMe());
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

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!wrapperRef.current) return;
      if (wrapperRef.current.contains(e.target as Node)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const payload = useMemo(() => (token ? decodeJwt(token) : null), [token]);

  // ✅ Prefer freshest server role; fallback to token role
  const role = me?.role || payload?.role;
  const displayName =
    me?.fullName || payload?.fullName || payload?.name || "My Account";

  if (!token) {
    return (
      <Link
        className="rounded-xl bg-white/10 px-4 py-2 text-white ring-1 ring-white/10 hover:bg-white/15"
        href="/auth/login"
      >
        Login
      </Link>
    );
  }

  const canSell = role === "SELLER" || role === "ADMIN";

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-xl bg-white/10 px-4 py-2 text-white ring-1 ring-white/10 hover:bg-white/15"
      >
        {displayName}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-white/10 bg-[#070B14]/95 shadow-2xl backdrop-blur">
          {/* ✅ Seller/Admin can access seller features */}
          {canSell && (
            <>
              <Link
                href="/seller/auctions"
                onClick={() => setOpen(false)}
                className="block px-4 py-3 text-sm text-white/85 hover:bg-white/10"
              >
                My Auctions
              </Link>

              <Link
                href="/seller/auctions/new"
                onClick={() => setOpen(false)}
                className="block px-4 py-3 text-sm text-white/85 hover:bg-white/10"
              >
                New Auction
              </Link>
            </>
          )}

          {/* Everyone can have bids (buyer/seller/admin) */}
          <Link
            href="/my/bids"
            onClick={() => setOpen(false)}
            className="block px-4 py-3 text-sm text-white/85 hover:bg-white/10"
          >
            My Bids
          </Link>

          <Link
            href="/profile"
            onClick={() => setOpen(false)}
            className="block px-4 py-3 text-sm text-white/85 hover:bg-white/10"
          >
            My Account
          </Link>

          <button
            type="button"
            onClick={() => {
              sessionStorage.removeItem("laqta_token");
              sessionStorage.removeItem("laqta_me");
              window.dispatchEvent(new Event("laqta:auth"));
              window.dispatchEvent(new Event("laqta:me"));
              setOpen(false);
              window.location.href = "/auth/login";
            }}
            className="block w-full px-4 py-3 text-left text-sm text-white/85 hover:bg-white/10"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
