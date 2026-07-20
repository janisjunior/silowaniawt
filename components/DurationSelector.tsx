"use client";

import { Duration } from "@/lib/types";

interface DurationSelectorProps {
  value: Duration;
  onChange: (d: Duration) => void;
}

const OPTIONS: { value: Duration; label: string }[] = [
  { value: 60, label: "1 godzina" },
  { value: 90, label: "1 godzina 30 minut" },
  { value: 120, label: "2 godziny" },
];

export default function DurationSelector({ value, onChange }: DurationSelectorProps) {
  return (
    <div>
      <p className="text-sm font-medium mb-2">Czas trwania</p>
      <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Czas trwania rezerwacji">
        {OPTIONS.map((opt) => {
          const active = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(opt.value)}
              className="rounded-lg border px-3 py-2.5 text-sm font-medium focus-ring transition-colors"
              style={{
                borderColor: active ? "var(--ink)" : "var(--border)",
                background: active ? "var(--ink)" : "var(--surface)",
                color: active ? "#fff" : "var(--text-primary)",
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
