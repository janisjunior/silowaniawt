"use client";

import { useEffect, useState } from "react";
import { Duration } from "@/lib/types";

interface CalendarPickerProps {
  selectedDate: string; // YYYY-MM-DD
  duration: Duration;
  onSelectDate: (date: string) => void;
}

const WEEKDAY_LABELS = ["pon", "wto", "śro", "czw", "pią", "sob", "nie"];
const MONTH_LABELS = [
  "styczeń",
  "luty",
  "marzec",
  "kwiecień",
  "maj",
  "czerwiec",
  "lipiec",
  "sierpień",
  "wrzesień",
  "październik",
  "listopad",
  "grudzień",
];

function toIso(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function CalendarPicker({ selectedDate, duration, onSelectDate }: CalendarPickerProps) {
  const initial = new Date(`${selectedDate}T00:00:00`);
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth() + 1); // 1-12
  const [availability, setAvailability] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standardowy wzorzec ładowania danych: reset stanu przed fetchem
    setLoading(true);
    const month = `${viewYear}-${String(viewMonth).padStart(2, "0")}`;
    fetch(`/api/availability?month=${month}&duration=${duration}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setAvailability(data.availability || {});
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [viewYear, viewMonth, duration]);

  const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();
  const firstDow = (new Date(viewYear, viewMonth - 1, 1).getDay() + 6) % 7; // 0 = poniedziałek

  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  function goToMonth(delta: number) {
    let m = viewMonth + delta;
    let y = viewYear;
    if (m > 12) {
      m = 1;
      y += 1;
    } else if (m < 1) {
      m = 12;
      y -= 1;
    }
    setViewMonth(m);
    setViewYear(y);
  }

  function goToToday() {
    const t = new Date();
    setViewYear(t.getFullYear());
    setViewMonth(t.getMonth() + 1);
    onSelectDate(todayIso());
  }

  async function goToNextAvailable() {
    const res = await fetch(`/api/next-available?duration=${duration}`);
    const data = await res.json();
    if (data.date) {
      const d = new Date(`${data.date}T00:00:00`);
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth() + 1);
      onSelectDate(data.date);
    }
  }

  return (
    <div className="rounded-xl border p-4 sm:p-5" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() => goToMonth(-1)}
          aria-label="Poprzedni miesiąc"
          className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-black/5 focus-ring"
        >
          <i className="ti ti-chevron-left" aria-hidden="true" />
          &#8249;
        </button>
        <p className="font-medium capitalize">
          {MONTH_LABELS[viewMonth - 1]} {viewYear}
        </p>
        <button
          type="button"
          onClick={() => goToMonth(1)}
          aria-label="Następny miesiąc"
          className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-black/5 focus-ring"
        >
          &#8250;
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-[var(--text-muted)] mb-1">
        {WEEKDAY_LABELS.map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, idx) => {
          if (day === null) return <div key={`empty-${idx}`} />;
          const iso = toIso(viewYear, viewMonth, day);
          const isPast = iso < todayIso();
          const available = availability[iso];
          const isSelected = iso === selectedDate;
          const isToday = iso === todayIso();
          const disabled = isPast || (!loading && available === false);

          return (
            <button
              key={iso}
              type="button"
              disabled={disabled}
              onClick={() => onSelectDate(iso)}
              aria-current={isToday ? "date" : undefined}
              aria-pressed={isSelected}
              className="relative aspect-square rounded-full text-sm flex items-center justify-center focus-ring transition-colors"
              style={{
                background: isSelected ? "var(--ink)" : "transparent",
                color: disabled ? "var(--text-muted)" : isSelected ? "#fff" : "var(--text-primary)",
                textDecoration: disabled ? "line-through" : "none",
                cursor: disabled ? "not-allowed" : "pointer",
                fontWeight: isToday && !isSelected ? 600 : 400,
                border: isToday && !isSelected ? "1px solid var(--ink)" : "1px solid transparent",
              }}
              onMouseEnter={(e) => {
                if (!disabled && !isSelected) e.currentTarget.style.background = "var(--paper)";
              }}
              onMouseLeave={(e) => {
                if (!disabled && !isSelected) e.currentTarget.style.background = "transparent";
              }}
            >
              {day}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t" style={{ borderColor: "var(--border)" }}>
        <button
          type="button"
          onClick={goToToday}
          className="text-sm px-3 py-1.5 rounded-md border hover:bg-black/5 focus-ring"
          style={{ borderColor: "var(--border-strong)" }}
        >
          Dzisiaj
        </button>
        <button
          type="button"
          onClick={goToNextAvailable}
          className="text-sm px-3 py-1.5 rounded-md border hover:bg-black/5 focus-ring"
          style={{ borderColor: "var(--border-strong)" }}
        >
          Najbliższy wolny termin
        </button>
      </div>
    </div>
  );
}
