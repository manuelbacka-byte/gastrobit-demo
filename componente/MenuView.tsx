"use client";
import { useEffect, useRef, useState, useCallback } from "react";
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

export type Dish = {
  code?: string;
  name: Localized;
  price: number;
  description?: Localized;
  badges?: string[];
  allergene?: string[];
  extras?: { label: Localized; price: number }[];
  Kalorien?: number;
  info?: string[];
  popular?: boolean;
};
export type Category = { id: string; label: Localized; items: Dish[]; icon?: string };
export type Section = { id: string; label: Localized; categories: Category[] };
export type MenuData = { name: Localized; sections: Section[] };

const STICKY_HEIGHT = 80;
const CODE_BADGE_ROW_H = 24;
const BADGE_SIZE = 12;
const BADGE_GAP = 6;
const SWITCH_OFFSET = 50;

function getCategoryIcon(iconKey?: string) {
  if (!iconKey) return null;
  const key = iconKey.toLowerCase().trim();
  return BADGE_META[key] ?? { label: iconKey, src: `/icons/${key}.svg` };
}
function PopularPill({ label }: { label: string }) {
  return (
    <span
      className="inline-flex items-center justify-center align-middle h-5 px-2 rounded-md text-[10px] font-semibold leading-none tracking-normal"
      style={{ background: "var(--accent)", color: "#fff" }}
    >
      {label}
    </span>
  );
}

export default function MenuView({ menu }: { menu: MenuData }) {
  const { asText, formatPrice, t } = useI18n();
  const section = menu?.sections?.[0];
  const categories = section?.categories ?? [];
  const ids = categories.map((c) => c.id);
  const firstId = ids[0] ?? "";
  const lastId = ids[ids.length - 1] ?? "";

  // inhaltlich aktive Kategorie (aus Scrollsicht)
  const [activeCatId, setActiveCatId] = useState<string>(firstId);

  // Highlight/Positionierung der Tabs wird gelockt, solange der User nicht scrollt
  const [lockedActiveId, setLockedActiveId] = useState<string | null>(null);
  const visualActiveId = lockedActiveId ?? activeCatId;

  const allowAutoHighlight = useRef<boolean>(true);

  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);
  const [isSheetOpen, setSheetOpen] = useState(false);

  const unlockRef = useRef<(() => void) | null>(null);
  const unlockTimerRef = useRef<number | null>(null);

  const openDishSheet = (d: Dish) => {
    if (unlockRef.current) {
      window.removeEventListener("scrollend", unlockRef.current);
      unlockRef.current = null;
    }
    if (unlockTimerRef.current !== null) {
      clearTimeout(unlockTimerRef.current);
      unlockTimerRef.current = null;
    }
    allowAutoHighlight.current = false;
    setSelectedDish(d);
    setSheetOpen(true);
  };

  const closeDishSheet = () => {
    setSheetOpen(false);
    setTimeout(() => {
      allowAutoHighlight.current = true;
      updateActiveByScroll();
      if (!allowAutoHighlight.current || ids.length === 0 || isSheetOpen) return;
      setSelectedDish(null);
    }, 320);
  };

  // ---- Refs ----
  const tabsContainerRef = useRef<HTMLDivElement | null>(null);
  const tabBtnRefs = useRef<Record<string, HTMLButtonElement | null>>({} as Record<string, HTMLButtonElement | null>);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({} as Record<string, HTMLElement | null>);
  const stickyWrapRef = useRef<HTMLDivElement | null>(null);

  function getStickyHeight() {
    const el = stickyWrapRef.current;
    return el ? el.getBoundingClientRect().height : STICKY_HEIGHT;
  }

  // Sticky + Near-End
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [isStuck, setIsStuck] = useState(false);
  const [nearEnd, setNearEnd] = useState(false);
  const GAP_PX = 8;

