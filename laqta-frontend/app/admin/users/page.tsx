"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from "../../../lib/api";

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

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await apiFetch("/api/admin/users");
        setUsers(Array.isArray(data) ? data : []);
      } catch (e: any) {
        setErr(e?.message ?? "Failed to load users");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      u.fullName?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.phone?.includes(q);
    const matchRole = roleFilter === "ALL" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  if (loading) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white/80 shadow-2xl backdrop-blur">
        Loading users…
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
        <h1 className="mt-2 text-3xl font-extrabold text-white">Users</h1>
        <p className="mt-2 text-sm text-white/60">
          {users.length} total users
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none"
          placeholder="Search name / email / phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="rounded-2xl border border-white/10 bg-[#0d1117] px-4 py-3 text-sm text-white outline-none"
          style={{ backgroundColor: "#0d1117", color: "white" }}
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option style={{ backgroundColor: "#0d1117" }} value="ALL">All Roles</option>
          <option style={{ backgroundColor: "#0d1117" }} value="BUYER">Buyers</option>
          <option style={{ backgroundColor: "#0d1117" }} value="SELLER">Sellers</option>
          <option style={{ backgroundColor: "#0d1117" }} value="ADMIN">Admins</option>
        </select>
      </div>

      {/* Users table */}
      <div className="space-y-3">
        {filtered.map((u) => (
          <Link
            key={u.id}
            href={`/admin/users/${u.id}`}
            className="block rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur hover:bg-white/7 transition"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="font-extrabold text-white">{u.fullName}</div>
                <div className="mt-1 text-sm text-white/60">
                  {u.email ?? "—"} • {u.phone ?? "—"}
                </div>
                <div className="mt-1 text-xs text-white/40">
                  Joined: {new Date(u.createdAt).toLocaleDateString()} •{" "}
                  {u.totalBids} bids
                </div>
              </div>
              <RoleBadge role={u.role} />
            </div>
          </Link>
        ))}

        {filtered.length === 0 && (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white/70 shadow-2xl backdrop-blur">
            No users found.
          </div>
        )}
      </div>
    </div>
  );
}
