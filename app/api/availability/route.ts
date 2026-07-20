import { NextRequest, NextResponse } from "next/server";
import { getSlotsForDate, isDateBookable } from "@/lib/store";
import { Duration } from "@/lib/types";

// GET /api/availability?month=YYYY-MM&duration=60
// Zwraca mapę dzień -> czy istnieje choć jeden wolny termin.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month"); // YYYY-MM
  const durationParam = Number(searchParams.get("duration") || "60");

  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json({ error: "Nieprawidłowy parametr month." }, { status: 400 });
  }

  const [year, m] = month.split("-").map(Number);
  const daysInMonth = new Date(year, m, 0).getDate();

  const availability: Record<string, boolean> = {};

  for (let day = 1; day <= daysInMonth; day++) {
    const dateIso = `${year}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    if (!(await isDateBookable(dateIso))) {
      availability[dateIso] = false;
      continue;
    }
    const slots = await getSlotsForDate(dateIso, durationParam as Duration);
    availability[dateIso] = slots.some((s) => s.available > 0);
  }

  return NextResponse.json({ month, duration: durationParam, availability });
}
