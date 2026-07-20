import { getSettings } from "@/lib/store";
import Header from "@/components/Header";
import BookingWidget from "@/components/BookingWidget";

// Strona zależy od danych z bazy (ustawienia mogą się zmieniać w panelu
// admina), więc renderujemy ją zawsze na żądanie, a nie raz podczas builda.
export const dynamic = "force-dynamic";

export default async function Home() {
  const settings = await getSettings();

  return (
    <div className="flex-1 flex flex-col" style={{ background: "var(--paper)" }}>
      <Header
        companyName={settings.companyName}
        facilityName={settings.facilityName}
        rulesText={settings.rulesText}
      />
      <main className="flex-1">
        <BookingWidget settings={settings} />
      </main>
      <footer className="py-6 text-center text-xs text-[var(--text-muted)]">
        {settings.companyName} — rezerwacja online
      </footer>
    </div>
  );
}
