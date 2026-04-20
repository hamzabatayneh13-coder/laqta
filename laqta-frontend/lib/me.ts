"use client";

import { apiFetch } from "./api";

export type MeUser = {
  id: string;
  email?: string;
  fullName?: string;
  role?: "ADMIN" | "SELLER" | "BUYER" | string;
};

const ME_KEY = "laqta_me";

export function getCachedMe(): MeUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(ME_KEY);
    return raw ? (JSON.parse(raw) as MeUser) : null;
  } catch {
    return null;
  }
}

export function setCachedMe(me: MeUser | null) {
  if (typeof window === "undefined") return;
  if (!me) sessionStorage.removeItem(ME_KEY);
  else sessionStorage.setItem(ME_KEY, JSON.stringify(me));
}

export async function refreshMe(): Promise<MeUser | null> {
  // If token missing, don't call server
  const token = sessionStorage.getItem("laqta_token");
  if (!token) {
    setCachedMe(null);
    return null;
  }

  try {
    const me = (await apiFetch("/api/auth/me")) as MeUser;
    setCachedMe(me);
    // notify header/nav to re-render
    window.dispatchEvent(new Event("laqta:me"));
    return me;
  } catch {
    // token invalid/expired → clear auth
    sessionStorage.removeItem("laqta_token");
    setCachedMe(null);
    window.dispatchEvent(new Event("laqta:auth"));
    window.dispatchEvent(new Event("laqta:me"));
    return null;
  }
}
