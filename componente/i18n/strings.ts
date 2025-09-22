
export type Lang = "de" | "en";


export const STRINGS = {
  de: {
    language: "Sprache",
    appearance: "Darstellung",
    darkMode: "Dunkles Design",
    information: "Information",
    extras: "Extras",
    allergens: "Allergene",
    close: "Schließen",
    popular: "Beliebt",
  },
  en: {
    language: "Language",
    appearance: "Appearance",
    darkMode: "Dark mode",
    information: "Information",
    extras: "Extras",
    allergens: "Allergens",
    close: "Close",
    popular: "Popular",
  },
} as const satisfies Record<Lang, Record<string, string>>;

export type Strings = typeof STRINGS;
export type StringKey = keyof Strings["de"]; 
