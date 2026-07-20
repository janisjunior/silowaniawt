"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { Booking } from "@/lib/types";
import { formatDateLong } from "@/components/BookingSummary";

export default function CancelPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [booking, setBooking] = useState<Booking | null | undefined>(undefined);
  const [cancelling, setCancelling] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    fetch(`/api/bookings/cancel/${token}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => setBooking(data.booking))
      .catch(() => setBooking(null));
  }, [token]);

  async function handleCancel() {
    setCancelling(true);
    setError(null);
    try {
      const res = await fetch(`/api/bookings/cancel/${token}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Nie udało się anulować rezerwacji.");
        return;
      }
      setBooking(data.booking);
      setCancelled(true);
    } finally {
      setCancelling(false);
    }
  }

  return (
    <div className="flex-1 flex flex-col" style={{ background: "var(--paper)" }}>
      <main className="flex-1 flex items-center justify-center px-5 py-10">
        <div className="max-w-md w-full">
          {booking === undefined && <p className="text-center text-sm text-[var(--text-secondary)]">Ładowanie…</p>}

          {booking === null && (
            <div className="text-center">
              <h1 className="text-xl font-semibold mb-2">Nie znaleziono rezerwacji</h1>
              <p className="text-sm text-[var(--text-secondary)] mb-6">
                Link może być nieprawidłowy lub rezerwacja została już usunięta.
              </p>
              <Link href="/" className="text-sm underline underline-offset-2">
                Wróć do strony rezerwacji
              </Link>
            </div>
          )}

          {booking && (
            <div
              className="rounded-xl border p-5 sm:p-6"
              style={{ borderColor: "var(--border)", background: "var(--surface)" }}
            >
              <h1 className="text-xl font-semibold mb-1">
                {booking.status === "anulowana" ? "Rezerwacja anulowana" : "Twoja rezerwacja"}
              </h1>
              <p className="text-sm text-[var(--text-secondary)] mb-5">
                {formatDateLong(booking.date)}, godz. {booking.startTime}–{booking.endTime}
              </p>

              <dl className="space-y-2 text-sm mb-6">
                <div className="flex justify-between gap-4">
                  <dt className="text-[var(--text-secondary)]">Numer rezerwacji</dt>
                  <dd className="font-medium">{booking.id}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-[var(--text-secondary)]">Status</dt>
                  <dd className="font-medium capitalize">{booking.status}</dd>
                </div>
              </dl>

              {error && (
                <div
                  role="alert"
                  className="rounded-lg border px-3 py-2.5 text-sm mb-4"
                  style={{ borderColor: "#e3b3ad", background: "#fbeeec", color: "#8a2f24" }}
                >
                  {error}
                </div>
              )}

              {booking.status === "anulowana" || cancelled ? (
                <p className="text-sm" style={{ color: "var(--status-available-text)" }}>
                  Ta rezerwacja została anulowana. Miejsce jest ponownie dostępne dla innych osób.
                </p>
              ) : confirmOpen ? (
                <div className="space-y-3">
                  <p className="text-sm">Czy na pewno chcesz anulować tę rezerwację? Tej operacji nie można cofnąć.</p>
                  <div className="flex gap-2.5">
                    <button
                      type="button"
                      onClick={handleCancel}
                      disabled={cancelling}
                      className="flex-1 rounded-lg px-4 py-2.5 text-sm font-medium text-white focus-ring disabled:opacity-60"
                      style={{ background: "#c0392b" }}
                    >
                      {cancelling ? "Anulowanie…" : "Tak, anuluj rezerwację"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmOpen(false)}
                      className="flex-1 rounded-lg px-4 py-2.5 text-sm font-medium border focus-ring"
                      style={{ borderColor: "var(--border-strong)" }}
                    >
                      Nie, zostaw
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmOpen(true)}
                  className="w-full rounded-lg px-4 py-2.5 text-sm font-medium border focus-ring"
                  style={{ borderColor: "var(--border-strong)", color: "#c0392b" }}
                >
                  Anuluj rezerwację
                </button>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
