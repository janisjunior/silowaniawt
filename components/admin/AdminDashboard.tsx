"use client";

import { useState } from "react";
import BookingsTab from "./BookingsTab";
import ScheduleTab from "./ScheduleTab";
import HistoryTab from "./HistoryTab";

type Tab = "bookings" | "schedule" | "history";

const TABS: { id: Tab; label: string }[] = [
  { id: "bookings", label: "Rezerwacje" },
  { id: "schedule", label: "Grafik" },
  { id: "history", label: "Historia zmian" },
];

export default function AdminDashboard() {
  const [tab, setTab] = useState<Tab>("bookings");

  return (
    <div>
      <nav className="flex gap-1 border-b mb-6" style={{ borderColor: "var(--border)" }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className="px-4 py-2.5 text-sm font-medium -mb-px border-b-2 focus-ring"
            style={{
              borderColor: tab === t.id ? "var(--ink)" : "transparent",
              color: tab === t.id ? "var(--text-primary)" : "var(--text-secondary)",
            }}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === "bookings" && <BookingsTab />}
      {tab === "schedule" && <ScheduleTab />}
      {tab === "history" && <HistoryTab />}
    </div>
  );
}
