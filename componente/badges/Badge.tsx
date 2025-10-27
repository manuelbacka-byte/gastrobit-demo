// componente/badges/Badge.tsx
import React from "react";
import { BADGE_META } from "./meta";

type Props = { kind: string; size?: number; withCircle?: boolean };

export default function Badge({ kind, size = 10, withCircle = false }: Props) {
  const meta = BADGE_META[kind];

  if (!meta?.src) {
    return (
      <span
        title={`Unbekanntes Badge: ${kind}`}
        className="inline-block rounded-full bg-gray-200 text-[10px] leading-none text-gray-600 px-1 py-1"
        style={{ width: size, height: size }}
      >
        ?
      </span>
    );
  }

const isHalal = kind === "halal";
const scale = isHalal ? 1.12 : 1; // 1.08–1.18 ausprobieren

const icon = (
  <span
    aria-hidden
    style={{
      display: "inline-block",
      width: size,
      height: size,
      transform: `scale(${scale})`,
      transformOrigin: "center",
      backgroundColor: "var(--icon)",
      filter: isHalal ? "drop-shadow(0 0 0 #000) drop-shadow(0 0 0 #000)" : undefined,
      WebkitMask: `url(${meta.src}) center / contain no-repeat`,
      mask: `url(${meta.src}) center / contain no-repeat`,
    }}
  />
);

  if (!withCircle) return icon;

  return (
    <span
      className="inline-flex items-center justify-center rounded-full bg-[var(--kreis)]"
      style={{ width: size + 10, height: size + 10 }}
    >
      {icon}
    </span>
  );
}
