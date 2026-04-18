"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import AuctionCard from "../../../components/AuctionCard";
import { apiFetch } from "../../../lib/api";

type Auction = {
  id: string | number;
  endsAt: string;
  currentPrice: string | number;
  status?: string;
  _count?: { bids: number };
  listing?: {
    title?: string;
    location?: string | null;
    category?: { nameEn?: string; nameAr?: string };
  };
};

function formatEnds(iso: string) {
  return new Date(iso).toLocaleString();
}

/**
 * ✅ Cross-tab refresh channel:
 * When any tab places a bid, it broadcasts BID_PLACED.
 * This page listens and refetches /api/auctions/live automatically (no refresh/click needed).
 */
const AUCTION_CHANNEL = "laqta-auctions";
type AuctionMessage = { type: "BID_PLACED"; auctionId: string; ts: number };

export default function LiveAuctionsPage() {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // filter states
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState("ending_soon");

  // applied filters (only applied when user clicks "Apply")
  const [applied, setApplied] = useState({
    search: "",
    category: "All",
    minPrice: "",
    maxPrice: "",
  });

  const fetchLiveAuctions = useCallback(async () => {
    try {
      setLoading(true);
      setErr(null);
      const data = await apiFetch("/api/auctions/live");
      setAuctions(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load auctions");
    } finally {
      setLoading(false);
    }
  }, []);

  // fetch once on mount
  useEffect(() => {
    fetchLiveAuctions();
  }, [fetchLiveAuctions]);

  // ✅ NEW: Auto-refresh cards when a bid happens in any tab
  useEffect(() => {
    const bc = new BroadcastChannel(AUCTION_CHANNEL);

    bc.onmessage = (event: MessageEvent<AuctionMessage>) => {
      const msg = event.data;
      if (msg?.type === "BID_PLACED") {
        // simplest + most reliable: refetch the live list
        fetchLiveAuctions();
      }
    };

    return () => bc.close();
  }, [fetchLiveAuctions]);

  // filter + sort in memory
  const filtered = useMemo(() => {
    let list = [...auctions];

    // search by title
    if (applied.search.trim()) {
      const q = applied.search.toLowerCase();
      list = list.filter((a) => (a.listing?.title ?? "").toLowerCase().includes(q));
    }

    // category
    if (applied.category !== "All") {
      list = list.filter(
        (a) =>
          (a.listing?.category?.nameEn ?? "").toLowerCase() === applied.category.toLowerCase()
      );
    }

    // min price
    if (applied.minPrice !== "") {
      const min = Number(applied.minPrice);
      list = list.filter((a) => Number(a.currentPrice) >= min);
    }

    // max price
    if (applied.maxPrice !== "") {
      const max = Number(applied.maxPrice);
      list = list.filter((a) => Number(a.currentPrice) <= max);
    }

    // sort
    if (sort === "ending_soon") {
      list.sort((a, b) => new Date(a.endsAt).getTime() - new Date(b.endsAt).getTime());
    } else if (sort === "newest") {
      list.sort((a, b) => new Date(b.endsAt).getTime() - new Date(a.endsAt).getTime());
    } else if (sort === "price_high") {
      list.sort((a, b) => Number(b.currentPrice) - Number(a.currentPrice));
    } else if (sort === "price_low") {
      list.sort((a, b) => Number(a.currentPrice) - Number(b.currentPrice));
    }

    return list;
  }, [auctions, applied, sort]);

  function applyFilters() {
    setApplied({ search, category, minPrice, maxPrice });
  }

  function resetFilters() {
    setSearch("");
    setCategory("All");
    setMinPrice("");
    setMaxPrice("");
    setSort("ending_soon");
    setApplied({ search: "", category: "All", minPrice: "", maxPrice: "" });
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white/80 ring-1 ring-white/10">
            Live Auctions
          </div>

          <h1 className="mt-4 text-3xl font-extrabold text-white md:text-4xl">
            Browse Live Auctions
          </h1>

          <p className="mt-2 max-w-2xl text-white/65">
            Verified sellers, real-time bids, and structured workflows — designed for Jordan.
          </p>
        </div>

        <div className="flex gap-3">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="rounded-2xl border border-white/10 bg-[#0d1117] px-4 py-3 text-sm text-white/80 backdrop-blur outline-none"
            style={{ backgroundColor: "#0d1117", color: "white" }}
          >
            <option value="ending_soon" style={{ backgroundColor: "#0d1117", color: "white" }}>
              Sort: Ending soon
            </option>
            <option value="newest" style={{ backgroundColor: "#0d1117", color: "white" }}>
              Newest
            </option>
            <option value="price_high" style={{ backgroundColor: "#0d1117", color: "white" }}>
              Price: High to Low
            </option>
            <option value="price_low" style={{ backgroundColor: "#0d1117", color: "white" }}>
              Price: Low to High
            </option>
          </select>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[300px_1fr]">
        {/* Filters */}
        <aside className="h-fit rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur">
          <div className="text-sm font-extrabold text-white">Filters</div>

          <div className="mt-4 space-y-4">
            {/* Search */}
            <div>
              <div className="text-xs font-semibold text-white/60">Search</div>
              <input
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none"
                placeholder="e.g., cars, scrap, electronics..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && applyFilters()}
              />
            </div>

            {/* Category */}
            <div>
              <div className="text-xs font-semibold text-white/60">Category</div>
              <select
                className="mt-2 w-full rounded-2xl border border-white/10 bg-[#0d1117] px-4 py-3 text-sm text-white outline-none"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{ backgroundColor: "#0d1117", color: "white" }}
              >
                <option value="All" style={{ backgroundColor: "#0d1117", color: "white" }}>
                  All
                </option>
                <option value="Vehicles" style={{ backgroundColor: "#0d1117", color: "white" }}>
                  Vehicles
                </option>
                <option value="Industrial" style={{ backgroundColor: "#0d1117", color: "white" }}>
                  Industrial
                </option>
                <option value="Electronics" style={{ backgroundColor: "#0d1117", color: "white" }}>
                  Electronics
                </option>
              </select>
            </div>

            {/* Price range */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs font-semibold text-white/60">Min (JOD)</div>
                <input
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none"
                  placeholder="0"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  type="number"
                  min="0"
                />
              </div>

              <div>
                <div className="text-xs font-semibold text-white/60">Max (JOD)</div>
                <input
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none"
                  placeholder="10000"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  type="number"
                  min="0"
                />
              </div>
            </div>

            <button
              onClick={applyFilters}
              className="w-full rounded-2xl bg-[#FF7A1A] px-4 py-3 text-sm font-extrabold text-black hover:brightness-110"
            >
              Apply Filters
            </button>

            <button
              onClick={resetFilters}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white/80 hover:bg-white/10"
            >
              Reset
            </button>
          </div>
        </aside>

        {/* Cards */}
        <section>
          {loading && (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white/80 shadow-2xl backdrop-blur">
              Loading auctions…
            </div>
          )}

          {err && (
            <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-6 text-red-100 shadow-2xl backdrop-blur">
              {err}
            </div>
          )}

          {!loading && !err && filtered.length === 0 && (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white/70 shadow-2xl backdrop-blur">
              No auctions match your filters.
            </div>
          )}

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((a) => (
              <AuctionCard
                key={String(a.id)}
                id={String(a.id)}
                title={a.listing?.title ?? `Auction #${a.id}`}
                category={a.listing?.category?.nameEn ?? "Category"}
                location={a.listing?.location ?? "Jordan"}
                currentPrice={Number(a.currentPrice)}
                endsAt={formatEnds(a.endsAt)}
                rawEndsAt={a.endsAt}
                bidsCount={a._count?.bids ?? 0}
                badge="LIVE"
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
