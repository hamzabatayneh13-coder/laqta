"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../../../lib/api";

type Cat = {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  defaultMinBid: string;
  parentId: string | null;
  parent?: { id: string; nameEn: string } | null;
};

type CatNode = Cat & { children: CatNode[] };

function Badge({ text }: { text: string }) {
  return (
    <span className="inline-flex rounded-full px-3 py-1 text-xs font-extrabold ring-1 ring-white/15 bg-white/10 text-white/70">
      {text}
    </span>
  );
}

function buildTree(items: Cat[]): CatNode[] {
  const map = new Map<string, CatNode>();
  for (const c of items) map.set(String(c.id), { ...c, children: [] });

  const roots: CatNode[] = [];
  for (const node of map.values()) {
    if (!node.parentId) {
      roots.push(node);
      continue;
    }
    const parent = map.get(String(node.parentId));
    if (!parent) {
      roots.push(node);
      continue;
    }
    parent.children.push(node);
  }

  const sortByName = (a: CatNode, b: CatNode) => (a.nameEn || "").localeCompare(b.nameEn || "");
  const sortRec = (nodes: CatNode[]) => {
    nodes.sort(sortByName);
    for (const n of nodes) sortRec(n.children);
  };
  sortRec(roots);

  return roots;
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
  const [parentId, setParentId] = useState<string>(""); // "" means none

  // expand parents
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const topLevelCats = useMemo(() => cats.filter((c) => !c.parentId), [cats]);
  const tree = useMemo(() => buildTree(cats), [cats]);

  async function load() {
    setErr(null);
    setOk(null);
    setLoading(true);
    try {
      const data = await apiFetch("/api/admin/categories");
      const arr = Array.isArray(data) ? data : [];

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

  function toggleExpand(id: string) {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }

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
          parentId: parentId.trim() ? parentId.trim() : null,
        }),
      });

      setOk("Category created");
      setSlug("");
      setNameEn("");
      setNameAr("");
      setDefaultMinBid("10");
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
          // keep parentId as-is (we removed parent dropdown per row)
          parentId: c.parentId ? c.parentId : null,
        }),
      });

      setOk(`Saved: ${c.nameEn}`);
      await load();
    } catch (e: any) {
      setErr(e?.message ?? "Failed to save category");
    }
  }

  async function deleteCategory(c: Cat) {
    setErr(null);
    setOk(null);

    const yes = window.confirm(
      `Delete category "${c.nameEn}"?\n\nIf it has sub-categories, you must delete/move them first (unless backend supports cascade).`
    );
    if (!yes) return;

    try {
      // ✅ Requires backend endpoint: DELETE /api/admin/categories/:id
      await apiFetch(`/api/admin/categories/${c.id}`, { method: "DELETE" });
      setOk(`Deleted: ${c.nameEn}`);
      await load();
    } catch (e: any) {
      setErr(e?.message ?? "Failed to delete category");
    }
  }

  function updateLocal(id: string, patch: Partial<Cat>) {
    setCats((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));
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

          {/* Parent select (for creation only) */}
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
          Sub-categories: choose a <b>Parent</b> above to create a sub-category.
        </div>
      </div>

      {/* Tree table */}
      <div className="rounded-3xl border border-white/10 bg-white/5 p-7 shadow-2xl backdrop-blur">
        <h2 className="text-xl font-extrabold text-white">All Categories</h2>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[1050px] text-sm text-white/80">
            <thead>
              <tr className="text-left text-xs text-white/50">
                <th className="py-2">Category</th>
                <th className="py-2">Slug</th>
                <th className="py-2">Name (EN)</th>
                <th className="py-2">Name (AR)</th>
                <th className="py-2">Default Min Bid (JOD)</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>

            <tbody>
              {tree.map((p) => {
                const open = !!expanded[p.id];
                return (
                  <FragmentRows
                    key={p.id}
                    parent={p}
                    open={open}
                    onToggle={() => toggleExpand(p.id)}
                    cats={cats}
                    onUpdate={updateLocal}
                    onSave={saveRow}
                    onDelete={deleteCategory}
                  />
                );
              })}

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
          Tip: Click a parent row to expand and view its sub-categories.
        </div>
      </div>
    </div>
  );
}

