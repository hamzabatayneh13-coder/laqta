"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { apiFetch, API } from "../../../lib/api";

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === "LIVE"
      ? "bg-emerald-500/15 text-emerald-300 ring-emerald-500/25"
      : status === "PAUSED"
      ? "bg-purple-500/15 text-purple-200 ring-purple-500/25"
      : status === "PENDING_REVIEW"
      ? "bg-[#FF7A1A]/15 text-[#FF7A1A] ring-[#FF7A1A]/25"
      : status === "NEEDS_CHANGES"
      ? "bg-yellow-500/15 text-yellow-200 ring-yellow-500/25"
      : status === "SCHEDULED"
      ? "bg-sky-500/15 text-sky-200 ring-sky-500/25"
      : status === "ENDED_PENDING_PAYMENT"
      ? "bg-indigo-500/15 text-indigo-200 ring-indigo-500/25"
      : status === "COMPLETED"
      ? "bg-white/10 text-white/70 ring-white/15"
      : status === "CANCELLED"
      ? "bg-red-500/15 text-red-200 ring-red-500/25"
      : "bg-white/10 text-white/50 ring-white/15";

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-extrabold ring-1 ${cls}`}>
      {status}
    </span>
  );
}

type AuctionRow = {
  id: string;
  status: string;
  currentPrice?: string;
  endsAt: string;
  startsAt?: string;
  createdAt?: string;
  bidsCount?: number;

  // can be number or string depending on backend formatting
  bidStep?: number | string | null;

  lastReview?: { decision: string; reason?: string; createdAt: string } | null;
  listing?: {
    id?: string;
    title?: string;
    description?: string | null;
    location?: string | null;

    // what you show on UI
    category?: string | null;

    // ✅ NEW: backend should return this
    categoryObj?: { id: string; name: string; defaultMinBid?: number | null } | null;

    media?: { id: string; filePath: string }[];
  };
};

type AdminAction = "APPROVE" | "REQUEST_CHANGES" | "REJECT" | "PAUSE" | "RESUME" | "CLOSE";

export default function AdminAuctionsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [auctions, setAuctions] = useState<AuctionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [search, setSearch] = useState("");

  // ✅ URL-driven status filter
  const initialStatus = (searchParams.get("status") || "PENDING_REVIEW").toUpperCase();
  const [statusFilter, setStatusFilter] = useState(initialStatus);

  // modal state
  const [selected, setSelected] = useState<AuctionRow | null>(null);
  const [action, setAction] = useState<AdminAction | null>(null);
  const [reason, setReason] = useState("");
  const [newDescription, setNewDescription] = useState("");

  // for APPROVE
  const [bidStep, setBidStep] = useState<string>("");

  const [saving, setSaving] = useState(false);

  const apiBase = useMemo(() => API, []);

  // ✅ keep state synced when user uses browser back/forward or comes from detail page
  useEffect(() => {
    const s = (searchParams.get("status") || "PENDING_REVIEW").toUpperCase();
    setStatusFilter(s);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  function setStatusInUrl(next: string) {
    const sp = new URLSearchParams(searchParams.toString());
    const val = (next || "").toUpperCase();

    if (!val || val === "ALL") sp.delete("status");
    else sp.set("status", val);

    const qs = sp.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }

  async function loadAuctions() {
    try {
      setLoading(true);
      setErr(null);

      const qs =
        statusFilter && statusFilter !== "ALL" ? `?status=${encodeURIComponent(statusFilter)}` : "";

      const data = await apiFetch(`/api/admin/auctions${qs}`);
      setAuctions(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load auctions");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAuctions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const filtered = auctions.filter((a) => {
    const q = search.toLowerCase().trim();
    const title = (a.listing?.title ?? "").toLowerCase();
    return !q || title.includes(q);
  });

  function openAction(a: AuctionRow, nextAction: AdminAction) {
    setSelected(a);
    setAction(nextAction);
    setErr(null);
    setReason("");
    setNewDescription(a.listing?.description ?? "");

    if (nextAction === "APPROVE") {
      // ✅ Use:
      // 1) existing auction bidStep (if already set)
      // 2) else category defaultMinBid (floor)
      // 3) else fallback 1
      const floorRaw = a.listing?.categoryObj?.defaultMinBid;
      const floorN = floorRaw == null ? undefined : Number(floorRaw);

      const bidStepRaw = a.bidStep;
      const bidStepN = bidStepRaw == null ? undefined : Number(bidStepRaw);

      const chosen =
        (Number.isFinite(bidStepN as any) && (bidStepN as number) > 0 ? (bidStepN as number) : undefined) ??
        (Number.isFinite(floorN as any) && (floorN as number) > 0 ? (floorN as number) : undefined) ??
        1;

      setBidStep(String(chosen));
    } else {
      setBidStep("");
    }
  }

  function closeModal() {
    setSelected(null);
    setAction(null);
    setReason("");
    setNewDescription("");
    setBidStep("");
  }

  async function submitAction() {
    if (!selected || !action) return;

    // validations
    if (action === "REJECT" && !reason.trim()) return setErr("Reject reason is required.");
    if (action === "REQUEST_CHANGES" && !reason.trim())
      return setErr("Reason is required for requesting changes.");
    if (action === "APPROVE") {
      const n = Number(bidStep);
      if (!Number.isFinite(n) || n <= 0) {
        return setErr("Bid Step is required and must be a number greater than 0.");
      }
    }

    setSaving(true);
    setErr(null);

    try {
      if (action === "APPROVE") {
        await apiFetch(`/api/admin/auctions/${selected.id}/approve`, {
          method: "POST",
          body: JSON.stringify({
            reason: reason.trim() || undefined,
            bidStep: Number(bidStep),
          }),
        });
      }

      if (action === "REQUEST_CHANGES") {
        await apiFetch(`/api/admin/auctions/${selected.id}/request-changes`, {
          method: "POST",
          body: JSON.stringify({
            reason: reason.trim(),
            newDescription: newDescription?.trim() ? newDescription.trim() : undefined,
          }),
        });
      }

      if (action === "REJECT") {
        await apiFetch(`/api/admin/auctions/${selected.id}/reject`, {
          method: "POST",
          body: JSON.stringify({ reason: reason.trim() }),
        });
      }

      if (action === "PAUSE") {
        await apiFetch(`/api/admin/auctions/${selected.id}/pause`, { method: "POST" });
      }

      if (action === "RESUME") {
        await apiFetch(`/api/admin/auctions/${selected.id}/resume`, { method: "POST" });
      }

      if (action === "CLOSE") {
        await apiFetch(`/api/admin/auctions/${selected.id}/close`, {
          method: "POST",
          body: JSON.stringify({ reason: reason.trim() || undefined }),
        });
      }

      closeModal();
      await loadAuctions();
    } catch (e: any) {
      setErr(e?.message ?? "Action failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white/80 shadow-2xl backdrop-blur">
        Loading auctions…
      </div>
    );
  }

  // ✅ for passing back-link to details
  const returnTo = `${pathname}${
    statusFilter && statusFilter !== "ALL" ? `?status=${encodeURIComponent(statusFilter)}` : ""
  }`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-sm font-extrabold text-white/70">Admin</div>
          <h1 className="mt-2 text-3xl font-extrabold text-white">Auctions Review</h1>
          <p className="mt-2 text-sm text-white/60">
            {filtered.length} shown (filter: {statusFilter})
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/auctions/list"
            className="rounded-2xl bg-[#FF7A1A] px-4 py-2 text-sm font-extrabold text-black hover:brightness-110"
          >
            Auctions List →
          </Link>
        </div>
      </div>

      {err && (
        <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-4 text-red-100 shadow-2xl backdrop-blur">
          {err}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none"
          placeholder="Search by title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="rounded-2xl border border-white/10 bg-[#0d1117] px-4 py-3 text-sm text-white outline-none"
          style={{ backgroundColor: "#0d1117", color: "white" }}
          value={statusFilter}
          onChange={(e) => setStatusInUrl(e.target.value)}
        >
          <option style={{ backgroundColor: "#0d1117" }} value="PENDING_REVIEW">
            Pending Review
          </option>
          <option style={{ backgroundColor: "#0d1117" }} value="NEEDS_CHANGES">
            Needs Changes
          </option>
          <option style={{ backgroundColor: "#0d1117" }} value="SCHEDULED">
            Scheduled
          </option>
          <option style={{ backgroundColor: "#0d1117" }} value="LIVE">
            Live
          </option>
          <option style={{ backgroundColor: "#0d1117" }} value="PAUSED">
            Paused
          </option>
          <option style={{ backgroundColor: "#0d1117" }} value="ENDED_PENDING_PAYMENT">
            Ended (Pending Payment)
          </option>
          <option style={{ backgroundColor: "#0d1117" }} value="COMPLETED">
            Completed
          </option>
          <option style={{ backgroundColor: "#0d1117" }} value="CANCELLED">
            Cancelled
          </option>
          <option style={{ backgroundColor: "#0d1117" }} value="ALL">
            All Status
          </option>
        </select>

        <button
          onClick={loadAuctions}
          className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold text-white hover:bg-white/15"
        >
          Refresh
        </button>
      </div>

      {/* Auctions list */}
      <div className="space-y-3">
        {filtered.map((a) => (
          <div
            key={a.id}
            className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-[260px]">
                <div className="font-extrabold text-white">
                  {a.listing?.title ?? `Auction #${a.id}`}
                </div>
                <div className="mt-1 text-sm text-white/60">
                  {a.listing?.category ?? "—"} • {a.listing?.location ?? "—"}
                </div>
                <div className="mt-1 text-xs text-white/40">
                  Ends: {a.endsAt ? new Date(a.endsAt).toLocaleString() : "—"} •{" "}
                  {a.bidsCount ?? 0} bids
                </div>
                {a.lastReview?.reason && (
                  <div className="mt-2 text-xs text-white/60">
                    Last note: <span className="text-white/80">{a.lastReview.reason}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-col items-end gap-2">
                <StatusBadge status={a.status} />
                <div className="text-lg font-extrabold text-white">
                  {Number(a.currentPrice ?? 0).toLocaleString()}{" "}
                  <span className="text-xs text-white/60">JOD</span>
                </div>
              </div>
            </div>

            {!!a.listing?.media?.length && (
              <div className="mt-4 flex flex-wrap gap-2">
                {a.listing.media!.slice(0, 5).map((m) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={m.id}
                    src={`${apiBase}${m.filePath}`}
                    alt="auction media"
                    className="h-[70px] w-[110px] rounded-xl object-cover ring-1 ring-white/10"
                  />
                ))}
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href={`/a/${a.id}`}
                className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/15"
              >
                View (Public) →
              </Link>

              <Link
                href={`/admin/auctions/${a.id}?returnTo=${encodeURIComponent(returnTo)}`}
                className="rounded-2xl bg-[#FF7A1A] px-4 py-2 text-sm font-extrabold text-black hover:brightness-110"
              >
                View (Admin) →
              </Link>

              {(a.status === "PENDING_REVIEW" || a.status === "NEEDS_CHANGES") && (
                <>
                  <button
                    onClick={() => openAction(a, "APPROVE")}
                    className="rounded-2xl bg-emerald-500/20 px-4 py-2 text-sm font-extrabold text-emerald-200 ring-1 ring-emerald-500/30 hover:bg-emerald-500/25"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => openAction(a, "REQUEST_CHANGES")}
                    className="rounded-2xl bg-yellow-500/20 px-4 py-2 text-sm font-extrabold text-yellow-100 ring-1 ring-yellow-500/30 hover:bg-yellow-500/25"
                  >
                    Request Changes
                  </button>
                  <button
                    onClick={() => openAction(a, "REJECT")}
                    className="rounded-2xl bg-red-500/20 px-4 py-2 text-sm font-extrabold text-red-100 ring-1 ring-red-500/30 hover:bg-red-500/25"
                  >
                    Reject
                  </button>
                </>
              )}

              {a.status === "LIVE" && (
                <>
                  <button
                    onClick={() => openAction(a, "PAUSE")}
                    className="rounded-2xl bg-purple-500/20 px-4 py-2 text-sm font-extrabold text-purple-200 ring-1 ring-purple-500/30 hover:bg-purple-500/25"
                  >
                    Pause
                  </button>
                  <button
                    onClick={() => openAction(a, "CLOSE")}
                    className="rounded-2xl bg-red-500/20 px-4 py-2 text-sm font-extrabold text-red-100 ring-1 ring-red-500/30 hover:bg-red-500/25"
                  >
                    Close (Cancel)
                  </button>
                </>
              )}

              {a.status === "PAUSED" && (
                <>
                  <button
                    onClick={() => openAction(a, "RESUME")}
                    className="rounded-2xl bg-emerald-500/20 px-4 py-2 text-sm font-extrabold text-emerald-200 ring-1 ring-emerald-500/30 hover:bg-emerald-500/25"
                  >
                    Resume
                  </button>
                  <button
                    onClick={() => openAction(a, "CLOSE")}
                    className="rounded-2xl bg-red-500/20 px-4 py-2 text-sm font-extrabold text-red-100 ring-1 ring-red-500/30 hover:bg-red-500/25"
                  >
                    Close (Cancel)
                  </button>
                </>
              )}

              {a.status === "SCHEDULED" && (
                <button
                  onClick={() => openAction(a, "CLOSE")}
                  className="rounded-2xl bg-red-500/20 px-4 py-2 text-sm font-extrabold text-red-100 ring-1 ring-red-500/30 hover:bg-red-500/25"
                >
                  Close (Cancel)
                </button>
              )}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white/70 shadow-2xl backdrop-blur">
            No auctions found.
          </div>
        )}
      </div>

      {/* Modal */}
      {selected && action && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-[#0d1117] p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-extrabold text-white/70">Action</div>
                <div className="mt-1 text-xl font-extrabold text-white">
                  {action === "APPROVE"
                    ? "Approve Auction"
                    : action === "REQUEST_CHANGES"
                    ? "Request Changes"
                    : action === "REJECT"
                    ? "Reject Auction"
                    : action === "PAUSE"
                    ? "Pause Auction"
                    : action === "RESUME"
                    ? "Resume Auction"
                    : "Close Auction (Cancel)"}
                </div>
                <div className="mt-1 text-sm text-white/60">
                  {selected.listing?.title ?? `Auction #${selected.id}`}
                </div>
              </div>

              <button
                onClick={closeModal}
                className="rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-sm font-semibold text-white hover:bg-white/15"
              >
                Close
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {action === "APPROVE" && (
                <div>
                  <label className="block text-sm font-bold text-white/70">
                    Bid Step (JOD) <span className="text-red-300">*</span>
                  </label>
                  <input
                    value={bidStep}
                    onChange={(e) => setBidStep(e.target.value)}
                    type="number"
                    min="1"
                    step="1"
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 p-3 text-sm text-white outline-none"
                    placeholder="Example: 5"
                  />
                  <div className="mt-2 text-xs text-white/50">
                    Min next bid = current price + bid step.
                  </div>
                </div>
              )}

              {(action === "REQUEST_CHANGES" ||
                action === "REJECT" ||
                action === "APPROVE" ||
                action === "CLOSE") && (
                <>
                  <label className="block text-sm font-bold text-white/70">
                    Reason{" "}
                    {action === "APPROVE"
                      ? "(optional)"
                      : action === "CLOSE"
                      ? "(optional)"
                      : "(required)"}
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                    className="w-full rounded-2xl border border-white/10 bg-black/20 p-3 text-sm text-white outline-none"
                    placeholder="Write reason…"
                  />
                </>
              )}

              {action === "REQUEST_CHANGES" && (
                <>
                  <label className="block text-sm font-bold text-white/70">
                    New Description (optional)
                  </label>
                  <textarea
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    rows={6}
                    className="w-full rounded-2xl border border-white/10 bg-black/20 p-3 text-sm text-white outline-none"
                    placeholder="Admin-edited description…"
                  />
                </>
              )}

              {(action === "PAUSE" || action === "RESUME") && (
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/70">
                  This will {action === "PAUSE" ? "pause" : "resume"} the auction immediately.
                </div>
              )}

              {action === "CLOSE" && (
                <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100">
                  Closing will immediately set the auction status to <b>CANCELLED</b>.
                </div>
              )}
            </div>

            <div className="mt-5 flex flex-wrap justify-end gap-3">
              <button
                onClick={closeModal}
                disabled={saving}
                className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/15 disabled:opacity-60"
              >
                Cancel
              </button>

              <button
                onClick={submitAction}
                disabled={saving}
                className="rounded-2xl bg-[#FF7A1A] px-4 py-2 text-sm font-extrabold text-black hover:opacity-90 disabled:opacity-60"
              >
                {saving ? "Saving..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
