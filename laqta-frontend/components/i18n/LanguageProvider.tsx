"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Lang = "en" | "ar";

type LangCtx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggleLang: () => void;
};

const Ctx = createContext<LangCtx | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const saved = (localStorage.getItem("laqta_lang") as Lang | null) ?? "en";
    setLang(saved);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem("laqta_lang", l);

    // update HTML direction + lang
    document.documentElement.lang = l;
    document.documentElement.dir = l === "ar" ? "rtl" : "ltr";
  };

  const toggleLang = () => setLang(lang === "en" ? "ar" : "en");

  const value = useMemo(() => ({ lang, setLang, toggleLang }), [lang]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLang() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useLang must be used within <LanguageProvider>");
  return v;
}
