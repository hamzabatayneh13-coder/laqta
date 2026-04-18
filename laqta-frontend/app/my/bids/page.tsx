"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from "../../../lib/api";

function fmtTime(v: any) {
  const d = new Date(v);
  return isNaN(d.getTime()) ? String(v) : d.toLocaleString();
}

export default function MyBidsPage() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [bids, setBids] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const data = await apiFetch("/api/bids/me");
        setBids(Array.isArray(data) ? data : []);
      } catch (e: any) {
        setErr(e?.message ?? "Failed to load bids");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white/80 shadow-2xl backdrop-blur">
        Loading your bids…
      </div>
    );
  }

  if (err) {
    return (
      <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-6 text-red-100 shadow-2xl backdrop-blur">
        <div className="text-lg font-extrabold">Failed to load</div>
        <div className="mt-2 text-sm">{err}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="text-sm font-extrabold text-white/70">Account</div>
        <h1 className="mt-2 text-3xl font-extrabold text-white">My Bids</h1>
        <p className="mt-2 text-sm text-white/60">
          Your latest bids across all auctions.
        </p>
      </div>

      {/* Bids list */}
      <div className="space-y-3">
        {bids.map((b) => (
          <div
            key={String(b.id)}
            className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="font-extrabold text-white">
                {b.auction?.title ?? "Auction"}
              </div>

              <Link
                href={`/a/${b.auction?.id}`}
                className="text-sm font-extrabold text-[#FF7A1A] hover:underline"
              >
                View auction →
              </Link>
            </div>

            <div className="mt-2 text-sm text-white/60">
              {b.auction?.location ?? "Jordan"} • {fmtTime(b.createdAt)}
            </div>

            <div className="mt-4 flex items-end justify-between">
              <div className="text-2xl font-extrabold text-white">
                {Number(b.amount).toLocaleString()}{" "}
                <span className="text-sm text-white/60">JOD</span>
              </div>

              <div className={`rounded-full px-3 py-1 text-xs font-extrabold ring-1 ${
                b.auction?.status === "LIVE"
                  ? "bg-emerald-500/15 text-emerald-300 ring-emerald-500/25"
                  : "bg-white/10 text-white/60 ring-white/15"
              }`}>
                {b.auction?.status ?? "—"}
              </div>
            </div>
          </div>
        ))}

        {bids.length === 0 && (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white/70 shadow-2xl backdrop-blur">
            <div className="text-lg font-extrabold">No bids yet</div>
            <p className="mt-2 text-sm text-white/50">
              Browse live auctions and place your first bid.
            </p>
            <Link
              href="/auctions/live"
              className="mt-4 inline-block rounded-2xl bg-[#FF7A1A] px-5 py-3 text-sm font-extrabold text-black hover:brightness-110"
            >
              Browse Auctions
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
