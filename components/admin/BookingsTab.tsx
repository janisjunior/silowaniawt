"use client";

import { useEffect, useState } from "react";
import { Booking, BookingStatus, Duration } from "@/lib/types";

const STATUS_LABELS: Record<BookingStatus, string> = {
  oczekujaca: "Oczekująca",
  potwierdzona: "Potwierdzona",
  anulowana: "Anulowana",
  zakonczona: "Zakończona",
  nieobecnosc: "Nieobecność",
};

const STATUS_COLORS: Record<BookingStatus, { bg: string; text: string }> = {
  oczekujaca: { bg: "#fbf1e2", text: "#8a5a10" },
  potwierdzona: { bg: "#eef4ee", text: "#2f5a35" },
  anulowana: { bg: "#f4f2ee", text: "#9a978f" },
  zakonczona: { bg: "#e9eef5", text: "#2b4b73" },
  nieobecnosc: { bg: "#fbeeec", text: "#8a2f24" },
};

interface Filters {
  date: string;
  name: string;
  status: BookingStatus | "";
}

function emptyManualForm() {
  return { date: "", startTime: "", duration: 60 as Duration, fullName: "", phone: "", email: "", message: "" };
}

export default function BookingsTab() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>({ date: "", name: "", status: "" });
  const [manualOpen, setManualOpen] = useState(false);
  const [manualForm, setManualForm] = useState(emptyManualForm());
  const [manualError, setManualError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ fullName: "", phone: "", email: "", message: "" });

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.date) params.set("date", filters.date);
    if (filters.name) params.set("name", filters.name);
    if (filters.status) params.set("status", filters.status);
    const res = await fetch(`/api/bookings?${params.toString()}`);
    const data = await res.json();
    setBookings(data.bookings || []);
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standardowy wzorzec ładowania danych z filtrów
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  async function handleCancel(id: string) {
    if (!confirm("Anulować tę rezerwację?")) return;
    await fetch(`/api/bookings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "cancel" }),
    });
    load();
  }

  async function handleAttendance(id: string, attended: boolean) {
    await fetch(`/api/bookings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: attended ? "zakonczona" : "nieobecnosc" }),
    });
    load();
  }

  function startEdit(b: Booking) {
    setEditingId(b.id);
    setEditForm({ fullName: b.fullName, phone: b.phone, email: b.email, message: b.message || "" });
  }

  async function saveEdit(id: string) {
    await fetch(`/api/bookings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    setEditingId(null);
    load();
  }

  async function handleManualSubmit() {
    setManualError(null);
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...manualForm, isManual: true }),
    });
    const data = await res.json();
    if (!res.ok) {
      setManualError(data.error || "Nie udało się dodać rezerwacji.");
      return;
    }
    setManualOpen(false);
    setManualForm(emptyManualForm());
    load();
  }

  function exportCsv() {
    const params = new URLSearchParams();
    if (filters.date) params.set("date", filters.date);
    if (filters.name) params.set("name", filters.name);
    if (filters.status) params.set("status", filters.status);
    window.location.href = `/api/bookings/export?${params.toString()}`;
  }

  const inputClass = "rounded-lg border px-3 py-2 text-sm focus-ring outline-none";

  return (
    <div>
      <div className="flex flex-wrap items-end gap-3 mb-5">
        <div>
          <label className="block text-xs text-[var(--text-secondary)] mb-1">Data</label>
          <input
            type="date"
            value={filters.date}
            onChange={(e) => setFilters((f) => ({ ...f, date: e.target.value }))}
            className={inputClass}
            style={{ borderColor: "var(--border)" }}
          />
        </div>
        <div>
          <label className="block text-xs text-[var(--text-secondary)] mb-1">Nazwisko</label>
          <input
            type="text"
            value={filters.name}
            onChange={(e) => setFilters((f) => ({ ...f, name: e.target.value }))}
            placeholder="Szukaj…"
            className={inputClass}
            style={{ borderColor: "var(--border)" }}
          />
        </div>
        <div>
          <label className="block text-xs text-[var(--text-secondary)] mb-1">Status</label>
          <select
            value={filters.status}
            onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value as BookingStatus | "" }))}
            className={inputClass}
            style={{ borderColor: "var(--border)" }}
          >
            <option value="">Wszystkie</option>
            {(Object.keys(STATUS_LABELS) as BookingStatus[]).map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1" />

        <button
          type="button"
          onClick={exportCsv}
          className="text-sm px-3 py-2 rounded-lg border hover:bg-black/5 focus-ring"
          style={{ borderColor: "var(--border-strong)" }}
        >
          Eksportuj CSV
        </button>
        <button
          type="button"
          onClick={() => setManualOpen(true)}
          className="text-sm px-3 py-2 rounded-lg text-white focus-ring"
          style={{ background: "var(--ink)" }}
        >
          Dodaj rezerwację
        </button>
      </div>

      <div className="rounded-xl border overflow-x-auto" style={{ borderColor: "var(--border)" }}>
        <table className="w-full text-sm" style={{ minWidth: 760 }}>
          <thead>
            <tr className="text-left text-xs text-[var(--text-secondary)] border-b" style={{ borderColor: "var(--border)" }}>
              <th className="py-2.5 px-3 font-medium">Data / godzina</th>
              <th className="py-2.5 px-3 font-medium">Klient</th>
              <th className="py-2.5 px-3 font-medium">Kontakt</th>
              <th className="py-2.5 px-3 font-medium">Status</th>
              <th className="py-2.5 px-3 font-medium">Akcje</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-[var(--text-secondary)]">
                  Ładowanie…
                </td>
              </tr>
            )}
            {!loading && bookings.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-[var(--text-secondary)]">
                  Brak rezerwacji spełniających kryteria.
                </td>
              </tr>
            )}
            {bookings.map((b) => {
              const colors = STATUS_COLORS[b.status];
              const editing = editingId === b.id;
              return (
                <tr key={b.id} className="border-b last:border-0" style={{ borderColor: "var(--border)" }}>
                  <td className="py-2.5 px-3 align-top whitespace-nowrap">
                    {b.date}
                    <br />
                    <span className="text-[var(--text-secondary)]">
                      {b.startTime}–{b.endTime}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 align-top">
                    {editing ? (
                      <input
                        value={editForm.fullName}
                        onChange={(e) => setEditForm((f) => ({ ...f, fullName: e.target.value }))}
                        className="rounded border px-2 py-1 text-sm w-full"
                        style={{ borderColor: "var(--border)" }}
                      />
                    ) : (
                      b.fullName
                    )}
                    {editing && (
                      <textarea
                        value={editForm.message}
                        onChange={(e) => setEditForm((f) => ({ ...f, message: e.target.value }))}
                        placeholder="Wiadomość"
                        className="rounded border px-2 py-1 text-sm w-full mt-1"
                        style={{ borderColor: "var(--border)" }}
                        rows={2}
                      />
                    )}
                  </td>
                  <td className="py-2.5 px-3 align-top">
                    {editing ? (
                      <div className="space-y-1">
                        <input
                          value={editForm.phone}
                          onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                          className="rounded border px-2 py-1 text-sm w-full"
                          style={{ borderColor: "var(--border)" }}
                        />
                        <input
                          value={editForm.email}
                          onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                          className="rounded border px-2 py-1 text-sm w-full"
                          style={{ borderColor: "var(--border)" }}
                        />
                      </div>
                    ) : (
                      <>
                        {b.phone}
                        <br />
                        <span className="text-[var(--text-secondary)]">{b.email}</span>
                      </>
                    )}
                  </td>
                  <td className="py-2.5 px-3 align-top">
                    <span
                      className="inline-block rounded-full px-2.5 py-1 text-xs font-medium"
                      style={{ background: colors.bg, color: colors.text }}
                    >
                      {STATUS_LABELS[b.status]}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 align-top">
                    <div className="flex flex-wrap gap-2">
                      {editing ? (
                        <>
                          <button
                            type="button"
                            onClick={() => saveEdit(b.id)}
                            className="text-xs px-2.5 py-1 rounded-md text-white"
                            style={{ background: "var(--ink)" }}
                          >
                            Zapisz
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="text-xs px-2.5 py-1 rounded-md border"
                            style={{ borderColor: "var(--border-strong)" }}
                          >
                            Anuluj
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => startEdit(b)}
                            className="text-xs px-2.5 py-1 rounded-md border"
                            style={{ borderColor: "var(--border-strong)" }}
                          >
                            Edytuj
                          </button>
                          {b.status !== "anulowana" && (
                            <button
                              type="button"
                              onClick={() => handleCancel(b.id)}
                              className="text-xs px-2.5 py-1 rounded-md border"
                              style={{ borderColor: "#e3b3ad", color: "#8a2f24" }}
                            >
                              Anuluj
                            </button>
                          )}
                          {b.status === "potwierdzona" && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleAttendance(b.id, true)}
                                className="text-xs px-2.5 py-1 rounded-md border"
                                style={{ borderColor: "var(--status-available-border)", color: "var(--status-available-text)" }}
                              >
                                Obecny
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAttendance(b.id, false)}
                                className="text-xs px-2.5 py-1 rounded-md border"
                                style={{ borderColor: "var(--status-low-border)", color: "var(--status-low-text)" }}
                              >
                                Nieobecny
                              </button>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {manualOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: "rgba(11,18,32,0.45)" }}
        >
          <div
            className="max-w-md w-full rounded-xl border p-5"
            style={{ borderColor: "var(--border)", background: "var(--surface)" }}
          >
            <h3 className="text-base font-semibold mb-4">Dodaj rezerwację ręcznie</h3>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs text-[var(--text-secondary)] mb-1">Data</label>
                <input
                  type="date"
                  value={manualForm.date}
                  onChange={(e) => setManualForm((f) => ({ ...f, date: e.target.value }))}
                  className={inputClass + " w-full"}
                  style={{ borderColor: "var(--border)" }}
                />
              </div>
              <div>
                <label className="block text-xs text-[var(--text-secondary)] mb-1">Godzina</label>
                <input
                  type="time"
                  value={manualForm.startTime}
                  onChange={(e) => setManualForm((f) => ({ ...f, startTime: e.target.value }))}
                  className={inputClass + " w-full"}
                  style={{ borderColor: "var(--border)" }}
                />
              </div>
            </div>
            <div className="mb-3">
              <label className="block text-xs text-[var(--text-secondary)] mb-1">Czas trwania</label>
              <select
                value={manualForm.duration}
                onChange={(e) => setManualForm((f) => ({ ...f, duration: Number(e.target.value) as Duration }))}
                className={inputClass + " w-full"}
                style={{ borderColor: "var(--border)" }}
              >
                <option value={60}>1 godzina</option>
                <option value={90}>1 godzina 30 minut</option>
                <option value={120}>2 godziny</option>
              </select>
            </div>
            <div className="mb-3">
              <label className="block text-xs text-[var(--text-secondary)] mb-1">Imię i nazwisko</label>
              <input
                value={manualForm.fullName}
                onChange={(e) => setManualForm((f) => ({ ...f, fullName: e.target.value }))}
                className={inputClass + " w-full"}
                style={{ borderColor: "var(--border)" }}
              />
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs text-[var(--text-secondary)] mb-1">Telefon</label>
                <input
                  value={manualForm.phone}
                  onChange={(e) => setManualForm((f) => ({ ...f, phone: e.target.value }))}
                  className={inputClass + " w-full"}
                  style={{ borderColor: "var(--border)" }}
                />
              </div>
              <div>
                <label className="block text-xs text-[var(--text-secondary)] mb-1">E-mail</label>
                <input
                  value={manualForm.email}
                  onChange={(e) => setManualForm((f) => ({ ...f, email: e.target.value }))}
                  className={inputClass + " w-full"}
                  style={{ borderColor: "var(--border)" }}
                />
              </div>
            </div>

            {manualError && (
              <p className="text-xs mb-3" style={{ color: "#c0392b" }}>
                {manualError}
              </p>
            )}

            <div className="flex gap-2.5 mt-4">
              <button
                type="button"
                onClick={handleManualSubmit}
                className="flex-1 rounded-lg px-4 py-2.5 text-sm font-medium text-white"
                style={{ background: "var(--ink)" }}
              >
                Dodaj rezerwację
              </button>
              <button
                type="button"
                onClick={() => setManualOpen(false)}
                className="flex-1 rounded-lg px-4 py-2.5 text-sm font-medium border"
                style={{ borderColor: "var(--border-strong)" }}
              >
                Anuluj
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
