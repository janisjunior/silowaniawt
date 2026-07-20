import { NextRequest, NextResponse } from "next/server";
import { cancelBooking, getBookingById, updateBooking } from "@/lib/store";
import { isAuthenticated } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authed = await isAuthenticated();
  if (!authed) return NextResponse.json({ error: "Brak autoryzacji." }, { status: 401 });

  const { id } = await params;
  const booking = await getBookingById(id);
  if (!booking) return NextResponse.json({ error: "Nie znaleziono rezerwacji." }, { status: 404 });
  return NextResponse.json({ booking });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authed = await isAuthenticated();
  if (!authed) return NextResponse.json({ error: "Brak autoryzacji." }, { status: 401 });

  const { id } = await params;
  const patch = await req.json();

  if (patch.action === "cancel") {
    const result = await cancelBooking(id, "admin");
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ booking: result.booking });
  }

  const result = await updateBooking(id, patch);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ booking: result.booking });
}
