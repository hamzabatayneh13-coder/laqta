"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../../../lib/api";

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === "APPROVED"
      ? "bg-emerald-500/15 text-emerald-300 ring-emerald-500/25"
      : status === "REJECTED"
      ? "bg-red-500/15 text-red-300 ring-red-500/25"
      : "bg-[#FF7A1A]/15 text-[#FF7A1A] ring-[#FF7A1A]/25";

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-extrabold ring-1 ${cls}`}>
      {status}
    </span>
  );
}

export default function AdminKycPage() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  async function load() {
    try {
      setLoading(true);
      setErr(null);
      const data = await apiFetch("/api/admin/kyc");
      setProfiles(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function approve(id: string) {
    try {
      setActionLoading(id + "_approve");
      await apiFetch(`/api/admin/kyc/${id}/approve`, { method: "POST" });
      await load();
    } catch (e: any) {
      alert(e?.message ?? "Failed to approve");
    } finally {
      setActionLoading(null);
    }
  }

  async function reject(id: string) {
    try {
      setActionLoading(id + "_reject");
      await apiFetch(`/api/admin/kyc/${id}/reject`, { method: "POST" });
      await load();
    } catch (e: any) {
      alert(e?.message ?? "Failed to reject");
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white/80 shadow-2xl backdrop-blur">
        Loading…
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
        <h1 className="mt-2 text-3xl font-extrabold text-white">KYC Review</h1>
        <p className="mt-2 text-sm text-white/60">
          Review and approve or reject seller applications.
        </p>
      </div>

      <div className="space-y-4">
        {profiles.map((p) => (
          <div
            key={p.id}
            className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="text-lg font-extrabold text-white">
                  {p.user?.fullName ?? "—"}
                </div>
                <div className="text-sm text-white/60">
                  {p.user?.email ?? "—"} • {p.user?.phone ?? "—"}
                </div>
                <div className="text-sm text-white/80">
                  Business: <span className="font-bold">{p.companyName}</span>
                </div>
                <div className="text-xs text-white/50">
                  Applied: {new Date(p.createdAt).toLocaleString()}
                </div>
              </div>

              <StatusBadge status={p.kycStatus} />
            </div>

            {p.kycStatus === "PENDING" && (
              <div className="mt-5 flex gap-3">
                <button
                  onClick={() => approve(p.id)}
                  disabled={actionLoading === p.id + "_approve"}
                  className="rounded-2xl bg-emerald-500 px-5 py-2 text-sm font-extrabold text-black hover:brightness-110 disabled:opacity-60"
                >
                  {actionLoading === p.id + "_approve" ? "Approving..." : "✅ Approve"}
                </button>

                <button
                  onClick={() => reject(p.id)}
                  disabled={actionLoading === p.id + "_reject"}
                  className="rounded-2xl bg-red-500/80 px-5 py-2 text-sm font-extrabold text-white hover:brightness-110 disabled:opacity-60"
                >
                  {actionLoading === p.id + "_reject" ? "Rejecting..." : "❌ Reject"}
                </button>
              </div>
            )}

            {p.kycStatus !== "PENDING" && (
              <div className="mt-4 text-sm text-white/50">
                {p.kycStatus === "APPROVED"
                  ? "This seller is approved and active."
                  : "This application was rejected."}
              </div>
            )}
          </div>
        ))}

        {profiles.length === 0 && (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white/70 shadow-2xl backdrop-blur">
            No seller applications yet.
          </div>
        )}
      </div>
    </div>
  );
}
