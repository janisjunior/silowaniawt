import { Booking } from "./types";

// -----------------------------------------------------------------------
// Wysyłka e-maili przez Resend (https://resend.com) — REST API, bez
// dodatkowej zależności npm. Wymaga zmiennej środowiskowej RESEND_API_KEY
// oraz zweryfikowanej domeny nadawcy w panelu Resend.
// -----------------------------------------------------------------------

const FROM_ADDRESS = "WT GYM <reminder@wheeltrade.pl>";

const MONTH_LABELS = [
  "stycznia", "lutego", "marca", "kwietnia", "maja", "czerwca",
  "lipca", "sierpnia", "września", "października", "listopada", "grudnia",
];
const WEEKDAY_LABELS = ["niedziela", "poniedziałek", "wtorek", "środa", "czwartek", "piątek", "sobota"];

function formatDateLong(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return `${WEEKDAY_LABELS[d.getDay()]}, ${d.getDate()} ${MONTH_LABELS[d.getMonth()]} ${d.getFullYear()}`;
}

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("RESEND_API_KEY nie jest ustawiony — pomijam wysyłkę e-maila.");
    return;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM_ADDRESS, to, subject, html }),
    });
    if (!res.ok) {
      const text = await res.text();
      console.error("Resend: błąd wysyłki e-maila", res.status, text);
    }
  } catch (err) {
    console.error("Resend: wyjątek podczas wysyłki e-maila", err);
  }
}

export async function sendBookingConfirmationEmail(
  booking: Booking,
  facilityName: string,
  siteOrigin: string
): Promise<void> {
  const cancelUrl = `${siteOrigin}/anuluj/${booking.cancelToken}`;
  const subject = `Potwierdzenie rezerwacji — ${facilityName}, ${booking.date} ${booking.startTime}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #14161a;">
      <h2 style="margin-bottom: 4px;">Rezerwacja potwierdzona</h2>
      <p style="color: #5c5f66; margin-top: 0;">${facilityName}</p>
      <table style="width: 100%; font-size: 14px; margin: 16px 0;">
        <tr><td style="color: #5c5f66; padding: 4px 0;">Data</td><td style="text-align: right;">${formatDateLong(booking.date)}</td></tr>
        <tr><td style="color: #5c5f66; padding: 4px 0;">Godzina</td><td style="text-align: right;">${booking.startTime}–${booking.endTime}</td></tr>
        <tr><td style="color: #5c5f66; padding: 4px 0;">Uczestnicy</td><td style="text-align: right;">${booking.fullName}</td></tr>
        <tr><td style="color: #5c5f66; padding: 4px 0;">Numer rezerwacji</td><td style="text-align: right;">${booking.id}</td></tr>
      </table>
      <p style="font-size: 14px;">Jeśli chcesz odwołać rezerwację, kliknij poniższy link:</p>
      <p><a href="${cancelUrl}" style="display: inline-block; background: #0b1220; color: #fff; padding: 10px 18px; border-radius: 8px; text-decoration: none; font-size: 14px;">Anuluj rezerwację</a></p>
      <p style="font-size: 12px; color: #8b8e94; margin-top: 24px;">Wiadomość wysłana automatycznie, prosimy na nią nie odpowiadać.</p>
    </div>
  `;

  await sendEmail(booking.email, subject, html);
}

export async function sendCancellationEmail(
  booking: Booking,
  facilityName: string
): Promise<void> {
  const subject = `Rezerwacja anulowana — ${facilityName}, ${booking.date} ${booking.startTime}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #14161a;">
      <h2 style="margin-bottom: 4px;">Rezerwacja anulowana</h2>
      <p style="color: #5c5f66; margin-top: 0;">${facilityName}</p>
      <p style="font-size: 14px;">Twoja rezerwacja na ${formatDateLong(booking.date)}, godz. ${booking.startTime}–${booking.endTime} została anulowana. Termin jest teraz ponownie dostępny.</p>
      <p style="font-size: 12px; color: #8b8e94; margin-top: 24px;">Wiadomość wysłana automatycznie, prosimy na nią nie odpowiadać.</p>
    </div>
  `;
  await sendEmail(booking.email, subject, html);
}
