import { NextRequest, NextResponse } from "next/server";
import { createBooking, createManualBooking, listBookings, getSettings } from "@/lib/store";
import { isAuthenticated } from "@/lib/auth";
import { validateBookingForm } from "@/lib/validation";
import { BookingStatus, Duration } from "@/lib/types";
import { sendBookingConfirmationEmail } from "@/lib/email";

// GET /api/bookings — lista rezerwacji (panel admina), z filtrami
export async function GET(req: NextRequest) {
  const authed = await isAuthenticated();
  if (!authed) {
    return NextResponse.json({ error: "Brak autoryzacji." }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") || undefined;
  const dateFrom = searchParams.get("dateFrom") || undefined;
  const dateTo = searchParams.get("dateTo") || undefined;
  const name = searchParams.get("name") || undefined;
  const status = (searchParams.get("status") as BookingStatus | null) || undefined;

  const bookings = await listBookings({ date, dateFrom, dateTo, name, status });
  return NextResponse.json({ bookings });
}

// POST /api/bookings — utworzenie nowej rezerwacji (publiczne) lub
// rezerwacji ręcznej przez admina (gdy przesłano isManual: true)
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { date, startTime, duration, participants, fullName, phone, email, message, isManual } = body;

  if (isManual) {
    const authed = await isAuthenticated();
    if (!authed) {
      return NextResponse.json({ error: "Brak autoryzacji." }, { status: 401 });
    }
    const result = await createManualBooking({
      date,
      startTime,
      duration: duration as Duration,
      fullName,
      phone: phone || "",
      email,
      message,
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ booking: result.ok ? result.booking : null }, { status: 201 });
  }

  const errors = validateBookingForm({ participants, email, message });
  if (Object.values(errors).some(Boolean)) {
    return NextResponse.json({ error: "Formularz zawiera błędy.", fieldErrors: errors }, { status: 400 });
  }

  if (!date || !startTime || ![60, 90, 120].includes(Number(duration))) {
    return NextResponse.json({ error: "Nieprawidłowe dane rezerwacji." }, { status: 400 });
  }

  const result = await createBooking({
    date,
    startTime,
    duration: Number(duration) as Duration,
    fullName: participants,
    phone: "",
    email,
    message,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 409 });
  }

  const settings = await getSettings();
  const siteOrigin = req.nextUrl.origin;
  sendBookingConfirmationEmail(result.booking, settings.facilityName, siteOrigin).catch((err) =>
    console.error("Nie udało się wysłać e-maila z potwierdzeniem:", err)
  );

  return NextResponse.json({ booking: result.booking }, { status: 201 });
}