// Prüfen, ob wir „nahe Ende“ sind: ab aktivem Tab bis zum Ende passt in die Client-Breite
const computeNearEnd = useCallback((activeId: string) => {
  const container = tabsContainerRef.current;
  if (!container) return false;
  const idx = categories.findIndex((c) => c.id === activeId);
  if (idx === -1) return false;

  let remaining = 0;
  for (let i = idx; i < categories.length; i++) {
    const btn = tabBtnRefs.current[categories[i].id];
    if (!btn) continue;s
    remaining += btn.offsetWidth;
    if (i > idx) remaining += GAP_PX;
  }
  return remaining <= container.clientWidth;
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [categories.map(c => c.id).join("|")]);


  // helpers
  const maxScrollLeft = useCallback((el: HTMLElement) => {
    return Math.max(0, el.scrollWidth - el.clientWidth);
  }, []);

  const scrollActiveLeft = useCallback((id: string, allowGap = true) => {
    const container = tabsContainerRef.current;
    const btn = tabBtnRefs.current[id];
    if (!container || !btn) return;
    const gap = allowGap ? GAP_PX : 0;
    const left = Math.max(0, btn.offsetLeft - gap);
    container.scrollTo({ left, behavior: "smooth" });
  }, []);

  const centerActiveTab = useCallback(
    (id: string) => {
      const container = tabsContainerRef.current;
      const btn = tabBtnRefs.current[id];
      if (!container || !btn) return;
      const target = btn.offsetLeft + btn.offsetWidth / 2 - container.clientWidth / 2;
      const next = Math.max(0, Math.min(maxScrollLeft(container), target));
      container.scrollTo({ left: next, behavior: "smooth" });
    },
    [maxScrollLeft]
  );

  // Ausrichten der Tabs (entscheidet zwischen links pinnen / zentrieren)
  const alignTabs = useCallback(
    (id: string) => {
      const c = tabsContainerRef.current;
      if (!c) return;

      const willNearEnd = computeNearEnd(id);
      const atHardEnd = Math.abs(c.scrollLeft - maxScrollLeft(c)) < 1;

      // Regeln:
      // 1) am harten Ende ODER nahe Ende -> links anpinnen
      // 2) im sticky Zustand -> eher links (ruhiger)
      // 3) sonst -> zentrieren
      if (atHardEnd || willNearEnd || isStuck) {
        scrollActiveLeft(id, !atHardEnd);
      } else {
        centerActiveTab(id);
      }
      setNearEnd(willNearEnd);
    },
  [centerActiveTab, scrollActiveLeft, maxScrollLeft, isStuck, computeNearEnd]
  );

  // Klick auf Tab / GoTo
  function goToCategory(catId: string) {
    // 1) Visual locken (Markierung bleibt)
    setLockedActiveId(catId);

    // 2) Programmatic Scroll zur Section
    allowAutoHighlight.current = false;

    const el = sectionRefs.current[catId];
    if (!el) return;

    const scrollToTarget = () => {
      const topOffset = getStickyHeight() + 6;
      const y = el.getBoundingClientRect().top + window.scrollY - topOffset;
      allowAutoHighlight.current = false;
      window.scrollTo({ top: y, behavior: "smooth" });
    };
    requestAnimationFrame(scrollToTarget);

    // 3) Tabs sofort korrekt positionieren
    alignTabs(catId);
    scrollActiveLeft(catId, false);
    setTimeout(() => scrollActiveLeft(catId, false), 120);
    // 4) Inhaltlich aktiv setzen (für spätere Scroll-Sync)
    setActiveCatId(catId);
    allowAutoHighlight.current = false;
    setTimeout(() => {
  allowAutoHighlight.current = true;
}, 1000);
    // 5) Nach kurzer Zeit AutoHighlight wieder zulassen
    setTimeout(() => {
  allowAutoHighlight.current = true;
  updateActiveByScroll(); 
}, 800); 

  }

  // Scroll-Sync (setzt activeCatId aus dem Viewport)
  function updateActiveByScroll() {
    if (!allowAutoHighlight.current || ids.length === 0 || isSheetOpen) return;

    const docH = document.documentElement.scrollHeight;
    const winH = window.innerHeight;
    const y = window.scrollY;
    const thresholdY = getStickyHeight() + SWITCH_OFFSET;

// unten -> letzte Kategorie 
if (y + winH >= docH - 20) {
  if (lockedActiveId !== null) setLockedActiveId(null); 
  if (activeCatId !== lastId) setActiveCatId(lastId);
  return;
}
    let currentId: string | null = null;

    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      const node = sectionRefs.current[id];
      if (!node) continue;

      const rect = node.getBoundingClientRect();
      const top = rect.top;
      const bot = rect.bottom;

      if (top <= thresholdY && bot > thresholdY) {
        if (i === 0) {
          currentId = ids[0];
        } else {
          const prev = sectionRefs.current[ids[i - 1]];
          if (prev) {
            const prevBottom = prev.getBoundingClientRect().bottom;
            currentId = prevBottom <= thresholdY ? id : ids[i - 1];
          } else {
            currentId = id;
          }
        }
        break;
      }
    }

    if (!currentId) {
      for (let i = ids.length - 1; i >= 0; i--) {
        const el = sectionRefs.current[ids[i]];
        if (el && el.getBoundingClientRect().top <= thresholdY) {
          currentId = ids[i];
          break;
        }
      }
      if (!currentId) currentId = firstId;
    }

    if (currentId && currentId !== activeCatId) {
      setLockedActiveId(null);   // Lock bei User-Scroll lösen
      setActiveCatId(currentId);
    }

  }

  // Scroll/Resize-Listener (Inhalt)
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

  // Tabs dynamisch repositionieren, wenn sich der visuelle (gelockte) Tab ändert
  useEffect(() => {
    if (!visualActiveId) return;
    alignTabs(visualActiveId);
  }, [visualActiveId, isStuck, alignTabs]);

