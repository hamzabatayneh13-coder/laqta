"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../../../lib/api";

type Cat = {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;

  // UI keeps it as string (input). Backend can return number; we normalize on load.
  defaultMinBid: string;

  // ✅ NEW
  parentId: string | null;
  parent?: { id: string; nameEn: string } | null;
};

function Badge({ text }: { text: string }) {
  return (
    <span className="inline-flex rounded-full px-3 py-1 text-xs font-extrabold ring-1 ring-white/15 bg-white/10 text-white/70">
      {text}
    </span>
  );
}

export default function AdminCategoriesPage() {
  const [cats, setCats] = useState<Cat[]>([]);
  const [loading, setLoading] = useState(true);

  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  // create form
  const [slug, setSlug] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [defaultMinBid, setDefaultMinBid] = useState("10");

  // ✅ NEW
  const [parentId, setParentId] = useState<string>(""); // "" means none

  const topLevelCats = useMemo(() => cats.filter((c) => !c.parentId), [cats]);

  async function load() {
    setErr(null);
    setOk(null);
    setLoading(true);
    try {
      const data = await apiFetch("/api/admin/categories");
      const arr = Array.isArray(data) ? data : [];

      // normalize types for UI
      const normalized: Cat[] = arr.map((c: any) => ({
        id: String(c.id),
        slug: String(c.slug ?? ""),
        nameEn: String(c.nameEn ?? ""),
        nameAr: String(c.nameAr ?? ""),
        defaultMinBid: c.defaultMinBid == null ? "1" : String(c.defaultMinBid),
        parentId: c.parentId == null ? null : String(c.parentId),
        parent: c.parent ?? null,
      }));

      setCats(normalized);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load categories");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function createCategory() {
    setErr(null);
    setOk(null);

    const dmb = Number(defaultMinBid);
    if (!Number.isFinite(dmb) || dmb < 0) {
      setErr("Default Min Bid must be a valid number (>= 0)");
      return;
    }

    if (!slug.trim() || !nameEn.trim() || !nameAr.trim()) {
      setErr("Please fill slug, English name, and Arabic name.");
      return;
    }

    try {
      await apiFetch("/api/admin/categories", {
        method: "POST",
        body: JSON.stringify({
          slug: slug.trim().toLowerCase(),
          nameEn: nameEn.trim(),
          nameAr: nameAr.trim(),
          defaultMinBid: dmb,

          // ✅ NEW
          parentId: parentId.trim() ? parentId.trim() : null,
        }),
      });

      setOk("Category created");
      setSlug("");
      setNameEn("");
      setNameAr("");
      setParentId("");
      await load();
    } catch (e: any) {
      setErr(e?.message ?? "Failed to create category");
    }
  }

  async function saveRow(c: Cat) {
    setErr(null);
    setOk(null);

    const dmb = Number(c.defaultMinBid);
    if (!Number.isFinite(dmb) || dmb < 0) {
      setErr("Default Min Bid must be a valid number (>= 0)");
      return;
    }

    if (!c.slug.trim() || !c.nameEn.trim() || !c.nameAr.trim()) {
      setErr("slug/nameEn/nameAr cannot be empty");
      return;
    }

    // prevent self-parent in UI
    if (c.parentId && c.parentId === c.id) {
      setErr("Category cannot be its own parent");
      return;
    }

    try {
      await apiFetch(`/api/admin/categories/${c.id}`, {
        method: "PUT",
        body: JSON.stringify({
          slug: c.slug.trim().toLowerCase(),
          nameEn: c.nameEn.trim(),
          nameAr: c.nameAr.trim(),
          defaultMinBid: dmb,

          // ✅ NEW
          parentId: c.parentId ? c.parentId : null,
        }),
      });

      setOk(`Saved: ${c.nameEn}`);
      await load();
    } catch (e: any) {
      setErr(e?.message ?? "Failed to save category");
    }
  }

  if (loading) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white/80 shadow-2xl backdrop-blur">
        Loading…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm font-extrabold text-white/70">Admin</div>
          <h1 className="mt-1 text-3xl font-extrabold text-white">Categories</h1>
          <div className="mt-1 text-sm text-white/60">
            Manage categories + <b>defaultMinBid</b> + <b>sub-categories</b> (Admin-only).
          </div>
        </div>
        <Badge text={`${cats.length} categories`} />
      </div>

      {err && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-100">
          {err}
        </div>
      )}
      {ok && (
        <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-3 text-sm text-emerald-50">
          {ok}
        </div>
      )}

      {/* Create new */}
      <div className="rounded-3xl border border-white/10 bg-white/5 p-7 shadow-2xl backdrop-blur">
        <h2 className="text-xl font-extrabold text-white">Add New Category</h2>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="slug (e.g. vehicles)"
            className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:ring-2 focus:ring-[#FF7A1A]/40"
          />
          <input
            value={nameEn}
            onChange={(e) => setNameEn(e.target.value)}
            placeholder="English name"
            className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:ring-2 focus:ring-[#FF7A1A]/40"
          />
          <input
            value={nameAr}
            onChange={(e) => setNameAr(e.target.value)}
            placeholder="Arabic name"
            className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:ring-2 focus:ring-[#FF7A1A]/40"
          />
          <input
            value={defaultMinBid}
            onChange={(e) => setDefaultMinBid(e.target.value)}
            placeholder="defaultMinBid (JOD)"
            className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:ring-2 focus:ring-[#FF7A1A]/40"
          />

          {/* ✅ NEW: parent */}
          <select
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
            className="rounded-2xl border border-white/10 bg-[#0d1117] px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-[#FF7A1A]/40"
            style={{ backgroundColor: "#0d1117", color: "white" }}
          >
            <option style={{ backgroundColor: "#0d1117" }} value="">
              Parent: None (Top-level)
            </option>
            {topLevelCats.map((p) => (
              <option key={p.id} style={{ backgroundColor: "#0d1117" }} value={p.id}>
                Parent: {p.nameEn}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={createCategory}
          className="mt-4 rounded-2xl bg-[#FF7A1A] px-5 py-3 text-sm font-extrabold text-black hover:opacity-90"
        >
          Create Category
        </button>

        <div className="mt-3 text-xs text-white/45">
          Suggested MVP defaults (editable): Vehicles=50, Real Estate=250, Electronics=10, Home & Furniture=5
        </div>
      </div>

      {/* Table */}
      <div className="rounded-3xl border border-white/10 bg-white/5 p-7 shadow-2xl backdrop-blur">
        <h2 className="text-xl font-extrabold text-white">All Categories</h2>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[1100px] text-sm text-white/80">
            <thead>
              <tr className="text-left text-xs text-white/50">
                <th className="py-2">Parent</th>
                <th className="py-2">Slug</th>
                <th className="py-2">Name (EN)</th>
                <th className="py-2">Name (AR)</th>
                <th className="py-2">Default Min Bid (JOD)</th>
                <th className="py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {cats.map((c) => (
                <tr key={c.id} className="border-t border-white/10">
                  {/* parent selector */}
                  <td className="py-3 pr-3">
                    <select
                      value={c.parentId ?? ""}
                      onChange={(e) => {
                        const v = e.target.value || null;
                        setCats((prev) => prev.map((x) => (x.id === c.id ? { ...x, parentId: v } : x)));
                      }}
                      className="w-full rounded-xl border border-white/10 bg-[#0d1117] px-3 py-2 text-white outline-none focus:ring-2 focus:ring-[#FF7A1A]/30"
                      style={{ backgroundColor: "#0d1117", color: "white" }}
                    >
                      <option style={{ backgroundColor: "#0d1117" }} value="">
                        None
                      </option>
                      {/* only allow choosing top-level parents, and not itself */}
                      {topLevelCats
                        .filter((p) => p.id !== c.id)
                        .map((p) => (
                          <option key={p.id} style={{ backgroundColor: "#0d1117" }} value={p.id}>
                            {p.nameEn}
                          </option>
                        ))}
                    </select>
                  </td>

                  <td className="py-3 pr-3">
                    <input
                      value={c.slug}
                      onChange={(e) => {
                        const v = e.target.value;
                        setCats((prev) => prev.map((x) => (x.id === c.id ? { ...x, slug: v } : x)));
                      }}
                      className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-[#FF7A1A]/30"
                    />
                  </td>

                  <td className="py-3 pr-3">
                    <input
                      value={c.nameEn}
                      onChange={(e) => {
                        const v = e.target.value;
                        setCats((prev) => prev.map((x) => (x.id === c.id ? { ...x, nameEn: v } : x)));
                      }}
                      className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-[#FF7A1A]/30"
                    />
                  </td>

                  <td className="py-3 pr-3">
                    <input
                      value={c.nameAr}
                      onChange={(e) => {
                        const v = e.target.value;
                        setCats((prev) => prev.map((x) => (x.id === c.id ? { ...x, nameAr: v } : x)));
                      }}
                      className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-[#FF7A1A]/30"
                    />
                  </td>

                  <td className="py-3 pr-3">
                    <input
                      value={c.defaultMinBid}
                      onChange={(e) => {
                        const v = e.target.value;
                        setCats((prev) => prev.map((x) => (x.id === c.id ? { ...x, defaultMinBid: v } : x)));
                      }}
                      className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-[#FF7A1A]/30"
                    />
                  </td>

                  <td className="py-3">
                    <button
                      onClick={() => saveRow(c)}
                      className="rounded-xl bg-[#FF7A1A] px-4 py-2 text-xs font-extrabold text-black hover:opacity-90"
                    >
                      Save
                    </button>
                  </td>
                </tr>
              ))}

              {cats.length === 0 && (
                <tr>
                  <td className="py-4 text-white/60" colSpan={6}>
                    No categories found. Create your first category above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-3 text-xs text-white/45">
          Sub-categories: set <b>Parent</b> to create a child under a top-level category.
        </div>
      </div>
    </div>
  );
}
