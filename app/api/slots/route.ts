import { NextRequest, NextResponse } from "next/server";
import { getSlotsForDate, isDateBookable } from "@/lib/store";
import { Duration } from "@/lib/types";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const durationParam = Number(searchParams.get("duration") || "60");

  if (!date) {
    return NextResponse.json({ error: "Brak parametru date." }, { status: 400 });
  }
  if (![60, 90, 120].includes(durationParam)) {
    return NextResponse.json({ error: "Nieprawidłowy czas trwania." }, { status: 400 });
  }

  const bookable = await isDateBookable(date);
  const slots = bookable ? await getSlotsForDate(date, durationParam as Duration) : [];

  return NextResponse.json({ date, duration: durationParam, bookable, slots });
}
