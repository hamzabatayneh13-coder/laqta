"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

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
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const sync = () => setToken(readToken());
    sync();
    const onAuth = () => sync();
    window.addEventListener("laqta:auth", onAuth);
    return () => window.removeEventListener("laqta:auth", onAuth);
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
  const role = payload?.role;
  const displayName = payload?.fullName || payload?.name || "My Account";

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
              window.dispatchEvent(new Event("laqta:auth"));
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
