import { getPool, ensureSchema } from "./db";
import {
  Booking,
  BookingHistoryEntry,
  BookingStatus,
  Break,
  ClosedDay,
  Duration,
  Settings,
  TimeSlot,
  WeekSchedule,
} from "./types";

// -----------------------------------------------------------------------
// Warstwa dostępu do danych oparta o prawdziwą bazę Postgres (np. darmowy
// Neon). Zastępuje wcześniejszą wersję z danymi w pamięci — sygnatury
// funkcji zostały zachowane tam, gdzie to możliwe, więc reszta aplikacji
// (API routes) wymagała tylko dodania `await`.
// -----------------------------------------------------------------------

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDaysIso(daysFromToday: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromToday);
  return d.toISOString().slice(0, 10);
}

const defaultWeekSchedule: WeekSchedule = {
  0: { enabled: false, open: "08:00", close: "20:00", capacity: 6 },
  1: { enabled: true, open: "07:00", close: "21:00", capacity: 6 },
  2: { enabled: true, open: "07:00", close: "21:00", capacity: 6 },
  3: { enabled: true, open: "07:00", close: "21:00", capacity: 6 },
  4: { enabled: true, open: "07:00", close: "21:00", capacity: 6 },
  5: { enabled: true, open: "07:00", close: "20:00", capacity: 6 },
  6: { enabled: true, open: "09:00", close: "16:00", capacity: 4 },
};

function defaultSettings(): Settings {
  return {
    weekSchedule: defaultWeekSchedule,
    closedDays: [],
    breaks: [],
    minAdvanceMinutes: 60,
    maxAdvanceDays: 30,
    slotStepMinutes: 60,
    companyName: "WT GYM",
    facilityName: "Siłownia",
    rulesText:
      "Rezerwacja obowiązuje na wybraną godzinę. Prosimy o przybycie 5 minut wcześniej. Spóźnienie powyżej 15 minut oznacza utratę rezerwacji.",
  };
}

// Zapewnia, że schemat istnieje i że wiersz z ustawieniami jest zainicjalizowany.
// Bezpieczne do wywoływania wielokrotnie (idempotentne).
async function ensureReady(): Promise<void> {
  await ensureSchema();
  const pool = getPool();
  const existing = await pool.query("SELECT 1 FROM settings WHERE id = 1");
  if (existing.rowCount === 0) {
    await pool.query("INSERT INTO settings (id, data) VALUES (1, $1) ON CONFLICT (id) DO NOTHING", [
      JSON.stringify(defaultSettings()),
    ]);
  }
}

// ---------------------------------------------------------------------
// Ustawienia
// ---------------------------------------------------------------------

export async function getSettings(): Promise<Settings> {
  await ensureReady();
  const res = await getPool().query("SELECT data FROM settings WHERE id = 1");
  return res.rows[0].data as Settings;
}

export async function updateSettings(partial: Partial<Settings>): Promise<Settings> {
  const current = await getSettings();
  const next = { ...current, ...partial };
  await getPool().query("UPDATE settings SET data = $1 WHERE id = 1", [JSON.stringify(next)]);
  return next;
}

