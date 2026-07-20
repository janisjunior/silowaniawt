import { NextRequest, NextResponse } from "next/server";
import { cancelBooking, getBookingByCancelToken, getSettings } from "@/lib/store";
import { sendCancellationEmail } from "@/lib/email";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const booking = await getBookingByCancelToken(token);
  if (!booking) return NextResponse.json({ error: "Nie znaleziono rezerwacji." }, { status: 404 });
  return NextResponse.json({ booking });
}

export async function POST(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const booking = await getBookingByCancelToken(token);
  if (!booking) return NextResponse.json({ error: "Nie znaleziono rezerwacji." }, { status: 404 });

  const result = await cancelBooking(booking.id, "user");
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });

  const settings = await getSettings();
  sendCancellationEmail(result.booking, settings.facilityName).catch((err) =>
    console.error("Nie udało się wysłać e-maila o anulowaniu:", err)
  );

  return NextResponse.json({ booking: result.booking });
}
