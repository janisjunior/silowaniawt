const MONTH_LABELS = [
  "stycznia",
  "lutego",
  "marca",
  "kwietnia",
  "maja",
  "czerwca",
  "lipca",
  "sierpnia",
  "września",
  "października",
  "listopada",
  "grudnia",
];
const WEEKDAY_LABELS = ["niedziela", "poniedziałek", "wtorek", "środa", "czwartek", "piątek", "sobota"];

function formatDateLong(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return `${WEEKDAY_LABELS[d.getDay()]}, ${d.getDate()} ${MONTH_LABELS[d.getMonth()]} ${d.getFullYear()}`;
}

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  const nh = Math.floor(total / 60) % 24;
  const nm = total % 60;
  return `${String(nh).padStart(2, "0")}:${String(nm).padStart(2, "0")}`;
}

interface BookingSummaryProps {
  date: string;
  time: string;
  duration: number;
}

export default function BookingSummary({ date, time, duration }: BookingSummaryProps) {
  const endTime = addMinutes(time, duration);
  const durationLabel = duration === 60 ? "1 godzina" : duration === 90 ? "1 godzina 30 minut" : "2 godziny";

  const rows: [string, string][] = [
    ["Data", formatDateLong(date)],
    ["Godzina rozpoczęcia", time],
    ["Godzina zakończenia", endTime],
    ["Czas trwania", durationLabel],
  ];

  return (
    <div className="rounded-xl border p-4 sm:p-5" style={{ borderColor: "var(--border)", background: "var(--paper)" }}>
      <p className="text-sm font-medium mb-3">Podsumowanie</p>
      <dl className="space-y-2">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-baseline justify-between gap-4 text-sm">
            <dt className="text-[var(--text-secondary)]">{label}</dt>
            <dd className="font-medium text-right">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export { formatDateLong, addMinutes };
