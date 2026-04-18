"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "../../lib/api";

function readToken() {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem("laqta_token"); // ✅ per-tab
}

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [me, setMe] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);

  // ✅ Sync token in SAME TAB only
  useEffect(() => {
    const sync = () => setToken(readToken());
    sync();
    window.addEventListener("laqta:auth", sync);
    return () => window.removeEventListener("laqta:auth", sync);
  }, []);

  // ✅ Load profile when token exists
  useEffect(() => {
    (async () => {
      if (!token) {
        setMe(null);
        setErr(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setErr(null);
        const data = await apiFetch("/api/auth/me");
        setMe(data);
      } catch (e: any) {
        setErr(e?.message ?? "Failed to load profile");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  if (!token) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-7 shadow-2xl backdrop-blur">
          <h1 className="text-2xl font-extrabold text-white">My Account</h1>
          <p className="mt-2 text-white/60 text-sm">You are not logged in.</p>
          <Link
            href="/auth/login"
            className="mt-5 inline-block rounded-2xl bg-[#FF7A1A] px-4 py-3 text-sm font-extrabold text-black hover:brightness-110"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-white/5 p-7 text-white/80 shadow-2xl backdrop-blur">
        Loading profile…
      </div>
    );
  }

  if (err) {
    return (
      <div className="mx-auto max-w-2xl rounded-3xl border border-red-500/30 bg-red-500/10 p-7 text-red-100 shadow-2xl backdrop-blur">
        <div className="text-lg font-extrabold">Failed to load profile</div>
        <div className="mt-2 text-sm whitespace-pre-wrap">{err}</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-7 shadow-2xl backdrop-blur">
        <div className="text-sm font-extrabold text-white/70">Account</div>
        <h1 className="mt-2 text-3xl font-extrabold text-white">My Account</h1>

        <div className="mt-6 grid gap-3">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="text-xs text-white/50">Full name</div>
            <div className="text-sm font-extrabold text-white">{me?.fullName ?? "—"}</div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="text-xs text-white/50">Email</div>
            <div className="text-sm font-extrabold text-white">{me?.email ?? "—"}</div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="text-xs text-white/50">Phone</div>
            <div className="text-sm font-extrabold text-white">{me?.phone ?? "—"}</div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="text-xs text-white/50">Role</div>
            <div className="text-sm font-extrabold text-white">{me?.role ?? "—"}</div>
          </div>
        </div>

        <button
          onClick={() => {
            // ✅ per-tab logout
            sessionStorage.removeItem("laqta_token");
            window.dispatchEvent(new Event("laqta:auth"));
            window.location.href = "/auth/login";
          }}
          className="mt-6 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-extrabold text-white hover:bg-white/15"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
