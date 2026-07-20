// Wszystkie typy domenowe aplikacji rezerwacji siłowni.

export type Duration = 60 | 90 | 120; // minuty

export type BookingStatus =
  | "oczekujaca"
  | "potwierdzona"
  | "anulowana"
  | "zakonczona"
  | "nieobecnosc";

export interface Booking {
  id: string;
  cancelToken: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  duration: Duration;
  seats: number; // liczba rezerwowanych miejsc (domyślnie 1)
  fullName: string;
  phone: string;
  email: string;
  message?: string;
  status: BookingStatus;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

export interface BookingHistoryEntry {
  id: string;
  bookingId: string;
  action: string;
  detail: string;
  actor: "user" | "admin" | "system";
  timestamp: string; // ISO
}

// Godziny otwarcia dla jednego dnia tygodnia
export interface DayHours {
  enabled: boolean;
  open: string; // HH:mm
  close: string; // HH:mm
  capacity: number; // liczba miejsc na każdą jednostkę godzinową
}

export type WeekSchedule = Record<
  0 | 1 | 2 | 3 | 4 | 5 | 6, // 0 = niedziela ... 6 = sobota
  DayHours
>;

export interface Break {
  id: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  label: string;
}

export interface ClosedDay {
  date: string; // YYYY-MM-DD
  reason?: string;
}

export interface Settings {
  weekSchedule: WeekSchedule;
  closedDays: ClosedDay[];
  breaks: Break[];
  minAdvanceMinutes: number; // minimalny czas przed rezerwacją
  maxAdvanceDays: number; // maksymalne wyprzedzenie w dniach
  slotStepMinutes: number; // co ile minut generowane są sloty startowe (np. 60)
  companyName: string;
  facilityName: string;
  rulesText: string;
}

export interface TimeSlot {
  time: string; // HH:mm
  capacity: number;
  booked: number;
  available: number;
  status: "available" | "low" | "full";
}
