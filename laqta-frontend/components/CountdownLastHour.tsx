"use client";

import { useEffect, useMemo, useState } from "react";

function format(ms: number) {
  if (ms <= 0) return "Ended";
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}m ${sec}s`;
}

export default function CountdownLastHour({
  endsAt,
  label = "Ends in",
}: {
  endsAt: string | Date;
  label?: string;
}) {
  const end = useMemo(() => new Date(endsAt).getTime(), [endsAt]);
  const [now, setNow] = useState(Date.now());

  const remaining = end - now;

  useEffect(() => {
    // If not in last hour, update slowly (every 30s). In last hour, update every 1s.
    const interval = remaining <= 60 * 60 * 1000 ? 1000 : 30000;
    const t = setInterval(() => setNow(Date.now()), interval);
    return () => clearInterval(t);
  }, [remaining]);

  // ✅ Only show in last hour
  if (remaining > 60 * 60 * 1000) return null;

  return (
    <div className="mt-1 text-sm text-white/60">
      {label}:{" "}
      <span className="font-semibold text-white/80">{format(remaining)}</span>
    </div>
  );
}