// ---------------------------------------------------------------------
// Pomocnicze operacje na czasie
// ---------------------------------------------------------------------

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60)
    .toString()
    .padStart(2, "0");
  const m = (mins % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

function dayOfWeek(dateIso: string): 0 | 1 | 2 | 3 | 4 | 5 | 6 {
  return new Date(`${dateIso}T00:00:00`).getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6;
}

// ---------------------------------------------------------------------
// Mapowanie wierszy bazy danych na typy domenowe
// ---------------------------------------------------------------------

interface BookingRow {
  id: string;
  cancel_token: string;
  date: string;
  start_time: string;
  end_time: string;
  duration: number;
  seats: number;
  full_name: string;
  phone: string;
  email: string;
  message: string;
  status: string;
  created_at: Date;
  updated_at: Date;
}

function rowToBooking(row: BookingRow): Booking {
  return {
    id: row.id,
    cancelToken: row.cancel_token,
    date: row.date,
    startTime: row.start_time,
    endTime: row.end_time,
    duration: row.duration as Duration,
    seats: row.seats,
    fullName: row.full_name,
    phone: row.phone,
    email: row.email,
    message: row.message,
    status: row.status as BookingStatus,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

// ---------------------------------------------------------------------
// Dostępność / sloty
// ---------------------------------------------------------------------

export async function isDateBookable(dateIso: string): Promise<boolean> {
  const settings = await getSettings();
  const today = todayIso();
  if (dateIso < today) return false;

  const maxDate = addDaysIso(settings.maxAdvanceDays);
  if (dateIso > maxDate) return false;

  if (settings.closedDays.some((c) => c.date === dateIso)) return false;

  const dow = dayOfWeek(dateIso);
  const hours = settings.weekSchedule[dow];
  if (!hours.enabled) return false;

  return true;
}

export async function getSlotsForDate(dateIso: string, duration: Duration): Promise<TimeSlot[]> {
  const settings = await getSettings();
  if (!(await isDateBookable(dateIso))) return [];

  const dow = dayOfWeek(dateIso);
  const hours = settings.weekSchedule[dow];
  const openMin = timeToMinutes(hours.open);
  const closeMin = timeToMinutes(hours.close);
  const step = settings.slotStepMinutes;

  const dayBreaks = settings.breaks.filter((b) => b.date === dateIso);

  const bookingsRes = await getPool().query<BookingRow>(
    "SELECT * FROM bookings WHERE date = $1 AND status <> 'anulowana'",
    [dateIso]
  );
  const dayBookings = bookingsRes.rows.map(rowToBooking);

  const now = new Date();
  const isToday = dateIso === todayIso();
  const minStart = new Date(now.getTime() + settings.minAdvanceMinutes * 60000);

  const slots: TimeSlot[] = [];

  for (let start = openMin; start + duration <= closeMin; start += step) {
    const end = start + duration;
    const startTime = minutesToTime(start);
    const endTime = minutesToTime(end);

    if (isToday) {
      const slotDateTime = new Date(`${dateIso}T${startTime}:00`);
      if (slotDateTime < minStart) continue;
    }

    const collidesWithBreak = dayBreaks.some((b) => {
      const bStart = timeToMinutes(b.startTime);
      const bEnd = timeToMinutes(b.endTime);
      return start < bEnd && end > bStart;
    });
    if (collidesWithBreak) continue;

    // Każdy termin może mieć tylko JEDNĄ aktywną rezerwację — niezależnie
    // od ustawionego "capacity" (które zostaje w ustawieniach na przyszłość,
    // ale nie decyduje już o liczbie miejsc).
    let takenByEmail: string | undefined;
    for (let unit = start; unit < end; unit += step) {
      const unitStart = unit;
      const unitEnd = unit + step;
      const overlapping = dayBookings.find((b) => {
        const bStart = timeToMinutes(b.startTime);
        const bEnd = timeToMinutes(b.endTime);
        return bStart < unitEnd && bEnd > unitStart;
      });
      if (overlapping) {
        takenByEmail = overlapping.email;
        break;
      }
    }

    const available = takenByEmail ? 0 : 1;
    const status: TimeSlot["status"] = available === 0 ? "full" : "available";

    slots.push({
      time: startTime,
      capacity: hours.capacity,
      booked: takenByEmail ? 1 : 0,
      available,
      status,
      bookedByEmail: takenByEmail,
    });
  }

  return slots;
}

export async function findNextAvailableDate(duration: Duration, fromDate?: string): Promise<string | null> {
  const start = fromDate ?? todayIso();
  for (let i = 0; i < 60; i++) {
    const d = new Date(`${start}T00:00:00`);
    d.setDate(d.getDate() + i);
    const iso = d.toISOString().slice(0, 10);
    const slots = await getSlotsForDate(iso, duration);
    if (slots.some((s) => s.available > 0)) return iso;
  }
  return null;
}

// ---------------------------------------------------------------------
// Rezerwacje
// ---------------------------------------------------------------------

function genId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export interface CreateBookingInput {
  date: string;
  startTime: string;
  duration: Duration;
  fullName: string;
  phone: string;
  email: string;
  message?: string;
}

export type CreateBookingResult = { ok: true; booking: Booking } | { ok: false; error: string };

// Ochrona przed podwójnym wysłaniem tego samego formularza (ten sam
// e-mail + data + godzina w ciągu ostatnich 10 sekund). Trzymana w pamięci
// procesu — wystarczające dla tego celu, nie wymaga tabeli w bazie.
const recentSubmissions = new Map<string, number>();

export async function createBooking(input: CreateBookingInput): Promise<CreateBookingResult> {
  if (!(await isDateBookable(input.date))) {
    return { ok: false, error: "Wybrany termin nie jest już dostępny." };
  }

  const dedupeKey = `${input.email.toLowerCase()}|${input.date}|${input.startTime}`;
  const lastSubmit = recentSubmissions.get(dedupeKey);
  if (lastSubmit && Date.now() - lastSubmit < 10000) {
    return { ok: false, error: "Ta rezerwacja została już wysłana. Sprawdź swoją skrzynkę e-mail." };
  }

  const slots = await getSlotsForDate(input.date, input.duration);
  const slot = slots.find((s) => s.time === input.startTime);
  if (!slot || slot.available <= 0) {
    return { ok: false, error: "Brak wolnych miejsc w wybranym terminie." };
  }

  recentSubmissions.set(dedupeKey, Date.now());

  const startMin = timeToMinutes(input.startTime);
  const endTime = minutesToTime(startMin + input.duration);

  const booking: Booking = {
    id: genId("bkg"),
    cancelToken: genId("tok"),
    date: input.date,
    startTime: input.startTime,
    endTime,
    duration: input.duration,
    seats: 1,
    fullName: input.fullName.trim(),
    phone: input.phone.trim(),
    email: input.email.trim(),
    message: input.message?.trim() || "",
    status: "potwierdzona",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await getPool().query(
    `INSERT INTO bookings
      (id, cancel_token, date, start_time, end_time, duration, seats, full_name, phone, email, message, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
    [
      booking.id,
      booking.cancelToken,
      booking.date,
      booking.startTime,
      booking.endTime,
      booking.duration,
      booking.seats,
      booking.fullName,
      booking.phone,
      booking.email,
      booking.message,
      booking.status,
    ]
  );

  await addHistory(booking.id, "utworzono", `Rezerwacja utworzona na ${input.date} ${input.startTime}`, "user");

  return { ok: true, booking };
}

export async function getBookingById(id: string): Promise<Booking | undefined> {
  const res = await getPool().query<BookingRow>("SELECT * FROM bookings WHERE id = $1", [id]);
  return res.rows[0] ? rowToBooking(res.rows[0]) : undefined;
}

export async function getBookingByCancelToken(token: string): Promise<Booking | undefined> {
  const res = await getPool().query<BookingRow>("SELECT * FROM bookings WHERE cancel_token = $1", [token]);
  return res.rows[0] ? rowToBooking(res.rows[0]) : undefined;
}

export async function cancelBooking(id: string, actor: "user" | "admin" = "user"): Promise<CreateBookingResult> {
  const booking = await getBookingById(id);
  if (!booking) return { ok: false, error: "Nie znaleziono rezerwacji." };
  if (booking.status === "anulowana") return { ok: false, error: "Ta rezerwacja jest już anulowana." };

  await getPool().query("UPDATE bookings SET status = 'anulowana', updated_at = now() WHERE id = $1", [id]);
  await addHistory(id, "anulowano", "Rezerwacja anulowana", actor);

  const updated = await getBookingById(id);
  return { ok: true, booking: updated! };
}

export interface UpdateBookingInput {
  fullName?: string;
  phone?: string;
  email?: string;
  message?: string;
  status?: BookingStatus;
  date?: string;
  startTime?: string;
  duration?: Duration;
}

const FIELD_TO_COLUMN: Record<string, string> = {
  fullName: "full_name",
  phone: "phone",
  email: "email",
  message: "message",
  status: "status",
  date: "date",
  startTime: "start_time",
  duration: "duration",
};

export async function updateBooking(id: string, patch: UpdateBookingInput): Promise<CreateBookingResult> {
  const booking = await getBookingById(id);
  if (!booking) return { ok: false, error: "Nie znaleziono rezerwacji." };

  const setClauses: string[] = [];
  const values: unknown[] = [];
  const changes: string[] = [];

  (Object.keys(patch) as (keyof UpdateBookingInput)[]).forEach((key) => {
    const newVal = patch[key];
    const column = FIELD_TO_COLUMN[key];
    if (newVal !== undefined && column) {
      values.push(newVal);
      setClauses.push(`${column} = $${values.length}`);
      changes.push(`${key}: "${String((booking as unknown as Record<string, unknown>)[key])}" -> "${newVal}"`);
    }
  });

  if (patch.startTime && patch.duration) {
    const endTime = minutesToTime(timeToMinutes(patch.startTime) + patch.duration);
    values.push(endTime);
    setClauses.push(`end_time = $${values.length}`);
  }

  if (setClauses.length > 0) {
    values.push(id);
    await getPool().query(
      `UPDATE bookings SET ${setClauses.join(", ")}, updated_at = now() WHERE id = $${values.length}`,
      values
    );
  }

  if (changes.length > 0) {
    await addHistory(id, "edycja", changes.join("; "), "admin");
  }

  const updated = await getBookingById(id);
  return { ok: true, booking: updated! };
}

export async function markAttendance(id: string, attended: boolean): Promise<CreateBookingResult> {
  return updateBooking(id, { status: attended ? "zakonczona" : "nieobecnosc" });
}

export interface ListBookingsFilter {
  date?: string;
  dateFrom?: string;
  dateTo?: string;
  name?: string;
  status?: BookingStatus;
}

export async function listBookings(filter: ListBookingsFilter = {}): Promise<Booking[]> {
  const conditions: string[] = [];
  const values: unknown[] = [];

  if (filter.date) {
    values.push(filter.date);
    conditions.push(`date = $${values.length}`);
  }
  if (filter.dateFrom) {
    values.push(filter.dateFrom);
    conditions.push(`date >= $${values.length}`);
  }
  if (filter.dateTo) {
    values.push(filter.dateTo);
    conditions.push(`date <= $${values.length}`);
  }
  if (filter.name) {
    values.push(`%${filter.name.toLowerCase()}%`);
    conditions.push(`LOWER(full_name) LIKE $${values.length}`);
  }
  if (filter.status) {
    values.push(filter.status);
    conditions.push(`status = $${values.length}`);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const res = await getPool().query<BookingRow>(
    `SELECT * FROM bookings ${where} ORDER BY date, start_time`,
    values
  );
  return res.rows.map(rowToBooking);
}

export async function createManualBooking(input: CreateBookingInput): Promise<CreateBookingResult> {
  const slots = await getSlotsForDate(input.date, input.duration);
  const slot = slots.find((s) => s.time === input.startTime);
  const hasCapacity = slot ? slot.available > 0 : true;
  if (!hasCapacity) {
    return { ok: false, error: "Brak wolnych miejsc w wybranym terminie." };
  }

  const startMin = timeToMinutes(input.startTime);
  const endTime = minutesToTime(startMin + input.duration);

  const booking: Booking = {
    id: genId("bkg"),
    cancelToken: genId("tok"),
    date: input.date,
    startTime: input.startTime,
    endTime,
    duration: input.duration,
    seats: 1,
    fullName: input.fullName.trim(),
    phone: input.phone.trim(),
    email: input.email.trim(),
    message: input.message?.trim() || "",
    status: "potwierdzona",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await getPool().query(
    `INSERT INTO bookings
      (id, cancel_token, date, start_time, end_time, duration, seats, full_name, phone, email, message, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
    [
      booking.id,
      booking.cancelToken,
      booking.date,
      booking.startTime,
      booking.endTime,
      booking.duration,
      booking.seats,
      booking.fullName,
      booking.phone,
      booking.email,
      booking.message,
      booking.status,
    ]
  );

  await addHistory(booking.id, "utworzono (admin)", "Rezerwacja dodana ręcznie przez administratora", "admin");

  return { ok: true, booking };
}

// ---------------------------------------------------------------------
// Historia zmian
// ---------------------------------------------------------------------

async function addHistory(bookingId: string, action: string, detail: string, actor: "user" | "admin" | "system") {
  await getPool().query(
    "INSERT INTO history_entries (id, booking_id, action, detail, actor) VALUES ($1,$2,$3,$4,$5)",
    [genId("hist"), bookingId, action, detail, actor]
  );
}

export async function getHistory(bookingId?: string): Promise<BookingHistoryEntry[]> {
  const query = bookingId
    ? { text: "SELECT * FROM history_entries WHERE booking_id = $1 ORDER BY timestamp DESC", values: [bookingId] }
    : { text: "SELECT * FROM history_entries ORDER BY timestamp DESC", values: [] };

  const res = await getPool().query(query.text, query.values);
  return res.rows.map((r) => ({
    id: r.id,
    bookingId: r.booking_id,
    action: r.action,
    detail: r.detail,
    actor: r.actor,
    timestamp: r.timestamp.toISOString(),
  }));
}

// ---------------------------------------------------------------------
// Eksport CSV
// ---------------------------------------------------------------------

export function bookingsToCsv(bookings: Booking[]): string {
  const header = [
    "ID",
    "Data",
    "Godzina rozpoczecia",
    "Godzina zakonczenia",
    "Czas trwania (min)",
    "Imie i nazwisko",
    "Telefon",
    "Email",
    "Status",
    "Wiadomosc",
    "Utworzono",
  ];
  const rows = bookings.map((b) => [
    b.id,
    b.date,
    b.startTime,
    b.endTime,
    String(b.duration),
    b.fullName,
    b.phone,
    b.email,
    b.status,
    (b.message || "").replace(/\n/g, " "),
    b.createdAt,
  ]);

  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  return [header, ...rows].map((r) => r.map(escape).join(",")).join("\n");
}

// ---------------------------------------------------------------------
// Dane demonstracyjne (opcjonalne) — wywoływane ręcznie z panelu admina
// lub raz po pierwszym wdrożeniu, żeby mieć na czym testować.
// ---------------------------------------------------------------------

export async function seedDemoBookingsIfEmpty(): Promise<void> {
  await ensureReady();
  const res = await getPool().query("SELECT COUNT(*) FROM bookings");
  if (Number(res.rows[0].count) > 0) return;

  const today = todayIso();
  await getPool().query(
    `INSERT INTO bookings
      (id, cancel_token, date, start_time, end_time, duration, seats, full_name, phone, email, message, status)
     VALUES
      ('bkg_seed_1','seed-token-1',$1,'09:00','10:00',60,1,'Anna Kowalska','+48 600 111 222','anna.kowalska@example.com','','potwierdzona'),
      ('bkg_seed_2','seed-token-2',$1,'18:00','19:30',90,1,'Piotr Nowak','+48 600 333 444','piotr.nowak@example.com','Pierwszy raz, proszę o kontakt przed treningiem.','oczekujaca')
     ON CONFLICT (id) DO NOTHING`,
    [today]
  );
}

export { todayIso, addDaysIso };
