"use client";

import { useLang } from "./LanguageProvider";

export default function LanguageToggle() {
  const { lang, toggleLang } = useLang();

  return (
    <button
      type="button"
      onClick={toggleLang}
      className="ml-3 rounded-md border border-white/15 bg-white/5 px-3 py-1 text-sm hover:bg-white/10"
      aria-label="Toggle language"
      title="Toggle language"
    >
      {lang === "en" ? "AR" : "EN"}
    </button>
  );
}
