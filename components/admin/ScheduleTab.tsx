"use client";

import { useEffect, useState } from "react";
import { Break, ClosedDay, Settings, WeekSchedule } from "@/lib/types";

const DOW_LABELS: Record<number, string> = {
  1: "Poniedziałek",
  2: "Wtorek",
  3: "Środa",
  4: "Czwartek",
  5: "Piątek",
  6: "Sobota",
  0: "Niedziela",
};
const DOW_ORDER = [1, 2, 3, 4, 5, 6, 0];

export default function ScheduleTab() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [newClosedDate, setNewClosedDate] = useState("");
  const [newBreak, setNewBreak] = useState({ date: "", startTime: "", endTime: "", label: "" });

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data) => setSettings(data.settings));
  }, []);

  if (!settings) {
    return <p className="text-sm text-[var(--text-secondary)]">Ładowanie…</p>;
  }

  function updateDay(dow: number, patch: Partial<WeekSchedule[keyof WeekSchedule]>) {
    setSettings((s) =>
      s
        ? {
            ...s,
            weekSchedule: { ...s.weekSchedule, [dow]: { ...s.weekSchedule[dow as keyof WeekSchedule], ...patch } },
          }
        : s
    );
  }

  async function save() {
    if (!settings) return;
    setSaving(true);
    setSaved(false);
    await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function addClosedDay() {
    if (!newClosedDate || !settings) return;
    const closedDays: ClosedDay[] = [...settings.closedDays, { date: newClosedDate }];
    setSettings({ ...settings, closedDays });
    setNewClosedDate("");
  }

  function removeClosedDay(date: string) {
    if (!settings) return;
    setSettings({ ...settings, closedDays: settings.closedDays.filter((c) => c.date !== date) });
  }

  function addBreak() {
    if (!newBreak.date || !newBreak.startTime || !newBreak.endTime || !settings) return;
    const breaks: Break[] = [...settings.breaks, { id: `brk_${Date.now()}`, ...newBreak }];
    setSettings({ ...settings, breaks });
    setNewBreak({ date: "", startTime: "", endTime: "", label: "" });
  }

  function removeBreak(id: string) {
    if (!settings) return;
    setSettings({ ...settings, breaks: settings.breaks.filter((b) => b.id !== id) });
  }

  const inputClass = "rounded-lg border px-2.5 py-1.5 text-sm focus-ring outline-none";

  return (
    <div className="space-y-8 max-w-3xl">
      <section>
        <h2 className="text-base font-semibold mb-3">Ogólne</h2>
        <div className="rounded-xl border p-4 space-y-3" style={{ borderColor: "var(--border)" }}>
          <div>
            <label className="block text-xs text-[var(--text-secondary)] mb-1">Nazwa firmy</label>
            <input
              type="text"
              value={settings.companyName}
              onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
              className={inputClass + " w-full"}
              style={{ borderColor: "var(--border)" }}
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--text-secondary)] mb-1">Nazwa obiektu</label>
            <input
              type="text"
              value={settings.facilityName}
              onChange={(e) => setSettings({ ...settings, facilityName: e.target.value })}
              className={inputClass + " w-full"}
              style={{ borderColor: "var(--border)" }}
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--text-secondary)] mb-1">Zasady rezerwacji (tekst widoczny dla klienta)</label>
            <textarea
              value={settings.rulesText}
              onChange={(e) => setSettings({ ...settings, rulesText: e.target.value })}
              rows={3}
              className={inputClass + " w-full"}
              style={{ borderColor: "var(--border)", resize: "vertical" }}
            />
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-base font-semibold mb-3">Godziny otwarcia</h2>
        <div className="rounded-xl border divide-y" style={{ borderColor: "var(--border)" }}>
          {DOW_ORDER.map((dow) => {
            const day = settings.weekSchedule[dow as keyof WeekSchedule];
            return (
              <div key={dow} className="flex flex-wrap items-center gap-3 px-4 py-3" style={{ borderColor: "var(--border)" }}>
                <label className="flex items-center gap-2 w-36 shrink-0 text-sm">
                  <input
                    type="checkbox"
                    checked={day.enabled}
                    onChange={(e) => updateDay(dow, { enabled: e.target.checked })}
                  />
                  {DOW_LABELS[dow]}
                </label>
                <input
                  type="time"
                  value={day.open}
                  disabled={!day.enabled}
                  onChange={(e) => updateDay(dow, { open: e.target.value })}
                  className={inputClass}
                  style={{ borderColor: "var(--border)", opacity: day.enabled ? 1 : 0.5 }}
                />
                <span className="text-[var(--text-muted)] text-sm">—</span>
                <input
                  type="time"
                  value={day.close}
                  disabled={!day.enabled}
                  onChange={(e) => updateDay(dow, { close: e.target.value })}
                  className={inputClass}
                  style={{ borderColor: "var(--border)", opacity: day.enabled ? 1 : 0.5 }}
                />
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="text-base font-semibold mb-3">Minimalne i maksymalne wyprzedzenie</h2>
        <div className="flex flex-wrap gap-6">
          <label className="text-sm">
            <span className="block text-[var(--text-secondary)] mb-1">Minimalny czas przed rezerwacją (minuty)</span>
            <input
              type="number"
              min={0}
              value={settings.minAdvanceMinutes}
              onChange={(e) => setSettings({ ...settings, minAdvanceMinutes: Number(e.target.value) })}
              className={inputClass}
              style={{ borderColor: "var(--border)", width: 100 }}
            />
          </label>
          <label className="text-sm">
            <span className="block text-[var(--text-secondary)] mb-1">Maksymalne wyprzedzenie (dni)</span>
            <input
              type="number"
              min={1}
              value={settings.maxAdvanceDays}
              onChange={(e) => setSettings({ ...settings, maxAdvanceDays: Number(e.target.value) })}
              className={inputClass}
              style={{ borderColor: "var(--border)", width: 100 }}
            />
          </label>
        </div>
      </section>

      <section>
        <h2 className="text-base font-semibold mb-3">Wyłączone dni</h2>
        <div className="flex flex-wrap gap-2 mb-3">
          {settings.closedDays.map((c) => (
            <span
              key={c.date}
              className="inline-flex items-center gap-2 text-sm rounded-full px-3 py-1.5 border"
              style={{ borderColor: "var(--border)" }}
            >
              {c.date}
              <button type="button" onClick={() => removeClosedDay(c.date)} aria-label={`Usuń wyłączenie dnia ${c.date}`}>
                ×
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="date"
            value={newClosedDate}
            onChange={(e) => setNewClosedDate(e.target.value)}
            className={inputClass}
            style={{ borderColor: "var(--border)" }}
          />
          <button
            type="button"
            onClick={addClosedDay}
            className="text-sm px-3 py-1.5 rounded-lg border"
            style={{ borderColor: "var(--border-strong)" }}
          >
            Wyłącz dzień
          </button>
        </div>
      </section>

      <section>
        <h2 className="text-base font-semibold mb-3">Przerwy techniczne</h2>
        <div className="space-y-2 mb-3">
          {settings.breaks.map((b) => (
            <div key={b.id} className="flex items-center gap-3 text-sm">
              <span className="rounded-full px-3 py-1 border" style={{ borderColor: "var(--border)" }}>
                {b.date}, {b.startTime}–{b.endTime} — {b.label}
              </span>
              <button type="button" onClick={() => removeBreak(b.id)} className="text-[var(--text-muted)]">
                Usuń
              </button>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 items-end">
          <input
            type="date"
            value={newBreak.date}
            onChange={(e) => setNewBreak((b) => ({ ...b, date: e.target.value }))}
            className={inputClass}
            style={{ borderColor: "var(--border)" }}
          />
          <input
            type="time"
            value={newBreak.startTime}
            onChange={(e) => setNewBreak((b) => ({ ...b, startTime: e.target.value }))}
            className={inputClass}
            style={{ borderColor: "var(--border)" }}
          />
          <input
            type="time"
            value={newBreak.endTime}
            onChange={(e) => setNewBreak((b) => ({ ...b, endTime: e.target.value }))}
            className={inputClass}
            style={{ borderColor: "var(--border)" }}
          />
          <input
            type="text"
            placeholder="Opis (np. sprzątanie)"
            value={newBreak.label}
            onChange={(e) => setNewBreak((b) => ({ ...b, label: e.target.value }))}
            className={inputClass}
            style={{ borderColor: "var(--border)" }}
          />
          <button
            type="button"
            onClick={addBreak}
            className="text-sm px-3 py-1.5 rounded-lg border"
            style={{ borderColor: "var(--border-strong)" }}
          >
            Dodaj przerwę
          </button>
        </div>
      </section>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="rounded-lg px-4 py-2.5 text-sm font-medium text-white focus-ring disabled:opacity-60"
          style={{ background: "var(--ink)" }}
        >
          {saving ? "Zapisywanie…" : "Zapisz zmiany"}
        </button>
        {saved && <span className="text-sm" style={{ color: "var(--status-available-text)" }}>Zapisano</span>}
      </div>
    </div>
  );
}
