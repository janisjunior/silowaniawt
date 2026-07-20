# Siłownia — kalendarz rezerwacji (Next.js + TypeScript)

Publiczny kalendarz rezerwacji siłowni — dostępny dla każdej osoby z linkiem,
bez zakładania konta — oraz prosty panel administratora.

## Uruchomienie

```bash
npm install
npm run dev
```

Aplikacja: http://localhost:3000
Panel admina: http://localhost:3000/admin (domyślne hasło: `silownia123`,
można je zmienić zmienną środowiskową `ADMIN_PASSWORD`)

## Ważne — przechowywanie danych w tej wersji

To jest wersja demonstracyjna/startowa: wszystkie rezerwacje i ustawienia
grafiku żyją **w pamięci procesu Node.js** (`lib/store.ts`) i znikają po
restarcie serwera. To najprostsze możliwe rozwiązanie, żeby aplikacja była
od razu w pełni działająca (prawdziwe tworzenie/anulowanie/edycja rezerwacji,
walidacja, blokowanie slotów).

Żeby przejść na produkcję, wystarczy podmienić funkcje w `lib/store.ts`
(np. `createBooking`, `listBookings`, `getSlotsForDate`) na zapytania do
prawdziwej bazy danych (np. Postgres + Prisma) — sygnatury funkcji i typy
w `lib/types.ts` są tak zaprojektowane, żeby reszta aplikacji (komponenty,
API routes) nie wymagała zmian.

Podobnie e-mail z potwierdzeniem/linkiem anulowania nie jest w tej wersji
faktycznie wysyłany (brak skonfigurowanego dostawcy poczty) — link do
anulowania rezerwacji jest generowany i widoczny na ekranie sukcesu
(`/anuluj/[token]`). W produkcji wystarczy dodać wysyłkę e-maila (np. Resend,
SendGrid) w miejscu, gdzie `createBooking` zwraca nową rezerwację
(`app/api/bookings/route.ts`).

Logowanie administratora korzysta z prostego cookie sesyjnego i jednego
hasła (zmienna `ADMIN_PASSWORD`) — do podmiany na docelowy system
uwierzytelniania w produkcji.

## Struktura projektu

```
app/
  page.tsx                 — widok publiczny (kalendarz rezerwacji)
  anuluj/[token]/page.tsx  — publiczna strona anulowania rezerwacji
  admin/page.tsx           — logowanie administratora
  admin/dashboard/         — panel administratora (rezerwacje, grafik, historia)
  api/                     — endpointy API (sloty, rezerwacje, ustawienia, admin)
components/                — komponenty widoku użytkownika
components/admin/          — komponenty panelu administratora
lib/
  types.ts                 — typy domenowe
  store.ts                 — dane w pamięci + logika biznesowa (sloty, rezerwacje)
  auth.ts                  — logowanie administratora (cookie)
  validation.ts             — walidacja formularza rezerwacji
```

## Zaimplementowana logika biznesowa

- Administrator ustala godziny otwarcia i liczbę miejsc osobno dla każdego dnia tygodnia.
- Liczba wolnych miejsc zmniejsza się po każdej rezerwacji i wraca po anulowaniu.
- Rezerwacja dłuższa niż 1 godzina automatycznie blokuje kolejne przedziały godzinowe.
- Nie można zarezerwować terminu z przeszłości ani poza oknem min./maks. wyprzedzenia.
- Podwójne wysłanie tego samego formularza (ten sam e-mail + termin) w ciągu 10 sekund jest blokowane.
- Każda rezerwacja ma unikalny token do anulowania przez indywidualny link.
- Przerwy techniczne wyłączają odpowiadające im sloty.
- Wszystkie zmiany rezerwacji są zapisywane w historii (widoczna w panelu admina).

## Uwaga o czcionce

W tym środowisku sandbox brak dostępu do Google Fonts podczas builda, więc
interfejs korzysta z systemowego stosu czcionek sans-serif. W środowisku
z dostępem do sieci można przywrócić `next/font/google` (np. Inter) w
`app/layout.tsx` bez żadnych innych zmian.
