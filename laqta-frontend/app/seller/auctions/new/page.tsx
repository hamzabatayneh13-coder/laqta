"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch, apiUpload } from "@/lib/api";

type Category = {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
};

const inputCls =
  "w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:ring-2 focus:ring-[#FF7A1A]/40";
const labelCls = "block text-sm font-extrabold text-white/80";

export default function NewAuctionPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<string>("");

  const [title, setTitle] = useState("");
  const [startPrice, setStartPrice] = useState(""); // ✅ NEW
  const [description, setDescription] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);

  const [loadingCats, setLoadingCats] = useState(false);
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ auctionId: string } | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      setLoadingCats(true);
      setError(null);
      try {
        const data = await apiFetch("/api/categories");
        const list = Array.isArray(data) ? data : [];
        if (!mounted) return;

        setCategories(list);
        if (list.length) setCategoryId(String(list[0].id));
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

  async function onSubmit() {
    setError(null);
    setSuccess(null);

    if (!categoryId) return setError("Category is required");
    if (!title.trim()) return setError("Title is required");

    const sp = Number(startPrice);
    if (!Number.isFinite(sp) || sp < 0) return setError("Start price must be a valid number (>= 0).");

    if (!description.trim()) return setError("Description is required");
    if (!endsAt) return setError("Ends at is required");
    if (!files || files.length === 0) return setError("At least 1 photo is required");

    setLoading(true);
    try {
      // 1) Upload photos
      const fd = new FormData();
      Array.from(files).forEach((f) => fd.append("files", f));

      const uploadRes = await apiUpload("/api/seller/auctions/photos", fd);
      const photoPaths = uploadRes.photoPaths as string[];

      // 2) Create auction request
      const auction = await apiFetch("/api/seller/auctions", {
        method: "POST",
        body: JSON.stringify({
          startPrice: String(startPrice), // ✅ NEW
          categoryId: String(categoryId),
          title,
          description,
          endsAt: new Date(endsAt).toISOString(),
          photoPaths,
        }),
      });

      setSuccess({ auctionId: String(auction?.id ?? "") });
    } catch (e: any) {
      setError(e?.message ?? "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-6 py-8">
      <div>
        <h1 className="text-3xl font-extrabold text-white">Submit Auction for Review</h1>
        <p className="mt-2 text-sm text-white/60">
          Upload photos, choose category, and submit. Admin will approve / request changes / reject.
        </p>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Category</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              disabled={loadingCats}
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
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} />
          </div>

          {/* ✅ NEW: Start price */}
          <div>
            <label className={labelCls}>Start Price (JOD)</label>
            <input
              value={startPrice}
              onChange={(e) => setStartPrice(e.target.value)}
              placeholder="e.g. 100"
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>Ends At</label>
            <input
              type="datetime-local"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>Photos (max 10)</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setFiles(e.target.files)}
              className="block w-full text-sm text-white/80 file:mr-4 file:rounded-xl file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-sm file:font-extrabold file:text-white hover:file:bg-white/15"
            />
          </div>

          {error && (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-100">
              {error}
            </div>
          )}

          <button
            disabled={loading}
            onClick={onSubmit}
            className="w-full rounded-2xl bg-[#FF7A1A] px-5 py-3 text-sm font-extrabold text-black hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "Submitting..." : "Submit"}
          </button>
        </div>
      </div>

      {success && (
        <div className="rounded-3xl border border-emerald-500/25 bg-emerald-500/10 p-6 text-emerald-50 shadow-2xl backdrop-blur">
          <div className="text-sm font-extrabold text-emerald-200/90">Submitted successfully</div>
          <div className="mt-2 text-lg font-extrabold">
            Your auction is now <span className="text-emerald-200">Pending Review</span>.
          </div>
          <div className="mt-2 text-sm text-emerald-100/80">
            If changes are needed, you'll see a note in <b>My Auctions</b>.
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/seller/auctions"
              className="rounded-2xl bg-emerald-400/20 px-4 py-2 text-sm font-extrabold text-emerald-100 ring-1 ring-emerald-500/30 hover:bg-emerald-400/25"
            >
              Go to My Auctions →
            </Link>

            <button
              type="button"
              onClick={() => {
                setTitle("");
                setStartPrice(""); // ✅ NEW reset
                setDescription("");
                setEndsAt("");
                setFiles(null);
                setSuccess(null);
              }}
              className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-extrabold text-white hover:bg-white/15"
            >
              Create another auction
            </button>
          </div>

          {success.auctionId && (
            <div className="mt-3 text-xs text-emerald-100/60">Auction ID: {success.auctionId}</div>
          )}
        </div>
      )}
    </div>
  );
}
