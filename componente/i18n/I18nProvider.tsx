// i18n/I18nProvider.tsx
"use client";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { STRINGS, type Lang, type StringKey } from "./strings";

// Lokalisiertes Feld aus deinen Daten (Speisekarte etc.)
export type Localized = string | { de: string; en: string };

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: StringKey) => string;
  asText: (val: Localized | null | undefined) => string;
  formatPrice: (n: number) => string;
};

const I18nCtx = createContext<Ctx | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>("de");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem("lang");
    const initial: Lang = raw === "de" || raw === "en" ? (raw as Lang) : "de";
    setLang(initial);
    document.documentElement.lang = initial;
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("lang", lang);
    document.documentElement.lang = lang;
  }, [lang]);

  const t = (key: StringKey): string => {
    // STRINGS ist strikt typisiert → kein any nötig
    return STRINGS[lang][key] ?? (key as string);
  };

  const asText = (val: Localized | null | undefined): string => {
    if (val == null) return "";
    return typeof val === "string" ? val : val[lang] ?? "";
  };

  const formatPrice = (n: number) =>
    new Intl.NumberFormat(lang === "de" ? "de-DE" : "en-US", {
      style: "currency",
      currency: "EUR",
    }).format(n);

  const value = useMemo(
    () => ({ lang, setLang, t, asText, formatPrice }),
    [lang]
  );

  return <I18nCtx.Provider value={value}>{children}</I18nCtx.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nCtx);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
