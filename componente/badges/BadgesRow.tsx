// componente/badges/BadgesRow.tsx
import React from "react";
import Badge from "./Badge";
import { BADGE_ORDER } from "./meta";

function orderIndex(key: string) {
  const i = BADGE_ORDER.indexOf(key as (typeof BADGE_ORDER)[number]);
  return i === -1 ? 999 : i;
}

export default function BadgesRow({
  badges,
  size = 12,           
  gap = 6,
  withCircle = true,  
}: {
  badges?: string[];
  size?: number;
  gap?: number;
  withCircle?: boolean;
}) {
  if (!badges || badges.length === 0) return null;

  const normalized = badges.map((b) => b.toLowerCase().trim());
  const sorted = [...normalized].sort((a, b) => orderIndex(a) - orderIndex(b));

  return (
    <div className="flex flex-wrap items-center" style={{ columnGap: gap, rowGap: gap }}>
      {sorted.map((b) => (
        <Badge key={b} kind={b} size={size} withCircle={withCircle} /> 
      ))}
    </div>
  );
}
