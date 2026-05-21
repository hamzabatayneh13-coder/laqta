"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { AuthNav } from "./AuthNav";
import { getCachedMe, refreshMe, type MeUser } from "@/lib/me";
import { apiFetch } from "@/lib/api";

// ✅ language (toggle + strings)
import LanguageToggle from "./i18n/LanguageToggle";
import { useLang } from "./i18n/LanguageProvider";
import { strings } from "@/lib/i18n/strings";

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
  const [token, setToken] = useState<string | null>(null);
  const [me, setMe] = useState<MeUser | null>(null);

  // ✅ language state + translated strings
  const { lang } = useLang();
  const t = strings[lang];

  // ✅ Categories dropdown state
  const [categories, setCategories] = useState<Category[]>([]);
  const [catOpen, setCatOpen] = useState(false);
  const catRef = useRef<HTMLDivElement | null>(null);

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
        // Your project uses /api prefix
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
  const role = me?.role || payload?.role;

  // ✅ Sell button logic (no KYC / no onboarding)
  const onSellClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    // If not logged in → allow normal navigation to login
    if (!token) return;

    // If already seller/admin → allow normal navigation to create auction
    if (role === "SELLER" || role === "ADMIN") return;

    // Otherwise: buyer → ask confirmation then upgrade to seller
    e.preventDefault();

    const msg =
      lang === "ar"
        ? "هل تريد التحول إلى بائع؟"
        : "Do you want to be a seller?";
    const ok = window.confirm(msg);
    if (!ok) return;

    try {
      await apiFetch("/users/become-seller", { method: "POST" });

      // refresh role immediately (optional but helps UI)
      const next = await refreshMe();
      setMe(next);

      // go to create auction page
      window.location.href = "/seller/auctions/new";
    } catch (err: any) {
      alert(err?.message || (lang === "ar" ? "فشل التحويل إلى بائع" : "Failed to become a seller. Please try again."));
    }
  };

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
            {t.nav.liveAuctions}
          </Link>

          {/* ✅ Categories for everyone */}
          <div className="relative" ref={catRef}>
            <button
              type="button"
              onClick={() => setCatOpen((v) => !v)}
              className="hover:text-[#FF7A1A]"
            >
              {t.nav.categories}
            </button>

            {catOpen && (
              <div className="absolute left-0 mt-2 w-64 overflow-hidden rounded-2xl border border-white/10 bg-[#070B14]/95 shadow-2xl backdrop-blur">
                <Link
                  href="/auctions/live"
                  onClick={() => setCatOpen(false)}
                  className="block px-4 py-3 text-sm text-white/85 hover:bg-white/10"
                >
                  {lang === "ar" ? "كل التصنيفات" : "All Categories"}
                </Link>

                <div className="h-px bg-white/10" />

                {categories.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-white/70">
                    {lang === "ar" ? "لا توجد تصنيفات" : "No categories"}
                  </div>
                ) : (
                  categories.map((c) => (
                    <Link
                      key={String(c.id)}
                      href={`/auctions/live?category=${encodeURIComponent(c.slug)}`}
                      onClick={() => setCatOpen(false)}
                      className="block px-4 py-3 text-sm text-white/85 hover:bg-white/10"
                    >
                      {/* ✅ show only one language */}
                      {lang === "ar" ? c.nameAr : c.nameEn}
                    </Link>
                  ))
                )}
              </div>
            )}
          </div>

          {/* ✅ Sell now prompts BUYER to become SELLER */}
          <Link className="hover:text-[#FF7A1A]" href={sellHref} onClick={onSellClick}>
            {t.nav.sell}
          </Link>

          {role === "ADMIN" && (
            <Link className="hover:text-[#FF7A1A]" href="/admin">
              {t.nav.admin}
            </Link>
          )}

          {/* ✅ Language toggle button in header */}
          <LanguageToggle />

          <AuthNav />
        </nav>
      </div>
    </header>
  );
}
