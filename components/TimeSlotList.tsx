"use client";

import { TimeSlot } from "@/lib/types";

interface TimeSlotListProps {
  slots: TimeSlot[];
  selectedTime: string | null;
  onSelect: (time: string) => void;
  loading: boolean;
  dateBookable: boolean;
}

function statusStyles(status: TimeSlot["status"], selected: boolean) {
  if (selected) {
    return {
      background: "var(--status-selected-bg)",
      borderColor: "var(--status-selected-bg)",
      color: "var(--status-selected-text)",
    };
  }
  if (status === "full") {
    return {
      background: "var(--status-full-bg)",
      borderColor: "var(--status-full-border)",
      color: "var(--status-full-text)",
    };
  }
  return {
    background: "var(--surface)",
    borderColor: "var(--border)",
    color: "var(--text-primary)",
  };
}

export default function TimeSlotList({ slots, selectedTime, onSelect, loading, dateBookable }: TimeSlotListProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5" aria-hidden="true">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-16 rounded-lg animate-pulse" style={{ background: "var(--border)" }} />
        ))}
      </div>
    );
  }

  if (!dateBookable) {
    return (
      <p className="text-sm text-[var(--text-secondary)] py-6 text-center">
        Wybrany dzień jest niedostępny do rezerwacji. Wybierz inny dzień w kalendarzu.
      </p>
    );
  }

  if (slots.length === 0) {
    return (
      <p className="text-sm text-[var(--text-secondary)] py-6 text-center">
        Brak dostępnych godzin dla wybranego dnia i czasu trwania. Spróbuj wybrać inny dzień lub krótszy czas trwania.
      </p>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5" role="radiogroup" aria-label="Dostępne godziny">
        {slots.map((slot) => {
          const selected = slot.time === selectedTime;
          const disabled = slot.status === "full";
          const styles = statusStyles(slot.status, selected);
          return (
            <button
              key={slot.time}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={disabled}
              onClick={() => onSelect(slot.time)}
              className="rounded-lg border px-3 py-2.5 text-left focus-ring transition-colors"
              style={{
                ...styles,
                cursor: disabled ? "not-allowed" : "pointer",
              }}
            >
              <p className="text-base font-semibold leading-tight">{slot.time}</p>
              <p className="text-xs mt-0.5 leading-tight break-all" style={{ opacity: selected ? 0.85 : 1 }}>
                {slot.status === "full" ? `zajęte: ${slot.bookedByEmail ?? "—"}` : "dostępny"}
              </p>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-4 text-xs text-[var(--text-secondary)]">
        <LegendItem colorVar="var(--surface)" borderVar="var(--border)" label="dostępny" />
        <LegendItem colorVar="var(--status-full-bg)" borderVar="var(--status-full-border)" label="zajęty" />
        <LegendItem colorVar="var(--ink)" borderVar="var(--ink)" label="wybrany" />
      </div>
    </div>
  );
}

function LegendItem({ colorVar, borderVar, label }: { colorVar: string; borderVar: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className="inline-block w-3 h-3 rounded-sm border"
        style={{ background: colorVar, borderColor: borderVar }}
        aria-hidden="true"
      />
      {label}
    </span>
  );
}
