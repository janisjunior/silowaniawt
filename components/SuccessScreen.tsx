"use client";

import { Booking } from "@/lib/types";
import { formatDateLong } from "./BookingSummary";

interface SuccessScreenProps {
  booking: Booking;
  facilityName: string;
  onStartOver: () => void;
}

function buildIcs(booking: Booking, facilityName: string): string {
  const toIcsDate = (date: string, time: string) => `${date.replace(/-/g, "")}T${time.replace(":", "")}00`;
  const dtStart = toIcsDate(booking.date, booking.startTime);
  const dtEnd = toIcsDate(booking.date, booking.endTime);
  const now = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//WT Fitness//Rezerwacja silowni//PL",
    "BEGIN:VEVENT",
    `UID:${booking.id}@wt-fitness`,
    `DTSTAMP:${now}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:Rezerwacja - ${facilityName}`,
    `DESCRIPTION:Numer rezerwacji: ${booking.id}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export default function SuccessScreen({ booking, facilityName, onStartOver }: SuccessScreenProps) {
  function handleAddToCalendar() {
    const ics = buildIcs(booking, facilityName);
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rezerwacja-${booking.id}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const cancelUrl = `/anuluj/${booking.cancelToken}`;

  return (
    <div className="max-w-md mx-auto text-center py-4">
      <div
        className="w-14 h-14 rounded-full mx-auto mb-5 flex items-center justify-center"
        style={{ background: "var(--status-available-bg)", border: "1px solid var(--status-available-border)" }}
        aria-hidden="true"
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
          <path
            d="M5 13l4 4L19 7"
            stroke="var(--status-available-text)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <h2 className="text-xl font-semibold mb-1">Rezerwacja potwierdzona</h2>
      <p className="text-sm text-[var(--text-secondary)] mb-6">
        {formatDateLong(booking.date)}, godz. {booking.startTime}–{booking.endTime}
      </p>

      <div
        className="rounded-xl border p-4 mb-6 text-left"
        style={{ borderColor: "var(--border)", background: "var(--paper)" }}
      >
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-[var(--text-secondary)]">Numer rezerwacji</dt>
            <dd className="font-medium">{booking.id}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-[var(--text-secondary)]">Potwierdzenie e-mail</dt>
            <dd className="font-medium text-right">wysłane na {booking.email}</dd>
          </div>
        </dl>
      </div>

      <div className="flex flex-col sm:flex-row gap-2.5">
        <button
          type="button"
          onClick={handleAddToCalendar}
          className="flex-1 rounded-lg px-4 py-3 text-sm font-medium text-white focus-ring"
          style={{ background: "var(--ink)" }}
        >
          Dodaj do kalendarza
        </button>
        <a
          href={cancelUrl}
          className="flex-1 rounded-lg px-4 py-3 text-sm font-medium border text-center focus-ring"
          style={{ borderColor: "var(--border-strong)" }}
        >
          Anuluj rezerwację
        </a>
      </div>

      <button
        type="button"
        onClick={onStartOver}
        className="mt-6 text-sm text-[var(--text-secondary)] underline underline-offset-2 focus-ring rounded"
      >
        Zarezerwuj kolejny termin
      </button>
    </div>
  );
}
