"use client";

import { useEffect, useState } from "react";

function readToken() {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem("laqta_token"); // ✅ per-tab
}

/**
 * Renders children ONLY when user is NOT logged in.
 * (So it hides CTAs when logged in.)
 */
export default function HideWhenLoggedIn({
  children,
}: {
  children: React.ReactNode;
}) {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const sync = () => setToken(readToken());
    sync();

    // same-tab auth updates (login/logout)
    window.addEventListener("laqta:auth", sync);

    return () => {
      window.removeEventListener("laqta:auth", sync);
    };
  }, []);

  // If logged in -> hide children
  if (token) return null;

  return <>{children}</>;
}
