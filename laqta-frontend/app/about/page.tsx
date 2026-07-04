// laqta-frontend/app/about/page.tsx
export const metadata = {
  title: "About Us | Laqta",
  description: "About Laqta.",
};

export default function AboutPage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10">
      <div className="rounded-3xl border border-white/10 bg-neutral-950/60 p-6 md:p-10">
        <h1 className="text-3xl font-semibold text-white">About Laqta</h1>
        <p className="mt-3 text-white/70">
          Laqta is a Jordan-focused marketplace built to make buying and selling
          through auctions simpler, faster, and more transparent.
        </p>

        <div className="prose prose-invert mt-8 max-w-none prose-p:text-white/80 prose-li:text-white/80 prose-strong:text-white prose-headings:text-white">
          <h2>Our Mission</h2>
          <p>
            Our mission is to help people and businesses discover great deals
            and sell items efficiently through a trusted auction experience.
          </p>

          <h2>What We Offer</h2>
          <ul>
            <li>Easy listing and browsing of auctions.</li>
            <li>Clear category structure to find what you need quickly.</li>
            <li>A fair bidding process designed for transparency.</li>
            <li>Continuous improvements based on user feedback.</li>
          </ul>

          <h2>Where We Operate</h2>
          <p>
            Laqta is currently focused on <strong>Jordan</strong>.
          </p>

          <h2>Contact</h2>
          <p>
            For support or inquiries, email us at{" "}
            <strong>laqtacompany@gmail.com</strong>.
          </p>
        </div>
      </div>
    </main>
  );
}
