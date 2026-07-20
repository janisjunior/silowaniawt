import { NextRequest, NextResponse } from "next/server";
import { bookingsToCsv, listBookings } from "@/lib/store";
import { isAuthenticated } from "@/lib/auth";
import { BookingStatus } from "@/lib/types";

export async function GET(req: NextRequest) {
  const authed = await isAuthenticated();
  if (!authed) return NextResponse.json({ error: "Brak autoryzacji." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") || undefined;
  const dateFrom = searchParams.get("dateFrom") || undefined;
  const dateTo = searchParams.get("dateTo") || undefined;
  const name = searchParams.get("name") || undefined;
  const status = (searchParams.get("status") as BookingStatus | null) || undefined;

  const bookings = await listBookings({ date, dateFrom, dateTo, name, status });
  const csv = bookingsToCsv(bookings);

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="rezerwacje_${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
