
"use client";
import { useEffect, useRef, useState } from "react";
import BadgesRow from "./badges/BadgesRow";
import Image from "next/image";
import DishSheet from "./DishSheet";
import { BADGE_META } from "./badges/meta";
import SettingsMenu from "./SettingsMenu";
import { useI18n } from "./i18n/I18nProvider";
import BackToTopButton from "./BackToTopButton";
import { Bebas_Neue } from "next/font/google";

const bebas = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});


type Localized = string | { de: string; en: string };

// ---- Typen ----
export type Dish = {
  code?: string;
  name: Localized;
  price: number;
  description?: Localized;
  badges?: string[];          // z.B. ["vegan","halal"]
  allergene?: string[];       // z.B. ["milch","gluten","eier"]
  extras?: { label: Localized; price: number }[]; // z.B. [{label:"Extra Käse", price:2}]
  Kalorien?: number;          // optional
  info?: string[];
  popular?: boolean; 
};
export type Category = { id: string; label: Localized; items: Dish[]; icon?: string };
export type Section = { id: string; label: Localized; categories: Category[] };
export type MenuData = { name: Localized; sections: Section[] };
const STICKY_HEIGHT = 56;
const CODE_BADGE_ROW_H = 24;
const BADGE_SIZE = 16;
const BADGE_GAP = 6;

function getCategoryIcon(iconKey?: string) {
  if (!iconKey) return null;
  const key = iconKey.toLowerCase().trim();
  return BADGE_META[key] ?? { label: iconKey, src: `/icons/${key}.svg` };
}
function PopularPill({ label }: { label: string }) {
  return (
    <span
      className="
        inline-flex items-center justify-center align-middle
        h-5 px-2 rounded-md         
        text-[10px] font-semibold leading-none tracking-wide
      "
      style={{ background: "var(--accent)", color: "#fff" }}
    >
      {label}
    </span>
  );
}

export default function MenuView({ menu }: { menu: MenuData }) {
  const { asText, formatPrice,t } = useI18n();
  const section = menu?.sections?.[0];
  const categories = section?.categories ?? [];
  const ids = categories.map((c) => c.id);
  const firstId = ids[0] ?? "";
  const lastId = ids[ids.length - 1] ?? "";

  const [activeCatId, setActiveCatId] = useState<string>(firstId);
  const allowAutoHighlight = useRef<boolean>(true);

  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);
  const [isSheetOpen, setSheetOpen] = useState(false);
  const openDishSheet = (d: Dish) => {
  // stop any pending auto-unlock from the tab smooth-scroll
  if (unlockRef.current) {
    window.removeEventListener("scrollend", unlockRef.current);
    unlockRef.current = null;
  }
  if (unlockTimerRef.current !== null) {
    clearTimeout(unlockTimerRef.current);
    unlockTimerRef.current = null;
  }

  allowAutoHighlight.current = false; // hard stop while the sheet is open
  setSelectedDish(d);
  setSheetOpen(true);
};

const unlockRef = useRef<(() => void) | null>(null);
const unlockTimerRef = useRef<number | null>(null);

const closeDishSheet = () => {
  setSheetOpen(false);
  setTimeout(() => {
    allowAutoHighlight.current = true;
    updateActiveByScroll();
    if (!allowAutoHighlight.current || ids.length === 0 || isSheetOpen) return;  
    setSelectedDish(null);
  }, 320); // matches your animation
};

  // ---- Refs ----
  const tabsContainerRef = useRef<HTMLDivElement | null>(null);
  const tabBtnRefs = useRef<Record<string, HTMLButtonElement | null>>(
    {} as Record<string, HTMLButtonElement | null>
  );
  const sectionRefs = useRef<Record<string, HTMLElement | null>>(
    {} as Record<string, HTMLElement | null>
  );

  // Tabs zentrieren
