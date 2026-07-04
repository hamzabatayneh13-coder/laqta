"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import AuctionCard from "../../../components/AuctionCard";
import { apiFetch } from "../../../lib/api";

type Category = {
  id: string | number;
  slug: string;
  nameEn: string;
  nameAr: string;
  parentId?: string | number | null;
};

type CategoryNode = Category & { children: CategoryNode[] };

type Auction = {
  id: string | number;
  endsAt: string;
  currentPrice: string | number;
  status?: string;
  _count?: { bids: number };
  listing?: {
    title?: string;
    location?: string | null;
    category?: {
      slug?: string;
      nameEn?: string;
      nameAr?: string;
    };
  };
};

function formatEnds(iso: string) {
  return new Date(iso).toLocaleString();
}

function buildCategoryTree(items: Category[]): CategoryNode[] {
  const map = new Map<string, CategoryNode>();

  for (const c of items) {
    map.set(String(c.id), { ...c, children: [] });
  }

  const roots: CategoryNode[] = [];

  for (const node of map.values()) {
    const pid = node.parentId;
    if (pid === null || pid === undefined || pid === "") {
      roots.push(node);
      continue;
    }

    const parent = map.get(String(pid));
    if (!parent) {
      roots.push(node);
      continue;
    }

    parent.children.push(node);
  }

  const sortByName = (a: CategoryNode, b: CategoryNode) =>
    (a.nameEn || "").localeCompare(b.nameEn || "");

  const sortRecursive = (nodes: CategoryNode[]) => {
    nodes.sort(sortByName);
    for (const n of nodes) sortRecursive(n.children);
  };

  sortRecursive(roots);
  return roots;
}

/**
 * ✅ Cross-tab refresh channel:
 * When any tab places a bid, it broadcasts BID_PLACED.
 * This page listens and refetches /api/auctions/live automatically.
 */
const AUCTION_CHANNEL = "laqta-auctions";
type AuctionMessage = { type: "BID_PLACED"; auctionId: string; ts: number };

export default function LiveAuctionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const urlCategory = searchParams.get("category"); // child slug (B behavior)

  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // filter states
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("All"); // child slug or All
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState("ending_soon");

  // applied filters
  const [applied, setApplied] = useState({
    search: "",
    category: "All",
    minPrice: "",
    maxPrice: "",
  });

  // expandable category UI state
  const [expandedParents, setExpandedParents] = useState<Record<string, boolean>>({});

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

  const fetchCategories = useCallback(async () => {
    try {
      const data = await apiFetch("/api/categories");
      setCategories(Array.isArray(data) ? (data as Category[]) : []);
    } catch {
      setCategories([]);
    }
  }, []);

  useEffect(() => {
    fetchLiveAuctions();
    fetchCategories();
  }, [fetchLiveAuctions, fetchCategories]);

  useEffect(() => {
    const bc = new BroadcastChannel(AUCTION_CHANNEL);
    bc.onmessage = (event: MessageEvent<AuctionMessage>) => {
      const msg = event.data;
      if (msg?.type === "BID_PLACED") fetchLiveAuctions();
    };
    return () => bc.close();
  }, [fetchLiveAuctions]);

  // If user came from header with ?category=<childSlug>, apply it
  useEffect(() => {
    if (!urlCategory) {
      setCategory("All");
      setApplied((prev) => ({ ...prev, category: "All" }));
      return;
    }
    setCategory(urlCategory);
    setApplied((prev) => ({ ...prev, category: urlCategory }));
  }, [urlCategory]);

  const tree = useMemo(() => buildCategoryTree(categories), [categories]);

  function toggleParent(id: string | number) {
    const key = String(id);
    setExpandedParents((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function applyFilters() {
    // keep URL in sync
    if (category && category !== "All") {
      router.push(`/auctions/live?category=${encodeURIComponent(category)}`);
    } else {
      router.push(`/auctions/live`);
    }
    setApplied({ search, category, minPrice, maxPrice });
  }

  function resetFilters() {
    setSearch("");
    setCategory("All");
    setMinPrice("");
    setMaxPrice("");
    setSort("ending_soon");
    setApplied({ search: "", category: "All", minPrice: "", maxPrice: "" });
    router.push("/auctions/live");
  }

  // filtering
  const filtered = useMemo(() => {
    let list = [...auctions];

    if (applied.search.trim()) {
      const q = applied.search.toLowerCase();
      list = list.filter((a) => (a.listing?.title ?? "").toLowerCase().includes(q));
    }

    if (applied.category !== "All") {
      const wantedSlug = applied.category;

      list = list.filter((a) => {
        const auctionSlug = a.listing?.category?.slug;
        if (auctionSlug) return auctionSlug === wantedSlug;

        // fallback if backend doesn't include slug:
        const wantedCat = categories.find((c) => c.slug === wantedSlug);
        const wantedNameEn = wantedCat?.nameEn?.toLowerCase();
        const auctionNameEn = (a.listing?.category?.nameEn ?? "").toLowerCase();
        return wantedNameEn ? auctionNameEn === wantedNameEn : false;
      });
    }

    if (applied.minPrice !== "") {
      const min = Number(applied.minPrice);
      list = list.filter((a) => Number(a.currentPrice) >= min);
    }

    if (applied.maxPrice !== "") {
      const max = Number(applied.maxPrice);
      list = list.filter((a) => Number(a.currentPrice) <= max);
    }

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
  }, [auctions, applied, sort, categories]);

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

            {/* ✅ Category expandable (B behavior: parent expands only) */}
            <div>
              <div className="text-xs font-semibold text-white/60">Category</div>

              <div className="mt-2 rounded-2xl border border-white/10 bg-black/20 p-2">
                {/* All */}
                <button
                  type="button"
                  onClick={() => setCategory("All")}
                  className={[
                    "flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm hover:bg-white/10",
                    category === "All" ? "bg-white/10 text-white" : "text-white/80",
                  ].join(" ")}
                >
                  <span>All</span>
                  {category === "All" && <span className="text-[#FF7A1A]">✓</span>}
                </button>

                <div className="my-2 h-px bg-white/10" />

                {tree.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-white/60">No categories</div>
                ) : (
                  <div className="space-y-1">
                    {tree.map((p) => {
                      const open = !!expandedParents[String(p.id)];
                      return (
                        <div key={String(p.id)} className="rounded-xl">
                          {/* parent row */}
                          <button
                            type="button"
                            onClick={() => toggleParent(p.id)}
                            className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-semibold text-white/90 hover:bg-white/10"
                          >
                            <span>
                              {p.nameEn} <span className="text-white/50">({p.nameAr})</span>
                            </span>
                            <span className="text-white/60">{open ? "▴" : "▾"}</span>
                          </button>

                          {/* children */}
                          {open && (
                            <div className="mt-1 space-y-1 pb-1">
                              {p.children.length === 0 ? (
                                <div className="px-3 py-1 text-xs text-white/50">No sub-categories</div>
                              ) : (
                                p.children.map((ch) => {
                                  const active = category === ch.slug;
                                  return (
                                    <button
                                      key={String(ch.id)}
                                      type="button"
                                      onClick={() => setCategory(ch.slug)}
                                      className={[
                                        "flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm hover:bg-white/10",
                                        active ? "bg-white/10 text-white" : "text-white/80",
                                      ].join(" ")}
                                    >
                                      <span>
                                        — {ch.nameEn} <span className="text-white/50">({ch.nameAr})</span>
                                      </span>
                                      {active && <span className="text-[#FF7A1A]">✓</span>}
                                    </button>
                                  );
                                })
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
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
