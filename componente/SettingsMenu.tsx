"use client";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "./i18n/I18nProvider";
import { DEFAULT_DARK, RESPECT_USER_CHOICE } from "../config/theme";

type Lang = "de" | "en";

export default function SettingsMenu({ iconSrc = "/icons/settings.svg" }: { iconSrc?: string }) {
  const { lang, setLang, t } = useI18n();
  const [open, setOpen] = useState(false);
  const [isDark, setIsDark] = useState<boolean>(DEFAULT_DARK);

  const btnRef = useRef<HTMLButtonElement | null>(null);
  const popRef = useRef<HTMLDivElement | null>(null);

  // Init: Sprache + Theme (User-Wahl > Default, wenn erlaubt)
  useEffect(() => {
    // Sprache aus localStorage (validiert), sonst "de"
    const savedLang = (typeof window !== "undefined" ? window.localStorage.getItem("lang") : null) as Lang | null;
    const validLang: Lang = savedLang === "de" || savedLang === "en" ? savedLang : "de";
    setLang(validLang);

    // Theme bestimmen
    let startDark: boolean = DEFAULT_DARK;
    if (RESPECT_USER_CHOICE && typeof window !== "undefined") {
      const savedTheme = window.localStorage.getItem("theme") as "dark" | "light" | null;
      if (savedTheme) startDark = savedTheme === "dark";
    }
    setIsDark(startDark);
    if (startDark) document.documentElement.setAttribute("data-theme", "dark");
    else document.documentElement.removeAttribute("data-theme");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ESC schließt
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function toggleTheme() {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.setAttribute("data-theme", "dark");
      if (RESPECT_USER_CHOICE && typeof window !== "undefined") localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
      if (RESPECT_USER_CHOICE && typeof window !== "undefined") localStorage.setItem("theme", "light");
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
        }}
        title={t("appearance")}
      >
        <span
          aria-hidden
          className="block"
          style={{
            width: 16,
            height: 16,
            backgroundColor: "var(--icon)",
            WebkitMask: `url(${iconSrc}) center / contain no-repeat`,
            mask: `url(${iconSrc}) center / contain no-repeat`,
          }}
        />
      </button>

      {/* Backdrop */}
      {open && <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />}

      {/* Popover */}
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
                  isDark ? "[background:var(--accent)]" : "bg-gray-300"
                }`}
              >
                <span
                  className={`h-4 w-4 rounded-full bg-white transform transition-transform ${
                    isDark ? "translate-x-4" : "translate-x-0"
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
