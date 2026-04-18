"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../../../../lib/api";

function fmtTime(v: any) {
  if (!v) return "—";
  const d = new Date(v);
  return isNaN(d.getTime()) ? String(v) : d.toLocaleString();
}

function Badge({ text }: { text: string }) {
  const cls =
    text === "LIVE"
      ? "bg-emerald-500/15 text-emerald-300 ring-emerald-500/25"
      : text === "PAUSED"
      ? "bg-[#FF7A1A]/15 text-[#FF7A1A] ring-[#FF7A1A]/25"
      : text === "CANCELLED"
      ? "bg-red-500/15 text-red-200 ring-red-500/25"
      : "bg-white/10 text-white/70 ring-white/15";

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-extrabold ring-1 ${cls}`}>
      {text}
    </span>
  );
}

export default function AdminAuctionsListPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // Optional client-side filter
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setErr(null);

        // IMPORTANT:
        // This assumes you have an admin endpoint that lists auctions, e.g. GET /api/admin/auctions
        // If your backend route is different, tell me the route and I’ll adjust.
        const data = await apiFetch("/api/admin/auctions");
        setItems(Array.isArray(data) ? data : data?.items ?? []);
      } catch (e: any) {
        setErr(e?.message ?? "Failed to load auctions");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((a: any) => {
      const title = String(a?.listing?.title ?? a?.title ?? "").toLowerCase();
      const seller = String(a?.seller?.fullName ?? "").toLowerCase();
      const id = String(a?.id ?? "");
      return title.includes(s) || seller.includes(s) || id.includes(s);
    });
  }, [items, q]);

  if (loading) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white/80 shadow-2xl backdrop-blur">
        Loading auctions…
      </div>
    );
  }

  if (err) {
    return (
      <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-6 text-red-100 shadow-2xl backdrop-blur">
        {err}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-sm font-extrabold text-white/70">Admin</div>
          <h1 className="mt-2 text-3xl font-extrabold text-white">Auctions</h1>
          <p className="mt-2 text-sm text-white/60">
            Browse all auctions. Use <span className="font-bold text-white">View (Admin)</span> for bidder identity + audit fields.
          </p>
        </div>

        <div className="w-full sm:w-[360px]">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by title, seller, or ID…"
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 shadow-2xl backdrop-blur outline-none focus:border-[#FF7A1A]/50"
          />
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur">
        <div className="overflow-x-auto">
          <table className="min-w-[1100px] w-full text-left text-sm">
            <thead className="text-xs text-white/50">
              <tr className="border-b border-white/10">
                <th className="px-5 py-4">ID</th>
                <th className="px-5 py-4">Title</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Seller</th>
                <th className="px-5 py-4">Current</th>
                <th className="px-5 py-4">Winner</th>
                <th className="px-5 py-4">Starts</th>
                <th className="px-5 py-4">Ends</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((a: any) => (
                <tr key={String(a.id)} className="border-b border-white/10 last:border-b-0">
                  <td className="px-5 py-4 text-white/80">#{a.id}</td>

                  <td className="px-5 py-4">
                    <div className="font-extrabold text-white">
                      {a?.listing?.title ?? a?.title ?? "—"}
                    </div>
                    <div className="mt-1 text-xs text-white/45">
                      {a?.listing?.category?.nameEn ?? a?.listing?.category ?? a?.category ?? ""}
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <Badge text={a.status} />
                  </td>

                  <td className="px-5 py-4">
                    {a?.seller ? (
                      <Link
                        href={`/admin/users/${a.seller.id}`}
                        className="font-bold text-[#FF7A1A] hover:underline"
                      >
                        {a.seller.fullName}
                      </Link>
                    ) : (
                      <span className="text-white/50">—</span>
                    )}
                  </td>

                  <td className="px-5 py-4 font-extrabold text-white">
                    {Number(a.currentPrice ?? 0).toLocaleString()}{" "}
                    <span className="text-xs text-white/60">JOD</span>
                  </td>

                  <td className="px-5 py-4">
                    {a?.winner ? (
                      <Link
                        href={`/admin/users/${a.winner.id}`}
                        className="font-bold text-[#FF7A1A] hover:underline"
                      >
                        {a.winner.fullName}
                      </Link>
                    ) : a?.currentWinnerUserId ? (
                      <Link
                        href={`/admin/users/${a.currentWinnerUserId}`}
                        className="font-bold text-[#FF7A1A] hover:underline"
                      >
                        User #{a.currentWinnerUserId}
                      </Link>
                    ) : (
                      <span className="text-white/50">—</span>
                    )}
                  </td>

                  <td className="px-5 py-4 text-white/70">{fmtTime(a.startsAt)}</td>
                  <td className="px-5 py-4 text-white/70">{fmtTime(a.endsAt)}</td>

                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/a/${a.id}`}
                        className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold text-white hover:bg-white/15"
                      >
                        View (Public) →
                      </Link>
                      <Link
                        href={`/admin/auctions/${a.id}`}
                        className="rounded-2xl bg-[#FF7A1A] px-4 py-2 text-xs font-extrabold text-black hover:brightness-110"
                      >
                        View (Admin) →
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-5 py-8 text-center text-white/60">
                    No auctions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-xs text-white/40">
        Tip: open an auction's admin detail page at <span className="font-bold text-white">/admin/auctions/[id]</span>.
      </div>
    </div>
  );
}
