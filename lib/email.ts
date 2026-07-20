import nodemailer from "nodemailer";
import { Booking } from "./types";

// -----------------------------------------------------------------------
// Wysyłka e-maili przez zwykłe SMTP istniejącej skrzynki reminder@wheeltrade.pl
// (hosting LH.pl). Wymaga zmiennych środowiskowych:
//   SMTP_HOST     — np. c513.lh.pl (numer serwera z panelu klienta LH.pl)
//   SMTP_PORT     — 465 (SSL) lub 587 (STARTTLS)
//   SMTP_SECURE   — "true" dla portu 465, "false" dla 587
//   SMTP_USER     — pełen adres skrzynki, np. reminder@wheeltrade.pl
//   SMTP_PASSWORD — hasło do tej skrzynki
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

let cachedTransporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || "465");
  const secure = (process.env.SMTP_SECURE ?? "true") === "true";
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;

  if (!host || !user || !pass) {
    return null;
  }

  if (!cachedTransporter) {
    cachedTransporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    });
  }
  return cachedTransporter;
}

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const transporter = getTransporter();
  if (!transporter) {
    console.warn("Brak konfiguracji SMTP (SMTP_HOST/SMTP_USER/SMTP_PASSWORD) — pomijam wysyłkę e-maila.");
    return;
  }

  try {
    await transporter.sendMail({ from: FROM_ADDRESS, to, subject, html });
  } catch (err) {
    console.error("SMTP: błąd wysyłki e-maila", err);
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
