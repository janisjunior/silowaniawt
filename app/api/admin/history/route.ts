import { NextRequest, NextResponse } from "next/server";
import { getHistory, listBookings } from "@/lib/store";
import { isAuthenticated } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const authed = await isAuthenticated();
  if (!authed) return NextResponse.json({ error: "Brak autoryzacji." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const bookingId = searchParams.get("bookingId") || undefined;

  const history = await getHistory(bookingId);
  const bookings = await listBookings();
  const bookingMap = new Map(bookings.map((b) => [b.id, b]));

  const enriched = history.map((h) => ({
    ...h,
    bookingLabel: bookingMap.has(h.bookingId)
      ? `${bookingMap.get(h.bookingId)!.fullName} — ${bookingMap.get(h.bookingId)!.date} ${
          bookingMap.get(h.bookingId)!.startTime
        }`
      : h.bookingId,
  }));

  return NextResponse.json({ history: enriched });
}
