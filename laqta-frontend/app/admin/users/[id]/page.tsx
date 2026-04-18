"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "../../../../lib/api";

function fmtTime(v: any) {
  const d = new Date(v);
  return isNaN(d.getTime()) ? String(v) : d.toLocaleString();
}

function RoleBadge({ role }: { role: string }) {
  const cls =
    role === "ADMIN"
      ? "bg-purple-500/15 text-purple-300 ring-purple-500/25"
      : role === "SELLER"
      ? "bg-[#FF7A1A]/15 text-[#FF7A1A] ring-[#FF7A1A]/25"
      : "bg-white/10 text-white/70 ring-white/15";

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-extrabold ring-1 ${cls}`}>
      {role}
    </span>
  );
}

export default function AdminUserDetailPage() {
  const params = useParams<{ id: string }>();
  const userId = params?.id;

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [tab, setTab] = useState<"bids" | "wins" | "seller">("bids");

  useEffect(() => {
    if (!userId) return;
    (async () => {
      try {
        setLoading(true);
        const data = await apiFetch(`/api/admin/users/${userId}`);
        setUser(data);
      } catch (e: any) {
        setErr(e?.message ?? "Failed to load user");
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  if (loading) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white/80 shadow-2xl backdrop-blur">
        Loading…
      </div>
    );
  }

  if (err || !user) {
    return (
      <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-6 text-red-100 shadow-2xl backdrop-blur">
        {err ?? "User not found"}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link
        href="/admin/users"
        className="text-sm text-white/60 hover:text-white"
      >
        ← Back to Users
      </Link>

      {/* User info card */}
      <div className="rounded-3xl border border-white/10 bg-white/5 p-7 shadow-2xl backdrop-blur">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-white">
              {user.fullName}
            </h1>
            <div className="mt-2 text-sm text-white/60">
              {user.email ?? "—"} • {user.phone ?? "—"}
            </div>
            <div className="mt-1 text-xs text-white/40">
              Joined: {fmtTime(user.createdAt)}
            </div>
          </div>
          <RoleBadge role={user.role} />
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="text-xs text-white/50">Total Bids</div>
            <div className="text-2xl font-extrabold text-white">
              {user.bids?.length ?? 0}
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="text-xs text-white/50">Auctions Won</div>
            <div className="text-2xl font-extrabold text-white">
              {user.wonAuctions?.length ?? 0}
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="text-xs text-white/50">User ID</div>
            <div className="text-2xl font-extrabold text-white">
              #{user.id}
            </div>
          </div>
        </div>
      </div>

      {/* Seller profile (if seller) */}
      {user.sellerProfile && (
        <div className="rounded-3xl border border-[#FF7A1A]/20 bg-[#FF7A1A]/5 p-6 shadow-2xl backdrop-blur">
          <div className="text-sm font-extrabold text-[#FF7A1A]">
            Seller Profile
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs text-white/50">Business Name</div>
              <div className="text-sm font-bold text-white">
                {user.sellerProfile.companyName ?? "—"}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs text-white/50">KYC Status</div>
              <div className={`text-sm font-bold ${
                user.sellerProfile.kycStatus === "APPROVED"
                  ? "text-emerald-400"
                  : user.sellerProfile.kycStatus === "REJECTED"
                  ? "text-red-400"
                  : "text-[#FF7A1A]"
              }`}>
                {user.sellerProfile.kycStatus}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs text-white/50">COD Allowed</div>
              <div className="text-sm font-bold text-white">
                {user.sellerProfile.allowsCod ? "Yes" : "No"}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-3">
        {(["bids", "wins", "seller"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
              tab === t
                ? "bg-[#FF7A1A] text-black"
                : "bg-white/10 text-white/80 hover:bg-white/15"
            }`}
          >
            {t === "bids" && `All Bids (${user.bids?.length ?? 0})`}
            {t === "wins" && `Won Auctions (${user.wonAuctions?.length ?? 0})`}
            {t === "seller" && "Seller Info"}
          </button>
        ))}
      </div>

      {/* Tab content: All Bids */}
      {tab === "bids" && (
        <div className="space-y-3">
          {(user.bids ?? []).map((b: any) => (
            <div
              key={b.id}
              className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="font-extrabold text-white">
                    {b.auction?.title ?? "—"}
                  </div>
                  <div className="mt-1 text-xs text-white/50">
                    {fmtTime(b.createdAt)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-extrabold text-white">
                    {Number(b.amount).toLocaleString()}{" "}
                    <span className="text-sm text-white/60">JOD</span>
                  </div>
                  {b.auction?.isWinner && (
                    <div className="text-xs font-bold text-emerald-400">
                      ✅ Winner
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-3">
                <Link
                  href={`/a/${b.auction?.id}`}
                  className="text-sm text-[#FF7A1A] hover:underline"
                >
                  View auction →
                </Link>
              </div>
            </div>
          ))}
          {(!user.bids || user.bids.length === 0) && (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white/60 shadow-2xl backdrop-blur">
              No bids yet.
            </div>
          )}
        </div>
      )}

      {/* Tab content: Won Auctions */}
      {tab === "wins" && (
        <div className="space-y-3">
          {(user.wonAuctions ?? []).map((b: any) => (
            <div
              key={b.id}
              className="rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-5 shadow-2xl backdrop-blur"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="font-extrabold text-white">
                    {b.auction?.title ?? "—"}
                  </div>
                  <div className="mt-1 text-xs text-white/50">
                    Ended: {fmtTime(b.auction?.endsAt)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-extrabold text-white">
                    {Number(b.amount).toLocaleString()}{" "}
                    <span className="text-sm text-white/60">JOD</span>
                  </div>
                  <div className="text-xs font-bold text-emerald-400">
                    ✅ Won
                  </div>
                </div>
              </div>
              <div className="mt-3">
                <Link
                  href={`/a/${b.auction?.id}`}
                  className="text-sm text-[#FF7A1A] hover:underline"
                >
                  View auction →
                </Link>
              </div>
            </div>
          ))}
          {(!user.wonAuctions || user.wonAuctions.length === 0) && (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white/60 shadow-2xl backdrop-blur">
              No won auctions yet.
            </div>
          )}
        </div>
      )}

      {/* Tab content: Seller Info */}
      {tab === "seller" && (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white/60 shadow-2xl backdrop-blur">
          {user.sellerProfile ? (
            <div className="text-sm text-white/80">
              Seller profile info is shown above.
            </div>
          ) : (
            <div>This user has not applied as a seller yet.</div>
          )}
        </div>
      )}
    </div>
  );
}
