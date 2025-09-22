import MenuView, { type MenuData } from "../../componente/MenuView";
import menuJson from "../../data/menu.json";

export default function Page() {
  // ultra-leichter Adapter: JSON -> Struktur für MenuView
  const menu = {
    name: menuJson.name,
    sections: [
      {
        id: "main",
        label: { de: "Speisekarte", en: "Menu" },
        categories: menuJson.sections, // <-- deine Kategorien direkt übernehmen
      },
    ],
  } as unknown as MenuData;

  return (
    <main
      style={{
        fontFamily: "system-ui, sans-serif",
        padding: 15,
        maxWidth: 720,
        margin: "0 auto",
      }}
    >
      <MenuView menu={menu} />
      <div style={{ color: "#6b7280", marginTop: 24, fontSize: 14 }}>
        {new Date().getFullYear()} Gastrobit
      </div>
    </main>
  );
}
