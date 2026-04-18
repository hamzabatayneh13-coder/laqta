"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/api";

function StatCard({
  label,
  value,
  sub,
  href,
}: {
  label: string;
  value: number | string;
  sub?: string;
  href?: string;
}) {
  const inner = (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur hover:bg-white/7 transition">
      <div className="text-xs font-semibold text-white/60">{label}</div>
      <div className="mt-2 text-4xl font-extrabold text-white">{value}</div>
      {sub && <div className="mt-1 text-xs text-white/50">{sub}</div>}
    </div>
  );

  return href ? <Link href={href}>{inner}</Link> : inner;
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await apiFetch("/api/admin/stats");
        setStats(data);
      } catch (e: any) {
        setErr(e?.message ?? "Failed to load stats");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white/80 shadow-2xl backdrop-blur">
        Loading stats…
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
      <div>
        <div className="text-sm font-extrabold text-white/70">Admin</div>
        <h1 className="mt-2 text-3xl font-extrabold text-white">Overview</h1>
        <p className="mt-2 text-sm text-white/60">
          Platform summary at a glance.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Users"
          value={stats?.users ?? 0}
          sub={`${stats?.buyers ?? 0} buyers · ${stats?.sellers ?? 0} sellers`}
          href="/admin/users"
        />
        <StatCard
          label="Live Auctions"
          value={stats?.liveAuctions ?? 0}
          sub={`${stats?.auctions ?? 0} total auctions`}
          href="/admin/auctions"
        />
        <StatCard label="Total Bids" value={stats?.bids ?? 0} sub="All time" />
        <StatCard
          label="Pending KYC"
          value={stats?.pendingKyc ?? 0}
          sub="Awaiting review"
          href="/admin/kyc"
        />
      </div>

      {/* Quick links */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Link
          href="/admin/users"
          className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur hover:bg-white/7 transition"
        >
          <div className="text-2xl">👥</div>
          <div className="mt-3 font-extrabold text-white">Manage Users</div>
          <div className="mt-1 text-sm text-white/60">
            View all buyers and sellers
          </div>
        </Link>

        <Link
          href="/admin/kyc"
          className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur hover:bg-white/7 transition"
        >
          <div className="text-2xl">🔐</div>
          <div className="mt-3 font-extrabold text-white">KYC Review</div>
          <div className="mt-1 text-sm text-white/60">
            Approve or reject seller applications
          </div>
        </Link>

        <Link
          href="/admin/auctions"
          className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur hover:bg-white/7 transition"
        >
          <div className="text-2xl">📦</div>
          <div className="mt-3 font-extrabold text-white">Auctions</div>
          <div className="mt-1 text-sm text-white/60">
            View and manage all auctions
          </div>
        </Link>
      </div>
    </div>
  );
}
