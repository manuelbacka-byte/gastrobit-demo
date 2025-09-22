
export const BADGE_ORDER = [
  "halal",
  "vegan",
  "vegetarisch",
  "alkoholfrei",
  "alkohol",
  "scharf",
  "gluten",
  "laktose",
  "wein"
] as const;

export type BadgeKey = typeof BADGE_ORDER[number] | string;

// Pfade zu den SVGs
type Localized = string | { de: string; en: string };
export const BADGE_META: Record<string, { label: Localized; src: string }> = {
  halal:        { label: { de: "Halal", en: "Halal"},              src: "/icons/halal.svg" },
  vegan:        { label: { de: "Vegan", en: "Vegan"},              src: "/icons/vegan.svg" },
  vegetarisch:  { label: { de: "Vegetarisch", en: "Vegetarian"},   src: "/icons/vegetarisch.svg" },
  alkoholfrei:  { label: { de: "Alkoholfrei", en: "alcohol-free"}, src: "/icons/alkoholfrei.svg" },
  scharf:       { label: { de: "Scharf", en: "Spicy"},             src: "/icons/scharf.svg" },
  glutenfrei:   { label: { de: "Glutenfrei", en: "Gluten-free"},   src: "/icons/glutenfrei.svg" },
  laktosefrei:  { label: { de: "Laktosefrei", en: "Lactose-free"}, src: "/icons/laktosefrei.svg" },
  alkohol:      { label: { de: "Alkohol",     en: "Alcohol"},       src: "/icons/alkohol.svg"    },
  wein:         { label: { de: "Wein", en: "Wine"}, src: "/icons/wein.svg" },
}
