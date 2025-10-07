"use client";
import { useEffect, useRef } from "react";
import type { Dish } from "./MenuView";
import { BADGE_META } from "./badges/meta"; 
import { useI18n } from "./i18n/I18nProvider";

type Props = {
  dish: Dish | null;
  open: boolean;
  onClose: () => void;
};

const ICON_SIZE = 18; // icons
type Localized = string | { de: string; en: string };

// Allergene
const ALLERGEN_META: Record<string, { label: Localized; src: string }> = {
  laktose: { label: { de: "Laktose", en: "Lactose" }, src: "/icons/laktose.svg" },
  gluten:  { label: { de: "Gluten",  en: "Gluten" },  src: "/icons/gluten.svg" },
  eier:    { label: { de: "Eier",    en: "Eggs" },    src: "/icons/eier.svg" },
  nuesse:  { label: { de: "Nüsse",   en: "Nuts" },    src: "/icons/nuesse.svg" },
  soja:    { label: { de: "Soja",    en: "Soy" },     src: "/icons/soja.svg" },
};

// Eigene Infos
const INFO_META: Record<string, { label: Localized; src: string }> = {
  schwein:     { label: { de: "Schweinefleisch", en: "Pork" },           src: "/icons/schwein.svg" },
  rind:        { label: { de: "Rindfleisch",     en: "Beef" },           src: "/icons/rind.svg" },
  huhn:        { label: { de: "Huhn",            en: "Chicken" },        src: "/icons/huhn.svg" },
  fisch:       { label: { de: "Fisch",           en: "Fish" },           src: "/icons/fisch.svg" },
  Krebs:       { label: { de: "Krebstiere",      en: "Crustaceans" },    src: "/icons/krebs.svg" },
  alkoholfrei: { label: { de: "Alkoholfrei",     en: "Alcohol-free" },   src: "/icons/alkoholfrei.svg" },
  alkohol:     { label: { de: "Alkohol",         en: "Alcohol" },        src: "/icons/alkohol.svg" },
  scharf:      { label: { de: "Scharf",          en: "Spicy" },          src: "/icons/scharf.svg" },
  vegan:       { label: { de: "Vegan möglich",   en: "Vegan possible" }, src: "/icons/vegan.svg" },
  vegetarisch: { label: { de: "Vegetarisch möglich", en: "Vegetarian possible" }, src: "/icons/vegetarisch.svg" },
  halal:       { label: { de: "Halal",           en: "Halal" },          src: "/icons/halal.svg" },
  laktose: { label: { de: "Laktose", en: "Lactose" }, src: "/icons/laktose.svg" },
  laktosefrei: { label: { de: "Laktosefrei", en: "Lactose-free" }, src: "/icons/laktosefrei.svg" },
};


function LineItem({
  iconSrc,
  label,
  size = ICON_SIZE,
}: {
  iconSrc?: string;
  label: string;
  size?: number;
}) {
  return (
    <div className="flex items-center gap-3 py-1.5">
      {iconSrc ? (
        <span
          aria-hidden
          className="inline-block shrink-0"
          style={{
            width: size,
            height: size,
            backgroundColor: "var(--icon)", // globale Icon-Farbe
            WebkitMask: `url(${iconSrc}) center / contain no-repeat`,
            mask: `url(${iconSrc}) center / contain no-repeat`,
          }}
        />
      ) : (
        <span
          className="inline-block shrink-0"
          style={{ width: size, height: size }}
        />
      )}
      <span className="text-sm text-[var(--text-primary)]">{label}</span>
    </div>
  );
}



