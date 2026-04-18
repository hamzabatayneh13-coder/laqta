"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import HideWhenLoggedIn from "../components/HideWhenLoggedIn";


export default function HomePage() {
  const [journeyTab, setJourneyTab] = useState<"buyer" | "seller">("buyer");

  const buyerSteps = useMemo(
    () => ["Browse", "Bid", "Win", "Pay (COD/Escrow)", "Receive"],
    []
  );
  const sellerSteps = useMemo(
    () => ["Register", "KYC", "List", "Auction", "Deliver", "Get Paid"],
    []
  );

  return (
    <div className="space-y-16">
      {/* 1) HERO (Slide 1 content) */}
      <section className="pt-2">
        <div className="max-w-4xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#FF7A1A]/15 px-4 py-2 text-sm font-semibold text-[#FF7A1A] ring-1 ring-[#FF7A1A]/25">
            <span className="h-1.5 w-1.5 rounded-full bg-[#FF7A1A]" />
            Live Auction Platform
          </div>

          <h1 className="mt-8 text-6xl font-light tracking-tight text-white md:text-7xl">
            Laqta (لقطة)
            <br />
            <span className="font-normal text-[#FF7A1A]">Jordan Auction Hub</span>
          </h1>

          <p className="mt-5 text-xl text-white/70">
            Jordan's all-in-one live auction platform
            <br />
            <span className="font-semibold text-[#FF7A1A]">B2B</span>
            <span className="mx-3 text-white/30">•</span>
            <span className="font-semibold text-[#FF7A1A]">B2C</span>
            <span className="mx-3 text-white/30">•</span>
            <span className="font-semibold text-[#FF7A1A]">C2C</span>
            <span className="mx-3 text-white/30">•</span>
            <span className="font-semibold text-[#FF7A1A]">C2B</span>
          </p>

          {/* CTAs (Browse Live Auctions / Start Selling) */}
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/auctions/live"
              className="rounded-2xl bg-[#FF7A1A] px-5 py-3 text-sm font-extrabold text-black hover:brightness-110"
            >
              Browse Live Auctions
            </Link>
            <Link
                href="/seller/onboarding"
                className="rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-extrabold text-white hover:bg-white/10"
              >
                Start Selling
              </Link>
          </div>

          {/* Live stats strip (dummy initially) */}
          <div className="mt-10 grid grid-cols-1 gap-5 border-t border-white/10 pt-10 sm:grid-cols-3">
            <MiniStat value="24" label="Live now" note="Auctions currently running" />
            <MiniStat value="11" label="Ending soon" note="Closing in the next 60 min" />
            <MiniStat value="128" label="Verified sellers" note="KYC approved sellers" />
          </div>
        </div>
      </section>

      {/* 2) What we measure (Slide 3 content) */}
      <section className="grid gap-6 lg:grid-cols-1">

        <div className="rounded-3xl border border-white/10 bg-white/5 p-7 shadow-2xl backdrop-blur">
          <div className="text-sm font-extrabold text-white/70">What we measure</div>
          <h3 className="mt-2 text-2xl font-extrabold text-white">Simple metrics panel</h3>
          <p className="mt-3 text-white/65">
            Keep it short and operational: activity, conversion, and trust signals.
          </p>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <Metric value="Live bids/min" label="Bidding velocity" />
            <Metric value="Win rate" label="Bid → win conversion" />
            <Metric value="KYC pass%" label="Seller verification" />
            <Metric value="Dispute rate" label="Trust health" />
          </div>
        </div>
      </section>

      {/* 3) HOW IT WORKS (Buyer + Seller Journey) */}
      <section>
        <div>
          <div className="text-sm font-extrabold text-white/70">How it works</div>
          <h2 className="mt-2 text-3xl font-extrabold text-white">
            Buyer + Seller Journey
          </h2>
        </div>

        {/* Tabs */}
        <div className="mt-6 inline-flex rounded-2xl border border-white/10 bg-white/5 p-1 backdrop-blur">
          <button
            onClick={() => setJourneyTab("buyer")}
            className={[
              "rounded-xl px-4 py-2 text-sm font-extrabold transition",
              journeyTab === "buyer"
                ? "bg-[#FF7A1A] text-black"
                : "text-white/80 hover:bg-white/10",
            ].join(" ")}
          >
            Buyer
          </button>
          <button
            onClick={() => setJourneyTab("seller")}
            className={[
              "rounded-xl px-4 py-2 text-sm font-extrabold transition",
              journeyTab === "seller"
                ? "bg-[#FF7A1A] text-black"
                : "text-white/80 hover:bg-white/10",
            ].join(" ")}
          >
            Seller
          </button>
        </div>

        {/* Steps */}
        <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-7 shadow-2xl backdrop-blur">
          <div className="text-sm font-extrabold text-white/70">
            {journeyTab === "buyer"
              ? "Browse → Bid → Win → Pay (COD/Escrow) → Receive"
              : "Register → KYC → List → Auction → Deliver → Get Paid"}
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            {(journeyTab === "buyer" ? buyerSteps : sellerSteps).map((s, idx) => (
              <div
                key={s}
                className="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 text-sm font-extrabold text-white">
                  {idx + 1}
                </div>
                <div className="text-sm font-semibold text-white/85">{s}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4) CATEGORIES (from categories slide) */}
      <section>
        <div>
          <div className="text-sm font-extrabold text-white/70">Categories</div>
          <h2 className="mt-2 text-3xl font-extrabold text-white">Browse by category</h2>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <CategoryCard title="Scrap" desc="Metal, industrial scrap, bulk lots" />
          <CategoryCard title="Vehicles" desc="Cars, pickup, fleet, salvage" />
          <CategoryCard title="Machinery" desc="Construction, tools, heavy equipment" />
          <CategoryCard title="Electronics" desc="Phones, laptops, appliances" />
          <CategoryCard title="Real Estate" desc="Land, shops, warehouses" />
          <CategoryCard title="Collectibles" desc="Watches, antiques, rare items" />
        </div>
      </section>

      {/* 5) KEY FEATURES (Slide 5 content) */}
      <section>
        <div>
          <div className="text-sm font-extrabold text-white/70">Key features</div>
          <h2 className="mt-2 text-3xl font-extrabold text-white">
            Built for real auctions (not classifieds)
          </h2>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <GlassCard title="Live bidding" desc="Real-time bid updates with Socket.IO." />
          <GlassCard title="Countdowns" desc="Clear auction timers + ending-soon emphasis." />
          <GlassCard title="Verification" desc="Seller KYC + admin moderation queues." />
          <GlassCard title="Trust + notifications" desc="Badges, alerts, and dispute workflow." />
        </div>
      </section>

      {/* 8) FINAL CTA + FOOTER */}
      <HideWhenLoggedIn>
        <section className="rounded-3xl border border-white/10 bg-gradient-to-r from-white/5 to-white/0 p-7 shadow-2xl backdrop-blur">
          <h2 className="text-3xl font-extrabold text-white">Ready to start?</h2>
          <p className="mt-2 max-w-2xl text-white/70">
            Browse auctions, bid live, or start selling with a verified profile.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/seller/onboarding"
              className="rounded-2xl bg-[#FF7A1A] px-5 py-3 text-sm font-extrabold text-black hover:brightness-110"
            >
              Start Selling
            </Link>
            <Link
              href="/auctions/live"
              className="rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-extrabold text-white hover:bg-white/10"
            >
              Browse Auctions
            </Link>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6 text-sm text-white/60">
            <div>© {new Date().getFullYear()} Laqta (لقطة)</div>
            <div className="flex gap-4">
              <Link className="hover:text-[#FF7A1A]" href="/terms">Terms</Link>
              <Link className="hover:text-[#FF7A1A]" href="/privacy">Privacy</Link>
              <Link className="hover:text-[#FF7A1A]" href="/support">Support</Link>
            </div>
          </div>
        </section>
      </HideWhenLoggedIn>
    </div>
  );
}

/* ---------- Small UI helpers ---------- */

function MiniStat({ value, label, note }: { value: string; label: string; note: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur">
      <div className="text-4xl font-extrabold text-white">{value}</div>
      <div className="mt-1 text-sm font-extrabold text-white/80">{label}</div>
      <div className="mt-1 text-sm text-white/55">{note}</div>
    </div>
  );
}

function GlassCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
      <div className="text-lg font-extrabold text-white">{title}</div>
      <div className="mt-2 text-sm text-white/65">{desc}</div>
    </div>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="text-2xl font-extrabold text-white">{value}</div>
      <div className="mt-1 text-xs font-semibold text-white/60">{label}</div>
    </div>
  );
}

function CategoryCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="group rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur transition hover:bg-white/7">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-lg font-extrabold text-white">{title}</div>
          <div className="mt-2 text-sm text-white/65">{desc}</div>
        </div>
        <div className="text-[#FF7A1A] opacity-80 transition group-hover:translate-x-0.5">
          →
        </div>
      </div>
    </div>
  );
}
