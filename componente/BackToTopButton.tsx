"use client";
import { useEffect, useState } from "react";

const SHOW_AFTER = 600;      // px Scrollhöhe, ab der der Button erscheint
const BUTTON_SIZE = 40;      // fester Durchmesser des Kreises
const ICON_SIZE = 20;        // Größe des Pfeils im Kreis

export default function BackToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

useEffect(() => {
  const toggleVisibility = () => {
    // Wenn ein Sheet offen ist, keinen State ändern (window.scrollY ist dann 0)
    if (document.body.getAttribute("data-sheet-open") === "true") return;

    setIsVisible(window.scrollY > SHOW_AFTER); // deinen Schwellwert weiterverwenden
  };

  window.addEventListener("scroll", toggleVisibility, { passive: true });
  // gleich initial prüfen
  toggleVisibility();
  return () => window.removeEventListener("scroll", toggleVisibility);
}, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });
useEffect(() => {
  const obs = new MutationObserver(() => {
    setIsVisible(document.body.getAttribute("data-sheet-open") !== "true" && window.scrollY > 600);
  });
  obs.observe(document.body, { attributes: true, attributeFilter: ["data-sheet-open"] });
  return () => obs.disconnect();
}, []);

  return (
    <button
      onClick={scrollToTop}
      type="button"
      aria-label="Zurück nach oben"
      className={`fixed bottom-5 right-5 z-50 grid place-items-center rounded-full shadow-md transition-opacity duration-300 ${
        isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      style={{
        width: BUTTON_SIZE,
        height: BUTTON_SIZE,
        background: "var(--accent)",
        color: "#fff",
      }}
    >
      <span
        aria-hidden
        className="block"
        style={{
          width: ICON_SIZE,
          height: ICON_SIZE,
          backgroundColor: "white",
          WebkitMask: "url(/icons/pfeil.svg) center / contain no-repeat",
          mask: "url(/icons/pfeil.svg) center / contain no-repeat",
        }}
      />
    </button>
  );
}
