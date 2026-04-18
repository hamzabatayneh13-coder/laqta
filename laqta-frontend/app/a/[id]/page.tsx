"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { io } from "socket.io-client";
import { apiFetch, API } from "../../../lib/api";
import CountdownLastHour from "../../../components/CountdownLastHour";

function fmtTime(v: any) {
  if (!v) return "—";
  const d = new Date(v);
  return isNaN(d.getTime()) ? String(v) : d.toLocaleString();
}

/**
 * ✅ Cross-tab refresh channel (updates auction UI in other tabs without syncing login)
 */
const AUCTION_CHANNEL = "laqta-auctions";
type AuctionMessage = { type: "BID_PLACED"; auctionId: string; ts: number };

function postBidPlaced(auctionId: string) {
  if (typeof window === "undefined") return;
  const bc = new BroadcastChannel(AUCTION_CHANNEL);
  bc.postMessage({ type: "BID_PLACED", auctionId, ts: Date.now() } satisfies AuctionMessage);
  bc.close();
}

export default function AuctionDetail() {
  const params = useParams<{ id: string }>();
  const auctionId = params?.id;

  const [auction, setAuction] = useState<any>(null);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const apiBase = API;

  // ✅ keep token in sync (login/logout without refresh) — per-tab only
  useEffect(() => {
    const sync = () => setToken(sessionStorage.getItem("laqta_token"));
    sync();

    window.addEventListener("laqta:auth", sync);

    // ❌ IMPORTANT: do NOT listen to "storage" (that is cross-tab + not needed for sessionStorage)
    // window.addEventListener("storage", sync);

    return () => {
      window.removeEventListener("laqta:auth", sync);
      // window.removeEventListener("storage", sync);
    };
  }, []);

  const title = useMemo(() => {
    return auction?.listing?.title ?? `Auction #${auctionId ?? ""}`;
  }, [auction?.listing?.title, auctionId]);

  /**
   * ✅ Centralized fetch so we can call it from:
   * - initial load
   * - socket events
   * - broadcast messages (from other tabs)
   * - after placing a bid
   */
  const fetchAuction = useCallback(async () => {
    if (!auctionId) return;

    try {
      setErr(null);
      const data = await apiFetch(`/api/auctions/${auctionId}`);
      setAuction(data);
    } catch (e: any) {
      const msg =
        e?.message
          ? typeof e.message === "string"
            ? e.message
            : JSON.stringify(e.message)
          : JSON.stringify(e);
      setErr(msg);
    } finally {
      setLoading(false);
    }
  }, [auctionId]);

  /**
   * Load auction + connect socket (only when logged in)
   */
  useEffect(() => {
    if (!auctionId) return;

    let socket: any;

    (async () => {
      setLoading(true);
      await fetchAuction();

      // only connect socket when logged in
      if (token) {
        socket = io(API);
        socket.emit("auction:join", { auctionId });

        socket.on("auction:bid_update", (data: any) => {
          setAuction((prev: any) => {
            if (!prev) return prev;

            const newBid = data?.bid
              ? {
                  id: data.bid.id,
                  amount: data.bid.amount,
                  createdAt: data.bid.createdAt,
                }
              : null;

            // recompute minNextBid client-side too (as fallback)
            const nextCurrent = Number(data.currentPrice ?? prev.currentPrice ?? 0);
            const step = Number(prev.bidStep ?? 1);
            const nextMin = nextCurrent + step;

            return {
              ...prev,
              currentPrice: data.currentPrice ?? prev.currentPrice,
              endsAt: data.endsAt ?? prev.endsAt,
              bids: newBid ? [newBid, ...(prev.bids ?? [])].slice(0, 20) : prev.bids,
              minNextBid: String(nextMin),
            };
          });
        });
      }
    })();

    return () => {
      if (socket) socket.disconnect();
    };
  }, [auctionId, token, fetchAuction]);

  /**
   * ✅ Cross-tab refresh: when Tab A bids, Tab B auto-refreshes price immediately
   * This works even if Tab B is NOT logged in (because it just refetches auction data).
   */
  useEffect(() => {
    if (!auctionId) return;

    const bc = new BroadcastChannel(AUCTION_CHANNEL);
    bc.onmessage = (event: MessageEvent<AuctionMessage>) => {
      const msg = event.data;
      if (msg?.type === "BID_PLACED" && msg.auctionId === auctionId) {
        fetchAuction();
      }
    };

    return () => bc.close();
  }, [auctionId, fetchAuction]);

  async function placeBid(bidAmount?: number) {
    try {
      setErr(null);

      const n = bidAmount ?? Number(amount);
      if (!Number.isFinite(n) || n <= 0) {
        setErr("Please enter a valid bid amount.");
        return;
      }

      const minNextBid = Number(auction?.minNextBid ?? 0);
      if (minNextBid && n < minNextBid) {
        setErr(`Your bid must be at least ${minNextBid.toLocaleString()} JOD.`);
        return;
      }

      const updated = await apiFetch(`/api/auctions/${auctionId}/bids`, {
        method: "POST",
        body: JSON.stringify({ amount: n }),
      });

      // ✅ Update THIS tab immediately
      setAuction(updated);
      setAmount("");

      // ✅ And force a fresh fetch (covers any server-side computed fields)
      await fetchAuction();

      // ✅ Notify other tabs to refresh automatically
      if (auctionId) postBidPlaced(auctionId);
    } catch (e: any) {
      const msg =
        e?.message
          ? typeof e.message === "string"
            ? e.message
            : JSON.stringify(e.message)
          : JSON.stringify(e);
      setErr(msg);
    }
  }

  if (loading) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white/80 shadow-2xl backdrop-blur">
        Loading…
      </div>
    );
  }

  if (err && !auction) {
    return (
      <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-6 text-red-100 shadow-2xl backdrop-blur">
        <div className="text-lg font-extrabold">Failed to load auction</div>
        <pre className="mt-3 whitespace-pre-wrap text-sm opacity-90">{err}</pre>
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white/80 shadow-2xl backdrop-blur">
        No auction found.
      </div>
    );
  }

  const status = auction.status ?? "—";
  const currentPrice = Number(auction.currentPrice ?? 0);
  const endsAt = auction.endsAt ? new Date(auction.endsAt).toLocaleString() : "—";
  const location = auction?.listing?.location ?? "Jordan";
  const category = auction?.listing?.category?.nameEn ?? "Category";
  const bids = Array.isArray(auction?.bids) ? auction.bids : [];
  const minNextBid = Number(auction?.minNextBid ?? currentPrice + Number(auction?.bidStep ?? 1));

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="rounded-3xl border border-white/10 bg-white/5 p-7 shadow-2xl backdrop-blur">
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-4 py-2 text-xs font-extrabold text-emerald-200 ring-1 ring-emerald-500/25">
          {status}
        </div>

        <div className="mt-4 text-sm text-white/60">
          {category} • {location}
        </div>

        <h1 className="mt-2 text-3xl font-extrabold text-white md:text-4xl">{title}</h1>

        {/* Photos gallery */}
        {Array.isArray(auction?.listing?.media) && auction.listing.media.length > 0 && (
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {auction.listing.media.map((m: any) => (
              <div
                key={String(m.id)}
                className="overflow-hidden rounded-2xl border border-white/10 bg-black/20"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`${apiBase}${m.filePath}`}
                  alt="auction photo"
                  className="h-56 w-full object-cover"
                />
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {/* Current Bid card + Bid History under it */}
          <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
            <div className="text-xs font-semibold text-white/60">Current Bid</div>
            <div className="mt-1 text-3xl font-extrabold text-white">
              {currentPrice.toLocaleString()} <span className="text-sm text-white/60">JOD</span>
            </div>

            <div className="mt-2 text-sm text-white/60">
              Minimum next bid:{" "}
              <span className="font-extrabold text-white">{minNextBid.toLocaleString()} JOD</span>
            </div>

            {/* Bid history */}
            <div className="mt-4 border-t border-white/10 pt-4">
              <div className="text-xs font-semibold text-white/60">Bid History</div>
              <div className="mt-3 space-y-2">
                {bids.slice(0, 8).map((b: any) => (
                  <div
                    key={String(b.id)}
                    className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3 py-2"
                  >
                    <div className="text-sm font-extrabold text-white">
                      {Number(b.amount).toLocaleString()}{" "}
                      <span className="text-xs text-white/60">JOD</span>
                    </div>
                    <div className="text-xs text-white/50">{fmtTime(b.createdAt)}</div>
                  </div>
                ))}
                {bids.length === 0 && <div className="text-sm text-white/50">No bids yet.</div>}
              </div>
            </div>
          </div>

          {/* Ends at card + last-hour countdown */}
          <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
            <div className="text-xs font-semibold text-white/60">Ends at</div>
            <div className="mt-1 text-lg font-bold text-white">{endsAt}</div>
            {auction?.endsAt && <CountdownLastHour endsAt={auction.endsAt} />}
          </div>
        </div>
      </div>

      {/* Bid card */}
      <div className="rounded-3xl border border-white/10 bg-white/5 p-7 shadow-2xl backdrop-blur">
        <div className="text-lg font-extrabold text-white">Place a bid</div>
        <div className="mt-1 text-sm text-white/60">
          Choose the minimum bid or enter your own (must be ≥ minimum).
        </div>

        {!token ? (
          <div className="mt-5">
            <Link
              href={`/auth/login?next=/a/${auctionId}`}
              className="inline-block rounded-2xl bg-[#FF7A1A] px-6 py-3 text-sm font-extrabold text-black hover:brightness-110"
            >
              Login to bid
            </Link>
            <div className="mt-3 text-sm text-white/60">You must be logged in to place bids.</div>
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {/* Minimum bid button */}
            <button
              onClick={() => placeBid(minNextBid)}
              className="w-full rounded-2xl border border-white/10 bg-white/10 px-6 py-3 text-sm font-extrabold text-white hover:bg-white/15"
            >
              Bid Minimum ({minNextBid.toLocaleString()} JOD)
            </button>

            {/* Custom bid */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={`Custom bid (min ${minNextBid} JOD)`}
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none"
              />

              <button
                onClick={() => placeBid()}
                className="rounded-2xl bg-[#FF7A1A] px-6 py-3 text-sm font-extrabold text-black hover:brightness-110"
              >
                Place Bid
              </button>
            </div>
          </div>
        )}

        {err && (
          <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100">
            {err}
          </div>
        )}
      </div>
    </div>
  );
}
