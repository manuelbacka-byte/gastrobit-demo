import "./globals.css";
import { I18nProvider } from "../../componente/i18n/I18nProvider";
import { DEFAULT_DARK } from "../../config/theme";
export const metadata = {
  title: "Gastrobit",
  description: "Digitale Speisekarten",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" data-theme={DEFAULT_DARK ? "dark" : undefined}>
      <body>
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