useEffect(() => {
  const recalc = () => setNearEnd(computeNearEnd(activeCatId));
  recalc();
  window.addEventListener("resize", recalc);
  return () => window.removeEventListener("resize", recalc);
}, [activeCatId, computeNearEnd]);
// Lock des Tabs nur bis zum nächsten *User*-Scroll halten
// Lock bleibt nach Tab-Klick bestehen, löst sich erst bei *echtem* User-Scroll/Interaktion
useEffect(() => {
  if (!lockedActiveId) return;

  const unlock = () => setLockedActiveId(null);

  // Touch / Wheel = echte User-Geste
  const onWheel = () => unlock();
  const onTouchMove = () => unlock();

  // Tastatur – Pfeile, PageUp/Down, Home/End, Space
  const onKeyDown = (e: KeyboardEvent) => {
    const keys = ["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " "];
    if (keys.includes(e.key)) unlock();
  };

  window.addEventListener("wheel", onWheel, { passive: true });
  window.addEventListener("touchmove", onTouchMove, { passive: true });
  window.addEventListener("keydown", onKeyDown);

  return () => {
    window.removeEventListener("wheel", onWheel);
    window.removeEventListener("touchmove", onTouchMove);
    window.removeEventListener("keydown", onKeyDown);
  };
}, [lockedActiveId]);



  // rAF: Nutzer-Scroll erkennen und Lock lösen
useEffect(() => {
  let raf = 0;
  const onScroll = () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => setNearEnd(computeNearEnd(activeCatId)));
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener('scroll', onScroll);
  };
}, [activeCatId, computeNearEnd]);


  // Sticky via Sentinel
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setIsStuck(!entry.isIntersecting), { threshold: 1 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // --- Render ---
  if (!section || categories.length === 0) {
    return (
      <div className="max-w-screen-md mx-auto p-5">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>
            {asText(menu?.name ?? "")}
          </h1>
          <SettingsMenu iconSrc="/icons/settings.svg" />
        </div>
        <p className="text-sm text-[var(--text-secondary)]">Keine Kategorien vorhanden.</p>
      </div>
    );
  }

  return (
    <div className="bg-[var(--background)]">
      <main className="max-w-screen-md mx-auto antialiased tracking-normal">
        {/* Hero */}
        <div className="w-full overflow-hidden rounded-md bg-[var(--card-bg)] ">
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

        {/* Kopf */}
        <div className="mt-5 mb-4 flex items-center justify-between">
          <h1 className={`${bebas.className} text-3xl font-normal`} style={{ color: "var(--text-primary)" }}>
            {asText(menu.name)}
          </h1>
          <SettingsMenu iconSrc="/icons/settings.svg" />
        </div>

        {/* Sentinel */}
        <div ref={sentinelRef} className="h-px" />

        {/* Sticky Tabs */}
        <div className="sticky top-0 z-50">
          <div className="relative">
            <div aria-hidden className="absolute inset-0" style={{ background: "var(--card-bg)" }} />
            <div ref={stickyWrapRef} className={`relative ${isStuck ? "pt-4 pb-4" : "py-0"}`}>
              <div ref={tabsContainerRef} className="flex gap-2 overflow-x-auto no-scrollbar w-full">
                {categories.map((c) => {
                  const active = c.id === visualActiveId; // << nur visuell
                  return (
                    <button
                      key={c.id}
                      ref={(el) => {
                        tabBtnRefs.current[c.id] = el;
                      }}
                      onClick={() => goToCategory(c.id)}
                      className={[
                        "flex items-center justify-center",
                        "h-10 px-4 rounded-full border text-sm font-semibold leading-none",
                        "whitespace-nowrap transition-opacity",
                        active
                          ? "bg-[var(--accent)] text-white border-[var(--accent)] opacity-100"
                          : "bg-[var(--card-bg)] text-[var(--text-primary)] border-[var(--border)] opacity-80 hover:opacity-90",
                      ].join(" ")}
                    >
                      {asText(c.label)}
                    </button>
                  );
                })}
              </div>
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
            className="mb-12 md:mb-14 scroll-mt-24"
          >
            <h2 className="flex items-center gap-2 text-xl leading-[1.15] font-bold text-[var(--text-primary)] mt-4 mb-2">
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
                  className={`pb-4 border-b border-[var(--border)] ${item.code ? "mb-1" : "mb-2"} cursor-pointer`}
                >
                  {(() => {
                    const hasBadges = Array.isArray(item.badges) && item.badges.length > 0;

                    if (item.code) {
                      return (
                        <>
                          <div className="flex items-center justify-between mb-2" style={{ minHeight: CODE_BADGE_ROW_H }}>
                            <span
                              className="inline-flex items-center justify-center rounded-md bg-[var(--accent)] text-white font-medium"
                              style={{ width: CODE_BADGE_ROW_H, height: CODE_BADGE_ROW_H, fontSize: 10 }}
                            >
                              {item.code}
                            </span>

                            {hasBadges ? (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className={item.popular ? "mt-1" : ""}
                              >
                                <BadgesRow badges={item.badges} size={BADGE_SIZE} gap={BADGE_GAP} withCircle={true} />
                              </div>
                            ) : (
                              <div style={{ width: BADGE_SIZE, height: BADGE_SIZE }} />
                            )}
                          </div>
                          <h3 className="text-base font-medium text-[var(--text-primary)]">{asText(item.name)}</h3>
                        </>
                      );
                    }

                    return (
                      <>
                        {item.popular && (
                          <div className="mb-1">
                            <PopularPill label={t("popular")} />
                          </div>
                        )}

                        <div className="flex items-center justify-between mb-1">
                          <h3 className="text-base font-semibold text-[var(--text-primary)]">{asText(item.name)}</h3>

                          {hasBadges && (
                            <div onClick={(e) => e.stopPropagation()} className={item.popular ? "-mt-13" : ""}>
                              <BadgesRow badges={item.badges} size={BADGE_SIZE} gap={BADGE_GAP} withCircle />
                            </div>
                          )}
                        </div>
                      </>
                    );
                  })()}

                  {/* Preis + Beschreibung */}
                  <p className="mt-1 text-sm font-medium text-[var(--text-primary)] tabular-nums">
                    {formatPrice(item.price)}
                  </p>
                  {item.description && (
                    <p className="mt-1 text-sm font-medium text-[var(--text-secondary)] line-clamp-2 leading-6 break-words hyphens-auto">
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
      <BackToTopButton />
    </div>
  );
}
