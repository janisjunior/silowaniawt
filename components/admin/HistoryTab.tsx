"use client";

import { useEffect, useState } from "react";

interface HistoryEntry {
  id: string;
  bookingId: string;
  bookingLabel: string;
  action: string;
  detail: string;
  actor: string;
  timestamp: string;
}

export default function HistoryTab() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/history")
      .then((r) => r.json())
      .then((data) => setHistory(data.history || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-[var(--text-secondary)]">Ładowanie…</p>;

  if (history.length === 0) {
    return <p className="text-sm text-[var(--text-secondary)]">Brak zarejestrowanych zmian.</p>;
  }

  return (
    <div className="rounded-xl border divide-y" style={{ borderColor: "var(--border)" }}>
      {history.map((h) => (
        <div key={h.id} className="px-4 py-3 text-sm">
          <div className="flex items-center justify-between gap-3">
            <span className="font-medium capitalize">{h.action}</span>
            <span className="text-xs text-[var(--text-muted)]">
              {new Date(h.timestamp).toLocaleString("pl-PL")}
            </span>
          </div>
          <p className="text-[var(--text-secondary)] mt-0.5">{h.bookingLabel}</p>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            {h.detail} · wykonane przez: {h.actor === "admin" ? "administrator" : h.actor === "user" ? "użytkownik" : "system"}
          </p>
        </div>
      ))}
    </div>
  );
}
