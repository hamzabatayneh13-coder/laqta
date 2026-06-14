"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

function isActive(pathname: string, href: string) {
  // ✅ Auctions tab should be active for any /admin/auctions/*
  if (href === "/admin/auctions") {
    return pathname === "/admin/auctions" || pathname.startsWith("/admin/auctions/");
  }

  // Exact match
  if (pathname === href) return true;

  // Section match (e.g. /admin/users/123)
  return pathname.startsWith(href + "/");
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token =
      typeof window !== "undefined" ? sessionStorage.getItem("laqta_token") : null;

    if (!token) {
      router.push("/auth/login");
      return;
    }

    // decode token and check role
    try {
      const parts = token.split(".");
      if (parts.length < 2) throw new Error("Bad token");

      const payloadStr = atob(parts[1]);
      const payload = JSON.parse(payloadStr);

      if (payload.role !== "ADMIN") {
        router.push("/");
        return;
      }
    } catch {
      router.push("/auth/login");
      return;
    }

    setChecking(false);
  }, [router]);

  if (checking) {
    return (
      <div className="flex h-screen items-center justify-center text-white/60">
        Checking access…
      </div>
    );
  }

  // ✅ FIX: Auctions href is /admin/auctions (Review)
  const navItems = [
    { href: "/admin", label: "📊 Overview" },
    { href: "/admin/users", label: "👥 Users" },
    { href: "/admin/kyc", label: "🔐 KYC Review" },
    { href: "/admin/auctions", label: "📦 Auctions" },
    { href: "/admin/categories", label: "🏷️ Categories" },
  ];


  return (
    <div className="min-h-screen">
      {/* Admin top bar */}
      <div className="mb-6 rounded-3xl border border-white/10 bg-white/5 p-4 shadow-2xl backdrop-blur">
        <div className="flex flex-wrap items-center gap-2">
          <div className="mr-4 text-sm font-extrabold text-[#FF7A1A]">
            Admin Panel
          </div>

          {navItems.map((item) => {
            const active = isActive(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                  active
                    ? "bg-[#FF7A1A] text-black"
                    : "bg-white/10 text-white/80 hover:bg-white/15"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Page content */}
      {children}
    </div>
  );
}
