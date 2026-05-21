"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { AuthNav } from "./AuthNav";
import { getCachedMe, refreshMe, type MeUser } from "@/lib/me";
import { apiFetch } from "@/lib/api";

type JwtPayload = {
  sub?: string;
  role?: string;
  fullName?: string;
  name?: string;
  exp?: number;
  iat?: number;
};

type Category = {
  id: string | number;
  slug: string;
  nameEn: string;
  nameAr: string;
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
  const router = useRouter();

  const [token, setToken] = useState<string | null>(null);
  const [me, setMe] = useState<MeUser | null>(null);

  // ✅ Categories dropdown state
  const [categories, setCategories] = useState<Category[]>([]);
  const [catOpen, setCatOpen] = useState(false);
  const catRef = useRef<HTMLDivElement | null>(null);

  // ✅ Sell modal state
  const [showSellerModal, setShowSellerModal] = useState(false);
  const [becomingSeller, setBecomingSeller] = useState(false);
  const [sellerErr, setSellerErr] = useState<string | null>(null);

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

  // ✅ Load categories once
  useEffect(() => {
    (async () => {
      try {
        const data = (await apiFetch("/api/categories")) as Category[];
        setCategories(Array.isArray(data) ? data : []);
      } catch {
        setCategories([]);
      }
    })();
  }, []);

  // ✅ Close categories dropdown on outside click
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!catRef.current) return;
      if (catRef.current.contains(e.target as Node)) return;
      setCatOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const payload = useMemo(() => (token ? decodeJwt(token) : null), [token]);

  // ✅ role now comes from server /auth/me (fresh), fallback to token if needed
  const role = me?.role || payload?.role; // BUYER | SELLER | ADMIN

  // ✅ Sell button logic
  const onSellClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // If not logged in → allow normal navigation to login
    if (!token) return;

    // If already seller/admin → allow normal navigation to create auction
    if (role === "SELLER" || role === "ADMIN") return;

    // Otherwise: buyer → open modal (no navigation)
    e.preventDefault();
    setSellerErr(null);
    setShowSellerModal(true);
  };

  async function confirmBecomeSeller() {
    setSellerErr(null);
    setBecomingSeller(true);

    try {
      await apiFetch("/users/become-seller", { method: "POST" });

      // refresh role immediately
      const next = await refreshMe();
      setMe(next);

      setShowSellerModal(false);

      // ✅ go to create auction page (same tab)
      router.push("/seller/auctions/new");
    } catch (err: any) {
      setSellerErr(err?.message || "Failed to become a seller. Please try again.");
    } finally {
      setBecomingSeller(false);
    }
  }

  function declineBecomeSeller() {
    setShowSellerModal(false);
    // ✅ if he does NOT want to be a seller → go to live auctions
    router.push("/auctions/live");
  }

  const sellHref =
    !token
      ? "/auth/login"
      : role === "SELLER" || role === "ADMIN"
        ? "/seller/auctions/new"
        : "/seller/auctions/new"; // buyer will be intercepted by onSellClick

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

          {/* ✅ Categories for everyone */}
          <div className="relative" ref={catRef}>
            <button
              type="button"
              onClick={() => setCatOpen((v) => !v)}
              className="hover:text-[#FF7A1A]"
            >
              Categories
            </button>

            {catOpen && (
              <div className="absolute left-0 mt-2 w-64 overflow-hidden rounded-2xl border border-white/10 bg-[#070B14]/95 shadow-2xl backdrop-blur">
                <Link
                  href="/auctions/live"
                  onClick={() => setCatOpen(false)}
                  className="block px-4 py-3 text-sm text-white/85 hover:bg-white/10"
                >
                  All Categories
                </Link>

                <div className="h-px bg-white/10" />

                {categories.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-white/70">No categories</div>
                ) : (
                  categories.map((c) => (
                    <Link
                      key={String(c.id)}
                      href={`/auctions/live?category=${encodeURIComponent(c.slug)}`}
                      onClick={() => setCatOpen(false)}
                      className="block px-4 py-3 text-sm text-white/85 hover:bg-white/10"
                    >
                      {c.nameEn} <span className="text-white/50">({c.nameAr})</span>
                    </Link>
                  ))
                )}
              </div>
            )}
          </div>

          {/* ✅ Sell: buyer opens modal */}
          <Link className="hover:text-[#FF7A1A]" href={sellHref} onClick={onSellClick}>
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

      {/* ✅ Improved centered + safe modal */}
      {showSellerModal && (
        <div className="fixed inset-0 z-[9999]">
          {/* Backdrop (click closes) */}
          <button
            aria-label="Close"
            className="absolute inset-0 cursor-default bg-black/60 backdrop-blur-sm"
            onClick={() => !becomingSeller && setShowSellerModal(false)}
          />

          {/* Center wrapper */}
          <div className="relative flex min-h-full items-center justify-center p-4 sm:p-6">
            <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#070B14] shadow-2xl">
              {/* Header */}
              <div className="flex items-start justify-between gap-3 p-6">
                <div>
                  <div className="text-lg font-extrabold text-white">Become a seller</div>
                  <p className="mt-2 text-sm text-white/70">
                    To create auctions, your account needs seller access. Enable it now and start
                    selling.
                  </p>
                </div>

                <button
                  type="button"
                  disabled={becomingSeller}
                  onClick={() => setShowSellerModal(false)}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-1 text-sm font-extrabold text-white hover:bg-white/10 disabled:opacity-60"
                >
                  ✕
                </button>
              </div>

              {/* Body (scroll-safe) */}
              <div className="max-h-[60vh] overflow-auto px-6 pb-6">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/75">
                  <div className="font-extrabold text-white/90">What you get</div>
                  <ul className="mt-2 list-disc space-y-1 pl-5">
                    <li>Create auctions and upload photos</li>
                    <li>Submit for admin review</li>
                    <li>Track status and bids</li>
                  </ul>
                </div>

                {sellerErr && (
                  <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-100">
                    {sellerErr}
                  </div>
                )}

                {/* Actions */}
                <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    disabled={becomingSeller}
                    onClick={declineBecomeSeller}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-extrabold text-white hover:bg-white/10 disabled:opacity-60"
                  >
                    Not now (go to Live)
                  </button>

                  <button
                    type="button"
                    disabled={becomingSeller}
                    onClick={confirmBecomeSeller}
                    className="rounded-2xl bg-[#FF7A1A] px-4 py-2 text-sm font-extrabold text-black hover:opacity-90 disabled:opacity-60"
                  >
                    {becomingSeller ? "Enabling..." : "Yes, become a seller"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