export default function DishSheet({ dish, open, onClose }: Props) {
  const { t , asText, formatPrice } = useI18n();
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  // ESC schließt das Sheet
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  
useEffect(() => {
  if (!open) return;
  // kurz warten bis das Panel im DOM ist, dann top setzen
  requestAnimationFrame(() => {
    contentRef.current?.scrollTo({ top: 0, behavior: "auto" });
  });
}, [open, dish]);

useEffect(() => {
  if (!open) return;

  const scrollY = window.scrollY;

  // Body fixieren OHNE dass er nach oben springt
  document.body.style.overflow = "hidden"; // verhindert Scrollen
  document.body.style.position = "relative"; // kein fixed, kein Jump
  document.body.setAttribute("data-sheet-open", "true");

  return () => {
    document.body.style.overflow = "";
    document.body.style.position = "";
    document.body.removeAttribute("data-sheet-open");

    // sicherstellen, dass die Scroll-Pos bleibt
    window.scrollTo({ top: scrollY, behavior: "auto" });
  };
}, [open]);


  if (!dish) return null;
  
  // Animation-Klassen (weich von unten)
  const sheetCls = [
    "fixed inset-x-0 bottom-0 z-[60] bg-[var(--card-bg)] rounded-t-2xl shadow-xl",
    "will-change-transform transition-transform duration-300 ease-out",
    open ? "translate-y-0" : "translate-y-full",
  ].join(" ");

  const overlayCls = [
    "fixed inset-0 z-50 bg-black/40 transition-opacity duration-300",
    open ? "opacity-100" : "opacity-0 pointer-events-none",
  ].join(" ");

// Badges → Textzeilen mit Icon (aus BADGE_META)
const infoLinesFromBadges =
  (dish.badges ?? [])
    .map((b) => b.toLowerCase().trim())
    .map((key) => {
      const meta = BADGE_META[key];
      if (!meta) return null;
      return { label: asText(meta.label), src: meta.src };
    })
    .filter(Boolean) as { label: string; src: string }[];

//Info-Zeilen
const infoLinesCustom =
  (dish.info ?? [])
    .map((k) => k.toLowerCase().trim())
    .map((key) => {
      const meta = INFO_META[key];
      if (!meta) return null;
      return { label: asText(meta.label), src: meta.src};
    })
    .filter(Boolean) as { label: string; src: string }[];

  const merged = [...infoLinesFromBadges, ...infoLinesCustom];
  const seen = new Set<string>();
  const infoLines = merged.filter((it) => {
    const key = it.label.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Allergene → Textzeilen mit eigenem Icon-Mapping
  const allergenLines =
    (dish.allergene ?? [])
      .map((a) => a.toLowerCase().trim())
      .map((key) => {
        const meta = ALLERGEN_META[key];
        if (!meta) return null;
        return { label:  asText(meta.label), src: meta.src };

      })
      .filter(Boolean) as { label: string; src: string }[];

  return (
    <>
      {/* Overlay */}
      <div
        ref={overlayRef}
        className={overlayCls}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        className={sheetCls}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Griff */}
        <div className="flex justify-center pt-3">
          <div className="h-1.5 w-10 rounded-full bg-[var(--border)]" />
        </div>

    <main
        ref={contentRef}
        className="max-w-screen-md mx-auto px-5 pb-8 pt-4 max-h-[65vh] overflow-y-auto font-sans antialiased tracking-normal"
    style={{ WebkitOverflowScrolling: "touch" }}
    >
          {/* Kopf: Name + Preis */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">{asText(dish.name)}</h3>
              {dish.Kalorien ? (
                <p className="text-sm text-[var(--text-secondary)]">{dish.Kalorien} kcal</p>
              ) : null}
            </div>
            <div className="text-base font-semibold text-[var(--text-primary)] tabular-nums">
              {formatPrice(dish.price)}
            </div>
          </div>

          {/* Beschreibung (voll) */}
          {dish.description && (
            <p className="mt-4 text-[15px] leading-6  break-words hyphens-auto text-[var(--text-secondary)]">
              {asText(dish.description)}
            </p>
          )}


          {infoLines.length > 0 && (
            <div className="mt-4">
                <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-2">{t("information")}</h4>
                <div className="space-y-1.5">
                {infoLines.map((it, i) => (
                    <LineItem key={`${it.label}-${i}`} iconSrc={it.src} label={it.label} size={ICON_SIZE} />
                ))}
                </div>
            </div>
            )}


             {/* Extras (nur Liste, kein Tap) */}
          {dish.extras && dish.extras.length > 0 && (
            <div className="mt-4">
                <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-2">{t("extras")}</h4>
                <div className="divide-y divide-[var(--border)]">
                {dish.extras.map((ex, i) => (
                    <div
                    key={`${ex.label}-${i}`}
                    className="flex items-center justify-between py-2"
                    >
                    <div className="flex items-center">
                        <span className="inline-block w-1 h-1" />
                        <span className="text-sm text-[var(--text-primary)]">{asText(ex.label)}</span>
                    </div>
                    <span className="text-sm font-medium text-[var(--text-primary)] tabular-nums">
                        {formatPrice(ex.price)}
                    </span>
                    </div>
                ))}
                </div>

            </div>
            )}

            {allergenLines.length > 0 && (
            <div className="mt-4">
                <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-2">{t("allergens")}</h4>
                <div className="space-y-1.5">
                {allergenLines.map((it, i) => (
                    <LineItem key={`${it.label}-${i}`} iconSrc={it.src} label={it.label} size={ICON_SIZE} />
                ))}
                </div>
            </div>
            )}


          {/* Schließen */}
          <div className="mt-4">
            <button
              onClick={onClose}
              className="w-full h-11 rounded-xl bg-[var(--accent)] text-white font-medium active:opacity-80"
            >
              {t("close")}
            </button>
          </div>
        </main>
      </div>
    </>
  );
}
