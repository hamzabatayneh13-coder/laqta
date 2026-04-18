"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from "../../../lib/api";

function readToken() {
  if (typeof window === "undefined") return null;
  // ✅ per-tab auth
  return sessionStorage.getItem("laqta_token");
}

export default function SellerOnboardingPage() {
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [existing, setExisting] = useState<any>(null);
  const [loggedIn, setLoggedIn] = useState(false);

  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("Individual");

  // ✅ check if logged in (sessionStorage) + update on login/logout
  useEffect(() => {
    const sync = () => setLoggedIn(!!readToken());
    sync();
    window.addEventListener("laqta:auth", sync);
    return () => window.removeEventListener("laqta:auth", sync);
  }, []);

  // check if already applied
  useEffect(() => {
    (async () => {
      try {
        setChecking(true);
        const data = await apiFetch("/api/seller/me");
        if (data && data.kycStatus) setExisting(data);
      } catch {
        // not applied yet or not logged in
      } finally {
        setChecking(false);
      }
    })();
  }, []);

  async function submit() {
    try {
      setLoading(true);
      setErr(null);

      if (!businessName.trim()) {
        setErr("Business name is required.");
        return;
      }

      await apiFetch("/api/seller/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: businessName.trim(),
          businessType,
        }),
      });

      setSuccess(true);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to submit application.");
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <div className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-white/5 p-7 text-white/80 shadow-2xl backdrop-blur">
        Checking your status…
      </div>
    );
  }

  if (!loggedIn) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-7 shadow-2xl backdrop-blur">
          <h1 className="text-3xl font-extrabold text-white">Become a Seller</h1>
          <p className="mt-2 text-sm text-white/60">You must be logged in to apply as a seller.</p>
          <Link
            href="/auth/login"
            className="mt-5 inline-block rounded-2xl bg-[#FF7A1A] px-5 py-3 text-sm font-extrabold text-black hover:brightness-110"
          >
            Login to apply
          </Link>
        </div>
      </div>
    );
  }

  if (existing) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-7 shadow-2xl backdrop-blur">
          <div className="text-sm font-extrabold text-white/70">Seller</div>
          <h1 className="mt-2 text-3xl font-extrabold text-white">Seller Application</h1>

          <div className="mt-6 grid gap-3">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs text-white/50">Business Name</div>
              <div className="text-sm font-extrabold text-white">
                {existing.businessName ?? "—"}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs text-white/50">Business Type</div>
              <div className="text-sm font-extrabold text-white">
                {existing.businessType ?? "—"}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs text-white/50">KYC Status</div>
              <div
                className={`text-sm font-extrabold ${
                  existing.kycStatus === "APPROVED"
                    ? "text-emerald-400"
                    : existing.kycStatus === "REJECTED"
                    ? "text-red-400"
                    : "text-[#FF7A1A]"
                }`}
              >
                {existing.kycStatus ?? "PENDING"}
              </div>
            </div>
          </div>

          <div className="mt-6 text-sm text-white/60">
            {existing.kycStatus === "PENDING" &&
              "Your application is under review. We'll notify you once approved."}
            {existing.kycStatus === "APPROVED" &&
              "Your seller account is active. You can now list auctions."}
            {existing.kycStatus === "REJECTED" &&
              "Your application was rejected. Contact support for more info."}
          </div>

          <Link
            href="/auctions/live"
            className="mt-6 inline-block rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-extrabold text-white hover:bg-white/15"
          >
            Browse Auctions
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-7 shadow-2xl backdrop-blur">
          <div className="text-3xl font-extrabold text-white">Application Submitted ✅</div>
          <p className="mt-3 text-white/70">
            Your seller application is pending admin review. We'll notify you once your account is
            approved.
          </p>
          <Link
            href="/auctions/live"
            className="mt-6 inline-block rounded-2xl bg-[#FF7A1A] px-5 py-3 text-sm font-extrabold text-black hover:brightness-110"
          >
            Browse Auctions
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-7 shadow-2xl backdrop-blur">
        <div className="text-sm font-extrabold text-white/70">Seller</div>
        <h1 className="mt-2 text-3xl font-extrabold text-white">Become a Seller</h1>
        <p className="mt-2 text-sm text-white/60">
          Fill in your business details to apply as a verified seller on Laqta. Your application
          will be reviewed by our admin team.
        </p>

        <div className="mt-6 space-y-4">
          <div>
            <div className="text-xs font-semibold text-white/60">Business Name</div>
            <input
              className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none"
              placeholder="e.g., Al Batayneh Trading Co."
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
            />
          </div>

          <div>
            <div className="text-xs font-semibold text-white/60">Business Type</div>
            <select
              className="mt-2 w-full rounded-2xl border border-white/10 bg-[#0d1117] px-4 py-3 text-sm text-white outline-none"
              style={{ backgroundColor: "#0d1117", color: "white" }}
              value={businessType}
              onChange={(e) => setBusinessType(e.target.value)}
            >
              <option style={{ backgroundColor: "#0d1117", color: "white" }}>Individual</option>
              <option style={{ backgroundColor: "#0d1117", color: "white" }}>Company</option>
              <option style={{ backgroundColor: "#0d1117", color: "white" }}>Factory</option>
              <option style={{ backgroundColor: "#0d1117", color: "white" }}>Trader</option>
              <option style={{ backgroundColor: "#0d1117", color: "white" }}>Other</option>
            </select>
          </div>

          <button
            onClick={submit}
            disabled={loading}
            className="w-full rounded-2xl bg-[#FF7A1A] px-4 py-3 text-sm font-extrabold text-black hover:brightness-110 disabled:opacity-60"
          >
            {loading ? "Submitting..." : "Submit Application"}
          </button>

          {err && (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100">
              {err}
            </div>
          )}
        </div>

        <div className="mt-6 text-xs text-white/40">
          By submitting, you agree to Laqta&apos;s seller terms and conditions. KYC verification may
          be required before listing auctions.
        </div>
      </div>
    </div>
  );
}
