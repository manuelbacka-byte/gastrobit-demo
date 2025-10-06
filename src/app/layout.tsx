import "./globals.css";
import { I18nProvider } from "../../componente/i18n/I18nProvider";
import { DEFAULT_DARK, RESPECT_USER_CHOICE } from "../../config/theme";

export const metadata = {
  title: "Gastrobit",
  description: "Digitale Speisekarten",
};

// liest (falls vorhanden) eure manuelle Wahl vor dem ersten Paint
const themeInitScript = `
(function() {
  try {
    var root = document.documentElement;
    var respect = ${RESPECT_USER_CHOICE ? 'true' : 'false'};
    // Falls euer bestehender Button schon localStorage nutzt: KEY so lassen.
    var stored = respect ? (localStorage.getItem('theme') || null) : null;
    // stored: 'light' | 'dark' | 'system' | null

    if (stored === 'light' || stored === 'dark') {
      root.setAttribute('data-theme', stored);   // manuelle Wahl erzwingen
      return;
    }
    // 'system' oder nichts -> System soll entscheiden => KEIN data-theme setzen
    root.removeAttribute('data-theme');
    // Wenn ihr RESPECT_USER_CHOICE=false nutzen wollt, könnt ihr serverseitig DEFAULT_DARK setzen (siehe html unten).
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="de"
      suppressHydrationWarning
      // Nur setzen, wenn ihr bewusst KEINE Nutzerwahl zulasst:
      data-theme={RESPECT_USER_CHOICE ? undefined : (DEFAULT_DARK ? "dark" : undefined)}
    >
      <head>
        <meta name="color-scheme" content="light dark" />
        <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#0a0a0a" media="(prefers-color-scheme: dark)" />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