function FragmentRows({
  parent,
  open,
  onToggle,
  cats,
  onUpdate,
  onSave,
  onDelete,
}: {
  parent: CatNode;
  open: boolean;
  onToggle: () => void;
  cats: Cat[];
  onUpdate: (id: string, patch: Partial<Cat>) => void;
  onSave: (c: Cat) => void;
  onDelete: (c: Cat) => void;
}) {
  // find latest version from state (editable)
  const parentLive = cats.find((x) => x.id === parent.id) ?? parent;

  return (
    <>
      {/* Parent row */}
      <tr className="border-t border-white/10">
        <td className="py-3 pr-3">
          <button
            type="button"
            onClick={onToggle}
            className="flex items-center gap-2 rounded-xl px-2 py-1 text-left font-extrabold text-white hover:bg-white/10"
          >
            <span className="text-white/60">{open ? "▾" : "▸"}</span>
            <span>{parentLive.nameEn}</span>
            <span className="text-white/40">({parentLive.nameAr})</span>
          </button>
          <div className="mt-1 pl-7 text-xs text-white/50">Top-level</div>
        </td>

        <td className="py-3 pr-3">
          <input
            value={parentLive.slug}
            onChange={(e) => onUpdate(parentLive.id, { slug: e.target.value })}
            className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-[#FF7A1A]/30"
          />
        </td>

        <td className="py-3 pr-3">
          <input
            value={parentLive.nameEn}
            onChange={(e) => onUpdate(parentLive.id, { nameEn: e.target.value })}
            className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-[#FF7A1A]/30"
          />
        </td>

        <td className="py-3 pr-3">
          <input
            value={parentLive.nameAr}
            onChange={(e) => onUpdate(parentLive.id, { nameAr: e.target.value })}
            className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-[#FF7A1A]/30"
          />
        </td>

        <td className="py-3 pr-3">
          <input
            value={parentLive.defaultMinBid}
            onChange={(e) => onUpdate(parentLive.id, { defaultMinBid: e.target.value })}
            className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-[#FF7A1A]/30"
          />
        </td>

        <td className="py-3">
          <div className="flex gap-2">
            <button
              onClick={() => onSave(parentLive)}
              className="rounded-xl bg-[#FF7A1A] px-4 py-2 text-xs font-extrabold text-black hover:opacity-90"
            >
              Save
            </button>
            <button
              onClick={() => onDelete(parentLive)}
              className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs font-extrabold text-red-100 hover:bg-red-500/15"
            >
              Delete
            </button>
          </div>
        </td>
      </tr>

      {/* Children */}
      {open &&
        parent.children.map((ch) => {
          const chLive = cats.find((x) => x.id === ch.id) ?? ch;
          return (
            <tr key={chLive.id} className="border-t border-white/10">
              <td className="py-3 pr-3">
                <div className="pl-7">
                  <div className="text-sm font-semibold text-white/85">
                    — {chLive.nameEn} <span className="text-white/40">({chLive.nameAr})</span>
                  </div>
                  <div className="mt-1 text-xs text-white/50">
                    Parent: <span className="text-white/70">{parentLive.nameEn}</span>
                  </div>
                </div>
              </td>

              <td className="py-3 pr-3">
                <input
                  value={chLive.slug}
                  onChange={(e) => onUpdate(chLive.id, { slug: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-[#FF7A1A]/30"
                />
              </td>

              <td className="py-3 pr-3">
                <input
                  value={chLive.nameEn}
                  onChange={(e) => onUpdate(chLive.id, { nameEn: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-[#FF7A1A]/30"
                />
              </td>

              <td className="py-3 pr-3">
                <input
                  value={chLive.nameAr}
                  onChange={(e) => onUpdate(chLive.id, { nameAr: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-[#FF7A1A]/30"
                />
              </td>

              <td className="py-3 pr-3">
                <input
                  value={chLive.defaultMinBid}
                  onChange={(e) => onUpdate(chLive.id, { defaultMinBid: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-[#FF7A1A]/30"
                />
              </td>

              <td className="py-3">
                <div className="flex gap-2">
                  <button
                    onClick={() => onSave(chLive)}
                    className="rounded-xl bg-[#FF7A1A] px-4 py-2 text-xs font-extrabold text-black hover:opacity-90"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => onDelete(chLive)}
                    className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs font-extrabold text-red-100 hover:bg-red-500/15"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          );
        })}
    </>
  );
}
