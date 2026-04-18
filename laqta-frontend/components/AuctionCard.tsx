import Link from "next/link";
import CountdownLastHour from "./CountdownLastHour";

type AuctionCardProps = {
  id: number | string;
  title: string;
  category?: string;
  location?: string;
  currentPrice: number;
  endsAt: string; // already formatted
  bidsCount?: number;
  badge?: "LIVE" | "ENDING_SOON" | "SCHEDULED";

  // ✅ add rawEndsAt so countdown can calculate remaining time
  // (pass this from live auctions page as the ISO date from API)
  rawEndsAt?: string;
};

export default function AuctionCard(props: AuctionCardProps) {
  const badge =
    props.badge === "ENDING_SOON"
      ? { text: "Ending soon", cls: "bg-[#FF7A1A]/15 text-[#FF7A1A] ring-[#FF7A1A]/25" }
      : props.badge === "SCHEDULED"
      ? { text: "Scheduled", cls: "bg-white/10 text-white/70 ring-white/15" }
      : { text: "LIVE", cls: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/25" };

  return (
    <Link
      href={`/a/${props.id}`}
      className="group block overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur transition hover:bg-white/7"
    >
      {/* Image placeholder */}
      <div className="relative h-56 bg-gradient-to-br from-white/10 to-white/0">
        <div className="absolute left-4 top-4">
          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-extrabold ring-1 ${badge.cls}`}>
            {badge.text}
          </span>
        </div>

        <div className="absolute bottom-4 left-4 right-4">
          <div className="text-sm text-white/70">{props.category ?? "Category"}</div>

          <div className="mt-1 text-lg font-extrabold text-white line-clamp-2">
            {props.title}
          </div>

          <div className="mt-1 text-sm text-white/60">
            {props.location ?? "Jordan"} • Ends: {props.endsAt}
          </div>

          {/* ✅ Countdown only in last hour */}
          {props.rawEndsAt && <CountdownLastHour endsAt={props.rawEndsAt} />}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-2 gap-3 p-5">
        <div>
          <div className="text-xs font-semibold text-white/60">Current Bid</div>
          <div className="mt-1 text-2xl font-extrabold text-white">
            {props.currentPrice.toLocaleString()}{" "}
            <span className="text-sm text-white/60">JOD</span>
          </div>
        </div>

        <div className="text-right">
          <div className="text-xs font-semibold text-white/60">Bids</div>
          <div className="mt-1 text-2xl font-extrabold text-white">
            {props.bidsCount ?? 0}
          </div>
          <div className="mt-2 inline-flex items-center justify-end gap-2 text-sm font-semibold text-[#FF7A1A]">
            View auction <span className="transition group-hover:translate-x-0.5">→</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
