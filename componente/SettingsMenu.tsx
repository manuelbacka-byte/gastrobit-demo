"use client";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "./i18n/I18nProvider";
import { DEFAULT_DARK, RESPECT_USER_CHOICE } from "../config/theme";

type Lang = "de" | "en";
type ThemeMode = "system" | "light" | "dark";

export default function SettingsMenu({ iconSrc = "/icons/settings.svg" }: { iconSrc?: string }) {
  const { lang, setLang, t } = useI18n();
  const [open, setOpen] = useState(false);

  // NEU: Theme-Mode + System-Pref
  const [mode, setMode] = useState<ThemeMode>("system");
  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(false);

  const btnRef = useRef<HTMLButtonElement | null>(null);
  const popRef = useRef<HTMLDivElement | null>(null);
  const mqlRef = useRef<MediaQueryList | null>(null);

  // Effektiv dunkel? (für UI-Toggle)
  const isDarkEffective = mode === "dark" || (mode === "system" && systemPrefersDark);

  // --- Init: Sprache + Theme (User-Wahl > System; System nur solange keine User-Wahl vorlag)
  useEffect(() => {
    // Sprache
    const savedLang = (typeof window !== "undefined" ? window.localStorage.getItem("lang") : null) as Lang | null;
    setLang(savedLang === "de" || savedLang === "en" ? savedLang : "de");

    // System-Dark beobachten (für UI)
    if (typeof window !== "undefined" && "matchMedia" in window) {
      mqlRef.current = window.matchMedia("(prefers-color-scheme: dark)");
      const update = () => setSystemPrefersDark(mqlRef.current!.matches);
      update();
      mqlRef.current.addEventListener("change", update);
      return () => mqlRef.current?.removeEventListener("change", update);
    } else {
      setSystemPrefersDark(DEFAULT_DARK); // Fallback
    }
  }, [setLang]);

  useEffect(() => {
    // Theme aus localStorage lesen
    if (typeof window === "undefined") return;

    let saved = RESPECT_USER_CHOICE ? (localStorage.getItem("theme") as ThemeMode | null) : null;

    // Validieren
    if (saved !== "light" && saved !== "dark" && saved !== "system") {
      saved = "system";
    }

    // Mode anwenden
    setMode(saved);

    const root = document.documentElement;
    if (saved === "light") root.setAttribute("data-theme", "light");
    else if (saved === "dark") root.setAttribute("data-theme", "dark");
    else root.removeAttribute("data-theme"); // system -> Media Query entscheidet
  }, []);

  // ESC schließt
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // --- WICHTIG: Toggle erzwingt IMMER das Gegenteil des aktuell wirksamen Zustands
  // (Auch wenn "dunkel" nur durch's System kommt, schalten wir auf erzwungen "hell")
  function toggleTheme() {
    const root = document.documentElement;

    // aktuell effektiv dunkel -> nächstes = FORCE LIGHT
    if (isDarkEffective) {
      setMode("light");
      root.setAttribute("data-theme", "light");
      if (RESPECT_USER_CHOICE) localStorage.setItem("theme", "light");
    } else {
      // aktuell effektiv hell -> nächstes = FORCE DARK
      setMode("dark");
      root.setAttribute("data-theme", "dark");
      if (RESPECT_USER_CHOICE) localStorage.setItem("theme", "dark");
    }
  }

  function setLanguage(l: Lang) {
    setLang(l);
    if (typeof window !== "undefined") {
      localStorage.setItem("lang", l);
      setOpen(false);
    }
  }

  return (
    <div className="relative">
      {/* Button rechts neben dem Namen */}
      <button
        ref={btnRef}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex items-center justify-center rounded-md border"
        style={{
          height: 30,
          width: 30,
          background: "var(--card)",
          borderColor: "var(--border)",
          color: "var(--text-primary)",
          marginBottom: 2,
        }}
        title={t("appearance")}
      >
        <span
          aria-hidden
          className="block"
          style={{
            width: 14,
            height: 14,
            backgroundColor: "var(--icon)",
            WebkitMask: `url(${iconSrc}) center / contain no-repeat`,
            mask: `url(${iconSrc}) center / contain no-repeat`,
          }}
        />
      </button>

      {open && <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />}

      {open && (
        <div
          ref={popRef}
          role="menu"
          className="absolute right-0 bottom-full mb-2 w-56 rounded-lg border p-3 shadow-lg z-50"
          style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--text-primary)" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Sprache */}
          <div className="mb-3">
            <div className="text-xs mb-1 opacity-70">{t("language")}</div>
            <div className="flex gap-2">
              <button
                onClick={() => setLanguage("de")}
                className={`flex-1 h-9 rounded-md border text-sm ${lang === "de" ? "font-semibold" : ""}`}
                style={{
                  background: lang === "de" ? "var(--accent)" : "var(--card)",
                  color: lang === "de" ? "#fff" : "var(--text-primary)",
                  borderColor: "var(--border)",
                }}
              >
                DE
              </button>
              <button
                onClick={() => setLanguage("en")}
                className={`flex-1 h-9 rounded-md border text-sm ${lang === "en" ? "font-semibold" : ""}`}
                style={{
                  background: lang === "en" ? "var(--accent)" : "var(--card)",
                  color: lang === "en" ? "#fff" : "var(--text-primary)",
                  borderColor: "var(--border)",
                }}
              >
                EN
              </button>
            </div>
          </div>

          {/* Dark Mode */}
          <div>
            <div className="text-xs mb-1 opacity-70">{t("appearance")}</div>
            <button
              onClick={toggleTheme}
              className="w-full h-9 rounded-md border flex items-center justify-between px-3 text-sm"
              style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--text-primary)" }}
            >
              <span>{t("darkMode")}</span>
              <span
                className={`inline-flex h-5 w-9 items-center rounded-full px-0.5 transition-all ${
                  isDarkEffective ? "[background:var(--accent)]" : "bg-gray-300"
                }`}
              >
                <span
                  className={`h-4 w-4 rounded-full bg-white transform transition-transform ${
                    isDarkEffective ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