const centerActiveTab = (id: string) => {
  const container = tabsContainerRef.current;
  const btn = tabBtnRefs.current[id];
  if (!container || !btn) return;

  // gewünschte Ziel-Position
  const target =
    btn.offsetLeft + btn.offsetWidth / 2 - container.clientWidth / 2;

  // zwischen 0 und max klemmen
  const max = Math.max(0, container.scrollWidth - container.clientWidth);
  const next = Math.max(0, Math.min(max, target));

  container.scrollTo({ left: next, behavior: "smooth" });
};


  function goToCategory(catId: string) {
  setActiveCatId(catId);
  allowAutoHighlight.current = false;

  const el = sectionRefs.current[catId];
  if (el) {
    const y = el.getBoundingClientRect().top + window.scrollY - STICKY_HEIGHT - 6;
    window.scrollTo({ top: y, behavior: "smooth" });
  }

  centerActiveTab(catId);

  // evtl. alte Unlock-Handler/Tmrs aufräumen
  if (unlockRef.current) {
    window.removeEventListener("scrollend", unlockRef.current);
    unlockRef.current = null;
  }
  if (unlockTimerRef.current !== null) {
    clearTimeout(unlockTimerRef.current);
    unlockTimerRef.current = null;
  }

  // neuer Unlock (nach Smooth-Scroll)
  const unlock = () => {
    allowAutoHighlight.current = true;
    if (unlockRef.current) {
      window.removeEventListener("scrollend", unlockRef.current);
      unlockRef.current = null;
    }
    if (unlockTimerRef.current !== null) {
      clearTimeout(unlockTimerRef.current);
      unlockTimerRef.current = null;
    }
  };

  unlockRef.current = unlock;
  window.addEventListener("scrollend", unlock);

  // Fallback, falls Browser kein 'scrollend' feuert:
  unlockTimerRef.current = window.setTimeout(unlock, 650);
}

  // Sichtbarkeits-Messung
  const updateActiveByScroll = () => {
    if (!allowAutoHighlight.current || ids.length === 0 || isSheetOpen) return;

    const docH = document.documentElement.scrollHeight;
    const winH = window.innerHeight;
    const y = window.scrollY;

    // Top-Guard
    const firstEl = sectionRefs.current[firstId];
    if (firstEl) {
      const firstAbsTop = firstEl.getBoundingClientRect().top + y;
      const topThreshold = firstAbsTop - (STICKY_HEIGHT + 6);
      if (y <= topThreshold + 1) {
        if (activeCatId !== firstId) {
          setActiveCatId(firstId);
          centerActiveTab(firstId);
        }
        return;
      }
    }

    // Bottom-Guard
    if (y + winH >= docH - 1) {
      if (activeCatId !== lastId) {
        setActiveCatId(lastId);
        centerActiveTab(lastId);
      }
      return;
    }

    // Normalfall
    const viewportTop = STICKY_HEIGHT + 6;
    const viewportBottom = winH;

    let bestId = ids[0];
    let bestScore = -1;

    for (const id of ids) {
      const el = sectionRefs.current[id];
      if (!el) continue;
      const r = el.getBoundingClientRect();

      const visibleHeight = Math.max(
        0,
        Math.min(r.bottom, viewportBottom) - Math.max(r.top, viewportTop)
      );
      const tieBreaker = -Math.abs(r.top - viewportTop) / 1000;
      const score = visibleHeight + tieBreaker;

      if (score > bestScore) {
        bestScore = score;
        bestId = id;
      }
    }

    if (bestId && bestId !== activeCatId) {
      setActiveCatId(bestId);
      centerActiveTab(bestId);
    }
  };

  // Scroll/Resize-Listener
  useEffect(() => {
    const onScroll = () => updateActiveByScroll();
    const onResize = () => updateActiveByScroll();

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    setTimeout(updateActiveByScroll, 0);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids.join("|"), activeCatId]);

  // Tabs mitschieben
  useEffect(() => {
    if (activeCatId) centerActiveTab(activeCatId);
  }, [activeCatId]);

  if (!section || categories.length === 0) {
    return (
      <div className="max-w-screen-md mx-auto p-5">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>
            {asText(menu?.name ?? "")}
          </h1>
          <SettingsMenu iconSrc="/icons/settings.svg" />
        </div>
        <p className="text-sm text-[var(--text-secondary)]">
          Keine Kategorien vorhanden.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[var(--background)]">
      <main className="max-w-screen-md mx-auto font-sans antialiased tracking-normal">

        {/* Hero */}
            <div className="w-full overflow-hidden rounded-md bg-[var(--card-bg)]">
              <div className="relative w-full h-[210px]">
                <Image
                  src="/hero.png"
                  alt={asText(menu.name)}
                  fill
                  priority
                  className="object-cover object-[center_39%]"
                  sizes="(max-width: 768px) 100vw, 720px"
                />
              </div>
            </div>

              {/* Kopf: Name + Settings rechts */}
              <div className="mt-4 mb-2 flex items-center justify-between">
                <h1
                  className={`${bebas.className} text-3xl font-normal`}
                  style={{ color: "var(--text-primary)" }}
                >
                  {asText(menu.name)}
                </h1>
                <SettingsMenu iconSrc="/icons/settings.svg" />
              </div>

        {/* Sticky Tabs */}
        <div className="sticky top-0 z-50 bg-[var(--card-bg)]">
          <div className="flex items-center border-[var(--border)] py-2">
            <div
              ref={tabsContainerRef}
              className="flex gap-2 overflow-x-auto no-scrollbar w-full"
            >
              {categories.map((c) => {
                const active = c.id === activeCatId;
                return (
                  <button
                    key={c.id}
                    ref={(el: HTMLButtonElement | null) => {
                      tabBtnRefs.current[c.id] = el;
                    }}
                    onClick={() => goToCategory(c.id)}
                    className={[
                      "flex items-center justify-center",
                      "h-10 px-4 rounded-full border text-sm leading-none",
                      "whitespace-nowrap transition-colors",
                      active
                        ? "bg-[var(--accent)] text-white border-[var(--accent)]"
                        : "bg-[var(--card-bg)] text-[var(--text-primary)] border-[var(--border)]"
                    ].join(" ")}
                  >
                    {asText(c.label)}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
            
        {/* Kategorien */}
        {categories.map((cat) => (

          <section
            key={cat.id}
            id={`cat-${cat.id}`}
            ref={(el: HTMLElement | null) => {
              sectionRefs.current[cat.id] = el;
            }}
            className="mb-12 scroll-mt-24"
          >
              <h2 className="flex items-center gap-2 text-xl leading-7 font-bold text-[var(--text-primary)] mt-2 mb-3">
                <span>{asText(cat.label)}</span>
                {(() => {
                  const meta = getCategoryIcon(cat.icon);
                  return meta ? (
                    <span
                      aria-hidden
                      className="inline-block shrink-0 relative"
                      style={{
                        width: 18,
                        height: 18,
                        backgroundColor: "var(--icon)",
                        WebkitMask: `url(${meta.src}) center / contain no-repeat`,
                        mask: `url(${meta.src}) center / contain no-repeat`,
                      }}
                      title={asText(meta.label)}
                    />
                  ) : null;
                })()}
              </h2>


            <ul>
              {cat.items.map((item) => (
                <li
                  key={item.code ?? `${asText(item.name)}-${item.price}`} 
                  onClick={() => openDishSheet(item)}
                  className={`pb-4 border-b-2 border-[var(--border)] ${item.code ? "mb-2" : "mb-2"} cursor-pointer active:opacity-70`}
                >
                  {(() => {
                    const hasBadges = Array.isArray(item.badges) && item.badges.length > 0;

                    if (item.code) {
                      return (
                        <>
                          <div
                            className="flex items-center justify-between mb-2"
                            style={{ minHeight: CODE_BADGE_ROW_H }}
                          >
                            <span
                              className="inline-flex items-center justify-center rounded-md bg-[var(--accent)] text-white font-medium"
                              style={{ width: CODE_BADGE_ROW_H, height: CODE_BADGE_ROW_H, fontSize: 10 }}
                            >
                              {item.code}
                            </span>

                            {hasBadges ? (
                              <div onClick={(e) => e.stopPropagation()}>
                                <BadgesRow badges={item.badges} size={BADGE_SIZE} gap={BADGE_GAP} withCircle={true} />
                              </div>
                            ) : (
                              <div style={{ width: BADGE_SIZE, height: BADGE_SIZE }} />
                            )}
                          </div>
            <h3 className="text-base font-medium text-[var(--text-primary)]">
              {asText(item.name)}
            </h3>
          </>
        );
      }

      return (
        <>
          {/*  Beliebt/Popular Pill */}
            {item.popular && (
              <div className="mb-1">
                <PopularPill label={t("popular")} />
              </div>
            )}
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-base font-medium text-[var(--text-primary)]">
              {asText(item.name)}
            </h3>
            {hasBadges && (
              <div onClick={(e) => e.stopPropagation()}>
                <BadgesRow badges={item.badges} size={BADGE_SIZE} gap={BADGE_GAP} withCircle={true} />
              </div>
            )}
          </div>
        </>
      );
    })()}

                  {/* Preis + Beschreibung */}
                    <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">
                      {formatPrice(item.price)}
                    </p>
                  {item.description && (
                    <p className="mt-1 text-sm text-[var(--text-secondary)] line-clamp-2 break-words hyphens-auto">
                      {asText(item.description)}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </main>

      <DishSheet dish={selectedDish} open={isSheetOpen} onClose={closeDishSheet} />
      <DishSheet dish={selectedDish} open={isSheetOpen} onClose={closeDishSheet} />
      <BackToTopButton />
    </div>
  );
}
