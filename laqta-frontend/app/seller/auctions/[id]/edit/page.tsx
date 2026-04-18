"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiFetch, apiUpload, API } from "@/lib/api";

type Category = {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
};

type MediaItem = { id: string; filePath: string };

type AuctionSellerDetail = {
  id: string;
  status: string;
  endsAt: string;
  startPrice?: string;
  listing?: {
    id?: string;
    title?: string;
    description?: string | null;
    categoryId?: string;
    category?: { id: string; nameEn: string; nameAr: string } | null;
    media?: MediaItem[];
  };
  lastReview?: { decision: string; reason?: string; createdAt: string } | null;
};

const inputCls =
  "w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:ring-2 focus:ring-[#FF7A1A]/40";
const labelCls = "block text-sm font-extrabold text-white/80";

function fmtTime(v: any) {
  if (!v) return "—";
  const d = new Date(v);
  return isNaN(d.getTime()) ? String(v) : d.toLocaleString();
}

// Convert ISO date -> value for <input type="datetime-local">
function toDateTimeLocalValue(iso: string) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

export default function EditAuctionPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const auctionId = params?.id;

  const apiBase = useMemo(() => API, []);

  const [categories, setCategories] = useState<Category[]>([]);
  const [auction, setAuction] = useState<AuctionSellerDetail | null>(null);

  const [categoryId, setCategoryId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [startPrice, setStartPrice] = useState("");
  const [description, setDescription] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);

  // ✅ preview selected new photos (before Save)
  const [newPreviews, setNewPreviews] = useState<{ name: string; url: string }[]>([]);

  // ✅ selection state for bulk delete (existing photos)
  const [selectedMediaIds, setSelectedMediaIds] = useState<Set<string>>(new Set());
  const [deletingPhotos, setDeletingPhotos] = useState(false);

  const [loadingCats, setLoadingCats] = useState(false);
  const [loadingAuction, setLoadingAuction] = useState(false);
  const [saving, setSaving] = useState(false);
  const [resubmitting, setResubmitting] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  const canEdit =
    auction?.status === "NEEDS_CHANGES" ||
    auction?.status === "DRAFT" ||
    auction?.status === "PENDING_REVIEW";

  const canResubmit = auction?.status === "NEEDS_CHANGES";

  // cleanup previews on unmount
  useEffect(() => {
    return () => {
      setNewPreviews((prev) => {
        prev.forEach((p) => URL.revokeObjectURL(p.url));
        return [];
      });
    };
  }, []);

  // Load categories
  useEffect(() => {
    let mounted = true;

    (async () => {
      setLoadingCats(true);
      try {
        const data = await apiFetch("/api/categories");
        const list = Array.isArray(data) ? data : [];
        if (!mounted) return;
        setCategories(list);
      } catch (e: any) {
        if (mounted) setError(e?.message ?? "Failed to load categories");
      } finally {
        if (mounted) setLoadingCats(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  async function loadAuction() {
    if (!auctionId) return;

    setLoadingAuction(true);
    setError(null);
    setOkMsg(null);

    try {
      // ✅ requires backend: GET /api/seller/auctions/:id
      const data = (await apiFetch(`/api/seller/auctions/${auctionId}`)) as AuctionSellerDetail;

      setAuction(data);

      const existingCategoryId = data?.listing?.categoryId ?? data?.listing?.category?.id ?? "";
      setCategoryId(String(existingCategoryId || ""));
      setTitle(data?.listing?.title ?? "");
      setStartPrice(String(data?.startPrice ?? ""));
      setDescription(String(data?.listing?.description ?? ""));
      setEndsAt(data?.endsAt ? toDateTimeLocalValue(data.endsAt) : "");

      // reset selections & new uploads (so UI reflects DB)
      setSelectedMediaIds(new Set());
      setFiles(null);
      setNewPreviews((prev) => {
        prev.forEach((p) => URL.revokeObjectURL(p.url));
        return [];
      });
    } catch (e: any) {
      setError(e?.message ?? "Failed to load auction");
    } finally {
      setLoadingAuction(false);
    }
  }

  // Load auction detail
  useEffect(() => {
    loadAuction();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auctionId]);

  const media = Array.isArray(auction?.listing?.media) ? (auction!.listing!.media as MediaItem[]) : [];

  function toggleSelectMedia(id: string) {
    setSelectedMediaIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAllMedia() {
    setSelectedMediaIds(new Set(media.map((m) => String(m.id))));
  }

  function clearSelection() {
    setSelectedMediaIds(new Set());
  }

  async function deleteSelectedPhotos() {
    if (!auctionId) return;
    if (!canEdit) return setError("Editing is disabled for this auction status.");
    if (selectedMediaIds.size === 0) return;

    const confirmed = window.confirm(`Delete ${selectedMediaIds.size} selected photo(s)? This cannot be undone.`);
    if (!confirmed) return;

    setDeletingPhotos(true);
    setError(null);
    setOkMsg(null);

    try {
      const ids = Array.from(selectedMediaIds);

      for (const mediaId of ids) {
        // ✅ requires backend: DELETE /api/seller/auctions/:auctionId/media/:mediaId
        await apiFetch(`/api/seller/auctions/${auctionId}/media/${mediaId}`, {
          method: "DELETE",
        });
      }

      setOkMsg("Selected photos deleted.");
      await loadAuction();
    } catch (e: any) {
      setError(e?.message ?? "Failed to delete selected photos");
    } finally {
      setDeletingPhotos(false);
    }
  }

  // ✅ UPDATED: returns boolean so resubmit can auto-save and stop on failure
  async function onSave(opts?: { silent?: boolean }): Promise<boolean> {
    if (!auctionId) return false;

    if (!opts?.silent) {
      setError(null);
      setOkMsg(null);
    } else {
      setError(null);
    }

    if (!canEdit) {
      setError("Editing is disabled for this auction status.");
      return false;
    }

    if (!categoryId) {
      setError("Category is required");
      return false;
    }
    if (!title.trim()) {
      setError("Title is required");
      return false;
    }

    const sp = Number(startPrice);
    if (!Number.isFinite(sp) || sp < 0) {
      setError("Start price must be a valid number (>= 0).");
      return false;
    }

    if (!description.trim()) {
      setError("Description is required");
      return false;
    }
    if (!endsAt) {
      setError("Ends at is required");
      return false;
    }

    setSaving(true);

    try {
      let photoPaths: string[] | undefined = undefined;

      // Upload new photos (append)
      if (files && files.length > 0) {
        const fd = new FormData();
        Array.from(files).forEach((f) => fd.append("files", f));

        const uploadRes = await apiUpload("/api/seller/auctions/photos", fd);
        photoPaths = uploadRes.photoPaths as string[];
      }

      // ✅ requires backend: PATCH /api/seller/auctions/:id
      await apiFetch(`/api/seller/auctions/${auctionId}`, {
        method: "PATCH",
        body: JSON.stringify({
          startPrice: String(startPrice),
          categoryId: String(categoryId),
          title,
          description,
          endsAt: new Date(endsAt).toISOString(),
          ...(photoPaths ? { photoPaths } : {}),
        }),
      });

      if (!opts?.silent) setOkMsg("Saved successfully.");

      // clear previews after save
      setNewPreviews((prev) => {
        prev.forEach((p) => URL.revokeObjectURL(p.url));
        return [];
      });
      setFiles(null);

      await loadAuction();
      return true;
    } catch (e: any) {
      setError(e?.message ?? "Failed to save changes");
      return false;
    } finally {
      setSaving(false);
    }
  }

  // ✅ UPDATED: auto-save photos+fields before resubmit
  async function onResubmit() {
    if (!auctionId) return;

    setError(null);
    setOkMsg(null);

    if (!canResubmit) return setError('Resubmit is available only when status is "NEEDS_CHANGES".');

    setResubmitting(true);

    try {
      // ✅ auto-save first (uploads photos too)
      const saved = await onSave({ silent: true });
      if (!saved) return;

      await apiFetch(`/api/seller/auctions/${auctionId}/resubmit`, { method: "POST" });

      setOkMsg("Resubmitted successfully. Pending admin review.");
      router.push("/seller/auctions");
    } catch (e: any) {
      setError(e?.message ?? "Failed to resubmit");
    } finally {
      setResubmitting(false);
    }
  }

  if (loadingAuction) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 px-6 py-8">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white/80 shadow-2xl backdrop-blur">
          Loading auction…
        </div>
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 px-6 py-8">
        <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-6 text-red-100 shadow-2xl backdrop-blur">
          {error ?? "Auction not found"}
        </div>
        <Link href="/seller/auctions" className="text-sm text-white/60 hover:text-white">
          ← Back to My Auctions
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-6 py-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/seller/auctions" className="text-sm text-white/60 hover:text-white">
            ← Back to My Auctions
          </Link>

          <h1 className="mt-3 text-3xl font-extrabold text-white">Edit Auction</h1>

          <p className="mt-2 text-sm text-white/60">
            Status: <span className="font-extrabold text-white">{auction.status}</span> • Ends:{" "}
            <span className="font-extrabold text-white">{fmtTime(auction.endsAt)}</span>
          </p>

          {auction.lastReview?.reason ? (
            <div className="mt-3 rounded-2xl border border-yellow-500/25 bg-yellow-500/10 p-4 text-sm text-yellow-50">
              <div className="font-extrabold">Admin note</div>
              <div className="mt-1 text-yellow-50/90">{auction.lastReview.reason}</div>
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href={`/a/${auction.id}`}
            className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/15"
          >
            View Public →
          </Link>
        </div>
      </div>

      {!canEdit && (
        <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-5 text-red-100 shadow-2xl backdrop-blur">
          Editing is disabled for status <b>{auction.status}</b>.
        </div>
      )}

      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Category</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              disabled={loadingCats || !canEdit}
              className={`${inputCls} bg-[#0d1117]`}
              style={{ backgroundColor: "#0d1117", color: "white" }}
            >
              {categories.map((c) => (
                <option
                  key={String(c.id)}
                  value={String(c.id)}
                  style={{ backgroundColor: "#0d1117", color: "white" }}
                >
                  {c.nameEn} ({c.nameAr})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelCls}>Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} disabled={!canEdit} />
          </div>

          <div>
            <label className={labelCls}>Start Price (JOD)</label>
            <input
              value={startPrice}
              onChange={(e) => setStartPrice(e.target.value)}
              placeholder="e.g. 100"
              className={inputCls}
              disabled={!canEdit}
            />
          </div>

          <div>
            <label className={labelCls}>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              className={inputCls}
              disabled={!canEdit}
            />
          </div>

          <div>
            <label className={labelCls}>Ends At</label>
            <input
              type="datetime-local"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
              className={inputCls}
              disabled={!canEdit}
            />
          </div>

          {/* Existing photos: select + delete selected */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className={labelCls}>Current Photos</label>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={!canEdit || media.length === 0}
                  onClick={selectAllMedia}
                  className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-xs font-extrabold text-white hover:bg-white/15 disabled:opacity-60"
                >
                  Select all
                </button>

                <button
                  type="button"
                  disabled={!canEdit || selectedMediaIds.size === 0}
                  onClick={clearSelection}
                  className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-xs font-extrabold text-white hover:bg-white/15 disabled:opacity-60"
                >
                  Clear
                </button>

                <button
                  type="button"
                  disabled={!canEdit || selectedMediaIds.size === 0 || deletingPhotos}
                  onClick={deleteSelectedPhotos}
                  className="rounded-xl bg-red-500/20 px-3 py-2 text-xs font-extrabold text-red-100 ring-1 ring-red-500/30 hover:bg-red-500/25 disabled:opacity-60"
                >
                  {deletingPhotos ? "Deleting..." : `Delete Selected (${selectedMediaIds.size})`}
                </button>
              </div>
            </div>

            {media.length === 0 ? (
              <div className="mt-2 text-sm text-white/60">No photos yet.</div>
            ) : (
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {media.map((m) => {
                  const id = String(m.id);
                  const selected = selectedMediaIds.has(id);

                  return (
                    <button
                      key={id}
                      type="button"
                      disabled={!canEdit}
                      onClick={() => toggleSelectMedia(id)}
                      className={`text-left rounded-2xl border p-2 transition disabled:opacity-60 ${
                        selected ? "border-[#FF7A1A]/40 bg-[#FF7A1A]/10" : "border-white/10 bg-black/20 hover:bg-white/5"
                      }`}
                      title={selected ? "Selected" : "Click to select"}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`${apiBase}${m.filePath}`}
                        alt="auction media"
                        className="h-28 w-full rounded-xl object-cover ring-1 ring-white/10"
                      />
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <div className="text-xs font-extrabold text-white/80">{selected ? "Selected" : "Select"}</div>
                        <input type="checkbox" checked={selected} readOnly className="h-4 w-4 accent-[#FF7A1A]" />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="mt-2 text-xs text-white/50">
              Tip: select multiple photos then click <b>Delete Selected</b>.
            </div>
          </div>

          {/* Add new photos (append) + preview */}
          <div>
            <label className={labelCls}>Add More Photos (optional, max 10)</label>

            <input
              type="file"
              accept="image/*"
              multiple
              disabled={!canEdit}
              onChange={(e) => {
                const fl = e.target.files;
                setFiles(fl);

                // cleanup old previews
                setNewPreviews((prev) => {
                  prev.forEach((p) => URL.revokeObjectURL(p.url));
                  return [];
                });

                if (!fl || fl.length === 0) return;

                const next = Array.from(fl).map((f) => ({
                  name: f.name,
                  url: URL.createObjectURL(f),
                }));
                setNewPreviews(next);
              }}
              className="block w-full text-sm text-white/80 file:mr-4 file:rounded-xl file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-sm file:font-extrabold file:text-white hover:file:bg-white/15 disabled:opacity-60"
            />

            {newPreviews.length > 0 && (
              <div className="mt-3">
                <div className="text-sm font-extrabold text-white/80">New Photos (not saved yet)</div>
                <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {newPreviews.map((p) => (
                    <div key={p.url} className="rounded-2xl border border-white/10 bg-black/20 p-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.url}
                        alt={p.name}
                        className="h-28 w-full rounded-xl object-cover ring-1 ring-white/10"
                      />
                      <div className="mt-2 truncate text-xs text-white/60">{p.name}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-2 text-xs text-white/50">
                  These will be uploaded when you click <b>Save Changes</b> — or <b>Resubmit for Review</b> (auto-saves).
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-100">{error}</div>
          )}

          {okMsg && (
            <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-3 text-sm text-emerald-50">
              {okMsg}
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              disabled={!canEdit || saving || resubmitting}
              onClick={() => onSave()}
              className="rounded-2xl border border-white/10 bg-white/10 px-5 py-3 text-sm font-extrabold text-white hover:bg-white/15 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>

            <button
              disabled={!canResubmit || resubmitting || saving}
              onClick={onResubmit}
              className="rounded-2xl bg-[#FF7A1A] px-5 py-3 text-sm font-extrabold text-black hover:opacity-90 disabled:opacity-60"
            >
              {resubmitting ? "Resubmitting..." : "Resubmit for Review"}
            </button>
          </div>

          {!canResubmit && (
            <div className="text-xs text-white/45">
              “Resubmit for Review” is available only when status is <b>NEEDS_CHANGES</b>.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
