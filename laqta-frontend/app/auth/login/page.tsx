"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch } from "../../../lib/api";

export default function LoginPage() {
  const router = useRouter();

  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function login() {
    try {
      setLoading(true);
      setErr(null);

      const data = await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ emailOrPhone, password }),
      });

      if (!data?.accessToken) {
        setErr("Login failed: accessToken not returned from server.");
        return;
      }

      // ✅ per-tab login
      sessionStorage.setItem("laqta_token", data.accessToken);
      window.dispatchEvent(new Event("laqta:auth")); // ✅ update header immediately (same tab)
      router.push("/auctions/live");
    } catch (e: any) {
      setErr(e?.message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-7 shadow-2xl backdrop-blur">
        <div className="text-sm font-extrabold text-white/70">Account</div>
        <h1 className="mt-2 text-3xl font-extrabold text-white">Login</h1>
        <p className="mt-2 text-sm text-white/60">
          Login to bid live. No account?{" "}
          <Link className="font-bold text-[#FF7A1A] hover:underline" href="/auth/register">
            Create one
          </Link>
        </p>

        <div className="mt-6 space-y-3">
          <input
            className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none"
            value={emailOrPhone}
            onChange={(e) => setEmailOrPhone(e.target.value)}
            placeholder="Email or Phone"
          />

          <input
            className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
          />

          <button
            onClick={login}
            disabled={loading}
            className="w-full rounded-2xl bg-[#FF7A1A] px-4 py-3 text-sm font-extrabold text-black hover:brightness-110 disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Login"}
          </button>

          {err && (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100">
              {err}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
