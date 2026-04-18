"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { apiFetch, API } from "../../../../lib/api";

function fmtTime(v: any) {
  if (!v) return "—";
  const d = new Date(v);
  return isNaN(d.getTime()) ? String(v) : d.toLocaleString();
}

function Money({ v }: { v: any }) {
  const n = Number(v);
  if (!Number.isFinite(n)) return <span>—</span>;
  return (
    <span>
      {n.toLocaleString()} <span className="text-xs text-white/60">JOD</span>
    </span>
  );
}

function Badge({ text, kind }: { text: string; kind?: "ok" | "warn" | "bad" | "info" }) {
  const cls =
    kind === "ok"
      ? "bg-emerald-500/15 text-emerald-300 ring-emerald-500/25"
      : kind === "warn"
      ? "bg-[#FF7A1A]/15 text-[#FF7A1A] ring-[#FF7A1A]/25"
      : kind === "bad"
      ? "bg-red-500/15 text-red-200 ring-red-500/25"
      : "bg-white/10 text-white/70 ring-white/15";
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-extrabold ring-1 ${cls}`}>
      {text}
    </span>
  );
}

export default function AdminAuctionDetailPage() {
  const params = useParams<{ id: string }>();
  const auctionId = params?.id;

  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo") || "/admin/auctions"; // ✅ key change

  const [auction, setAuction] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const apiBase = useMemo(() => API, []);

  useEffect(() => {
    if (!auctionId) return;

    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const data = await apiFetch(`/api/admin/auctions/${auctionId}`);
        setAuction(data);
      } catch (e: any) {
        setErr(e?.message ?? "Failed to load auction");
      } finally {
        setLoading(false);
      }
    })();
  }, [auctionId]);

  if (loading) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white/80 shadow-2xl backdrop-blur">
        Loading…
      </div>
    );
  }

  if (err || !auction) {
    return (
      <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-6 text-red-100 shadow-2xl backdrop-blur">
        {err ?? "Auction not found"}
      </div>
    );
  }

  const seller = auction.seller;
  const winner = auction.winner;
  const bids = Array.isArray(auction.bids) ? auction.bids : [];
  const reviews = Array.isArray(auction.reviews) ? auction.reviews : [];

  const statusKind =
    auction.status === "LIVE"
      ? "ok"
      : auction.status === "PAUSED"
      ? "warn"
      : auction.status === "CANCELLED"
      ? "bad"
      : "info";

  return (
    <div className="space-y-6">
      {/* Back */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* ✅ go back to the same filtered list */}
        <Link href={returnTo} className="text-sm text-white/60 hover:text-white">
          ← Back to Auctions
        </Link>

        <div className="flex items-center gap-2">
          <Badge text={auction.status} kind={statusKind as any} />
          <div className="text-xs text-white/50">Auction ID: #{auction.id}</div>
        </div>
      </div>

      {/* Header */}
      <div className="rounded-3xl border border-white/10 bg-white/5 p-7 shadow-2xl backdrop-blur">
        <div className="text-sm text-white/60">
          {auction.listing?.category ?? "—"} • {auction.listing?.location ?? "—"}
        </div>

        <h1 className="mt-2 text-3xl font-extrabold text-white">
          {auction.listing?.title ?? `Auction #${auction.id}`}
        </h1>

        {/* Photos */}
        {Array.isArray(auction.listing?.media) && auction.listing.media.length > 0 && (
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {auction.listing.media.map((m: any) => (
              <div key={String(m.id)} className="overflow-hidden rounded-2xl border border-white/10 bg-black/20">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`${apiBase}${m.filePath}`} alt="auction media" className="h-56 w-full object-cover" />
              </div>
            ))}
          </div>
        )}

        {/* Key cards */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
            <div className="text-xs font-semibold text-white/60">Current Price</div>
            <div className="mt-2 text-3xl font-extrabold text-white">
              <Money v={auction.currentPrice} />
            </div>
            <div className="mt-2 text-sm text-white/60">
              Start Price:{" "}
              <span className="font-extrabold text-white">
                <Money v={auction.startPrice} />
              </span>
            </div>
            <div className="mt-2 text-sm text-white/60">
              Bid Step:{" "}
              <span className="font-extrabold text-white">
                <Money v={auction.bidStep} />
              </span>
            </div>
            <div className="mt-2 text-xs text-white/45">Bids count: {auction.bidsCount ?? bids.length}</div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
            <div className="text-xs font-semibold text-white/60">Timing</div>
            <div className="mt-2 text-sm text-white/75">
              Starts: <span className="font-bold text-white">{fmtTime(auction.startsAt)}</span>
            </div>
            <div className="mt-2 text-sm text-white/75">
              Ends: <span className="font-bold text-white">{fmtTime(auction.endsAt)}</span>
            </div>
            <div className="mt-2 text-sm text-white/75">
              Created: <span className="font-bold text-white">{fmtTime(auction.createdAt)}</span>
            </div>

            <div className="mt-4 border-t border-white/10 pt-4">
              <div className="text-xs font-semibold text-white/60">Winner</div>
              {winner ? (
                <Link
                  href={`/admin/users/${winner.id}`}
                  className="mt-2 inline-block text-sm font-extrabold text-[#FF7A1A] hover:underline"
                >
                  {winner.fullName} →
                </Link>
              ) : (
                <div className="mt-2 text-sm text-white/60">No winner yet.</div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
            <div className="text-xs font-semibold text-white/60">Seller (Created By)</div>
            {seller ? (
              <>
                <Link
                  href={`/admin/users/${seller.id}`}
                  className="mt-2 inline-block text-sm font-extrabold text-[#FF7A1A] hover:underline"
                >
                  {seller.fullName} →
                </Link>
                <div className="mt-2 text-sm text-white/60">
                  {seller.email ?? "—"} • {seller.phone ?? "—"}
                </div>
                <div className="mt-2 text-xs text-white/45">User ID: #{seller.id}</div>

                {seller.sellerProfile && (
                  <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="text-xs font-semibold text-white/60">Seller Profile</div>
                    <div className="mt-2 text-sm text-white/70">
                      Company: <span className="font-bold text-white">{seller.sellerProfile.companyName ?? "—"}</span>
                    </div>
                    <div className="mt-1 text-sm text-white/70">
                      KYC: <span className="font-bold text-white">{seller.sellerProfile.kycStatus}</span>
                    </div>
                    <div className="mt-1 text-sm text-white/70">
                      COD: <span className="font-bold text-white">{seller.sellerProfile.allowsCod ? "Yes" : "No"}</span>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="mt-2 text-sm text-white/60">—</div>
            )}
          </div>
        </div>

        {/* Advanced admin settings */}
        <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-5">
          <div className="text-sm font-extrabold text-white">Advanced (Admin)</div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-sm">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs text-white/50">Reserve Mode</div>
              <div className="font-extrabold text-white">{auction.reserveMode ?? "—"}</div>
              <div className="mt-1 text-xs text-white/50">Reserve Price</div>
              <div className="font-extrabold text-white">
                {auction.reservePrice == null ? "—" : <Money v={auction.reservePrice} />}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs text-white/50">Anti-sniping</div>
              <div className="font-extrabold text-white">{auction.antiSnipingEnabled ? "Enabled" : "Disabled"}</div>
              <div className="mt-2 text-xs text-white/50">Last seconds</div>
              <div className="font-extrabold text-white">{auction.antiSnipingLastSeconds ?? "—"}</div>
              <div className="mt-2 text-xs text-white/50">Extend seconds</div>
              <div className="font-extrabold text-white">{auction.antiSnipingExtendSeconds ?? "—"}</div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs text-white/50">Pause state</div>
              <div className="font-extrabold text-white">pausedAt: {fmtTime(auction.pausedAt)}</div>
              <div className="mt-2 text-xs text-white/50">totalPausedMs</div>
              <div className="font-extrabold text-white">{String(auction.totalPausedMs ?? 0)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bid history with bidder names */}
      <div className="rounded-3xl border border-white/10 bg-white/5 p-7 shadow-2xl backdrop-blur">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-sm font-extrabold text-white/70">Admin</div>
            <h2 className="mt-1 text-2xl font-extrabold text-white">Bid History</h2>
            <div className="mt-1 text-sm text-white/60">Includes bidder identity (admin-only).</div>
          </div>
          <div className="text-sm text-white/50">Showing {bids.length} bids</div>
        </div>

        <div className="mt-5 space-y-2">
          {bids.map((b: any) => (
            <div
              key={String(b.id)}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3"
            >
              <div className="min-w-[240px]">
                <div className="text-lg font-extrabold text-white">
                  <Money v={b.amount} />
                </div>
                <div className="text-xs text-white/50">{fmtTime(b.createdAt)}</div>
              </div>

              <div className="text-right">
                {b.user ? (
                  <>
                    <Link
                      href={`/admin/users/${b.user.id}`}
                      className="text-sm font-extrabold text-[#FF7A1A] hover:underline"
                    >
                      {b.user.fullName} →
                    </Link>
                    <div className="mt-1 text-xs text-white/50">
                      #{b.user.id} • {b.user.email ?? "—"}
                    </div>
                  </>
                ) : (
                  <div className="text-sm text-white/60">Unknown user</div>
                )}
              </div>
            </div>
          ))}

          {bids.length === 0 && <div className="text-sm text-white/60">No bids yet.</div>}
        </div>
      </div>

      {/* Review history */}
      <div className="rounded-3xl border border-white/10 bg-white/5 p-7 shadow-2xl backdrop-blur">
        <h2 className="text-2xl font-extrabold text-white">Admin Review History</h2>

        <div className="mt-5 space-y-2">
          {reviews.map((r: any) => (
            <div key={String(r.id)} className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm font-extrabold text-white">{r.decision}</div>
                <div className="text-xs text-white/50">{fmtTime(r.createdAt)}</div>
              </div>
              {r.reason ? <div className="mt-2 text-sm text-white/70">{r.reason}</div> : null}
            </div>
          ))}

          {reviews.length === 0 && <div className="text-sm text-white/60">No admin reviews found.</div>}
        </div>
      </div>
    </div>
  );
}
