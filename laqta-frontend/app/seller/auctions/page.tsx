"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

export default function SellerAuctionsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    try {
      setLoading(true);
      setErr(null);
      const data = await apiFetch("/api/seller/auctions");
      setItems(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="text-sm font-extrabold text-white/70">Seller</div>
          <h1 className="mt-2 text-3xl font-extrabold text-white">My Auctions</h1>
          <p className="mt-2 text-sm text-white/60">
            Create and track your submitted auctions (pending / needs changes / approved).
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={load}
            className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-extrabold text-white hover:bg-white/15"
          >
            Refresh
          </button>

          <Link
            href="/seller/auctions/new"
            className="rounded-2xl bg-[#FF7A1A] px-4 py-3 text-sm font-extrabold text-black hover:opacity-90"
          >
            + New Auction
          </Link>
        </div>
      </div>

      {loading && (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white/70">
          Loading…
        </div>
      )}

      {err && (
        <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-6 text-red-100">
          {err}
        </div>
      )}

      {!loading && !err && (
        <div className="space-y-3">
          {items.map((a) => {
            const canEdit = a.status === "NEEDS_CHANGES";

            return (
              <div
                key={a.id}
                className="rounded-3xl border border-white/10 bg-white/5 p-5 text-white shadow-2xl backdrop-blur"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="font-extrabold">{a.listing?.title ?? `Auction #${a.id}`}</div>
                    <div className="mt-1 text-sm text-white/60">
                      Status: <span className="font-bold">{a.status}</span>
                    </div>

                    {a.lastReview?.reason && (
                      <div className="mt-1 text-sm text-white/60">
                        Admin note: <span className="text-white/80">{a.lastReview.reason}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/a/${a.id}`}
                      className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-extrabold text-white hover:bg-white/15"
                    >
                      View Public →
                    </Link>

                    {canEdit ? (
                      <Link
                        href={`/seller/auctions/${a.id}/edit`}
                        className="rounded-2xl bg-[#FF7A1A] px-4 py-2 text-sm font-extrabold text-black hover:opacity-90"
                      >
                        Edit & Resubmit →
                      </Link>
                    ) : (
                      <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/50">
                        Edit disabled
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {items.length === 0 && (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white/70">
              No auctions yet. Click <b>New Auction</b>.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
