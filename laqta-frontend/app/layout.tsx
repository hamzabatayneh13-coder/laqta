import "./globals.css";

import SiteHeader from "../components/SiteHeader";
import { ToastContainer } from "../components/Toast";
import OutbidListener from "../components/OutbidListener";

// ✅ add this import
import { LanguageProvider } from "../components/i18n/LanguageProvider";

export const metadata = {
  title: "Laqta (لقطة)",
  description: "Jordan Auction Hub",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen text-white">
        {/* Slide-like background */}
        <div className="fixed inset-0 -z-10 bg-[#070B14]">
          {/* soft glow (right side warm/orange) */}
          <div className="absolute inset-0 bg-[radial-gradient(900px_circle_at_78%_38%,rgba(255,122,26,0.18),transparent_55%)]" />
          {/* soft glow (top-left cool/blue) */}
          <div className="absolute inset-0 bg-[radial-gradient(900px_circle_at_20%_10%,rgba(64,130,255,0.18),transparent_55%)]" />
          {/* vignette */}
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(2,6,23,0.85),rgba(2,6,23,0.55),rgba(2,6,23,0.85))]" />
        </div>

        {/* ✅ Wrap the whole app so any component can read the selected language */}
        <LanguageProvider>
          <SiteHeader />

          <main className="mx-auto max-w-6xl px-6 py-14">{children}</main>

          <OutbidListener />
          <ToastContainer />
        </LanguageProvider>
      </body>
    </html>
  );
}
