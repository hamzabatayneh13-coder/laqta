"use client";

import { useState } from "react";
import Link from "next/link";
import { apiFetch } from "../../../lib/api";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function register() {
    try {
      setLoading(true);
      setErr(null);

      // basic validation
      if (!fullName.trim()) return setErr("Full name is required.");
      if (!email.trim() && !phone.trim()) return setErr("Email or phone is required.");
      if (password.length < 6) return setErr("Password must be at least 6 characters.");

      // 1) register
      await apiFetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          password,
        }),
      });

      // 2) auto-login using emailOrPhone
      const emailOrPhone = (email.trim() || phone.trim());
      const data = await apiFetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailOrPhone, password }),
      });

      if (!data?.accessToken) {
        setErr("Account created, but auto-login failed. Please login manually.");
        return;
      }

      localStorage.setItem("laqta_token", data.accessToken);
      window.dispatchEvent(new Event("laqta:auth"));
      window.location.href = "/auctions/live";
    } catch (e: any) {
      setErr(e?.message ?? "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-7 shadow-2xl backdrop-blur">
        <div className="text-sm font-extrabold text-white/70">Account</div>
        <h1 className="mt-2 text-3xl font-extrabold text-white">Create account</h1>
        <p className="mt-2 text-white/60 text-sm">
          Already have an account?{" "}
          <Link className="text-[#FF7A1A] font-bold hover:underline" href="/auth/login">
            Login
          </Link>
        </p>

        <div className="mt-6 space-y-3">
          <input
            className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Full name"
          />

          <input
            className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone (07X XXX XXXX)"
            inputMode="tel"
          />

          <input
            className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
          />

          <input
            className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
          />

          <button
            onClick={register}
            disabled={loading}
            className="w-full rounded-2xl bg-[#FF7A1A] px-4 py-3 text-sm font-extrabold text-black hover:brightness-110 disabled:opacity-60"
          >
            {loading ? "Creating..." : "Create account"}
          </button>

          {err && (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100">
              {err}
            </div>
          )}
        </div>

        <div className="mt-4 text-xs text-white/45">
          Hint: Jordan mobile numbers often start with <b>079</b>, <b>078</b>, or <b>077</b>. Format example:{" "}
          <b>07X XXX XXXX</b>.
        </div>
      </div>
    </div>
  );
}
