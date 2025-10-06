// config/theme.ts
export const DEFAULT_DARK = false as const;         // true Dark, false Light 
export const RESPECT_USER_CHOICE = true as const;  // true = User darf überschreiben (localStorage)

export const THEME_STORAGE_KEY = 'theme' as const;


export type ThemeChoice = 'light' | 'dark' | 'system';
export function setTheme(choice: ThemeChoice) {
  const root = document.documentElement;
  if (choice === 'system') {
    localStorage.removeItem(THEME_STORAGE_KEY);
    root.removeAttribute('data-theme'); 
  } else {
    localStorage.setItem(THEME_STORAGE_KEY, choice);
    root.setAttribute('data-theme', choice); 
  }
}
