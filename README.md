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

## Przechowywanie danych

Aplikacja korzysta z prawdziwej bazy **Postgres** (np. darmowy Neon) przez
lekki driver `pg` — bez Prisma czy innego ORM-a wymagającego pobierania
binarnych silników. Schemat tabel (`lib/db.ts`) tworzy się sam przy
pierwszym zapytaniu — nie trzeba ręcznie uruchamiać migracji.

Do lokalnego developmentu potrzebujesz zmiennej `DATABASE_URL` wskazującej
na dowolną bazę Postgres (lokalną albo np. darmowy projekt na Neon) —
patrz `.env.example`.

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

## Wdrożenie za darmo: GitHub + Neon + Vercel

Ten zestaw jest w 100% darmowy (bez karty kredytowej) i — w odróżnieniu od
wersji z danymi w pamięci — rezerwacje faktycznie się zapisują na stałe,
bo aplikacja korzysta z prawdziwej bazy Postgres.

### 1. Wrzuć kod na GitHub

Projekt ma już zainicjalizowane repozytorium git z pierwszym commitem.
Wystarczy podpiąć własny, pusty projekt z GitHuba:

```bash
cd gym-booking
git remote add origin https://github.com/TWOJA-NAZWA/gym-booking.git
git branch -M main
git push -u origin main
```

(Jeśli nie masz jeszcze pustego repozytorium — załóż je na github.com →
„New repository", bez zaznaczania „Add a README", żeby nie kolidowało
z plikami z tego projektu.)

### 2. Załóż darmową bazę na Neon

1. Wejdź na [neon.tech](https://neon.tech) i załóż konto (możesz zalogować się przez GitHub).
2. Utwórz nowy projekt (region wybierz najbliższy Polsce, np. Frankfurt/AWS eu-central-1).
3. W panelu projektu znajdź **Connection string** — będą dwie wersje:
   - **Pooled connection** (zawiera `-pooler` w adresie) → to będzie `DATABASE_URL`,
   - **Direct connection** (bez `-pooler`) → to będzie `DIRECT_URL`.
4. Skopiuj obie wartości — przydadzą się w kroku 3.

Nic więcej nie trzeba robić ręcznie — aplikacja sama utworzy potrzebne
tabele przy pierwszym uruchomieniu (patrz `lib/db.ts`).

### 3. Wdróż na Vercel

1. Wejdź na [vercel.com](https://vercel.com), zaloguj się przez GitHub.
2. „Add New…" → „Project" → wybierz repozytorium `gym-booking`.
3. Framework Preset wykryje się automatycznie jako Next.js — nic nie zmieniaj.
4. W sekcji **Environment Variables** dodaj:

   | Nazwa | Wartość |
   |---|---|
   | `DATABASE_URL` | pooled connection string z Neon |
   | `DIRECT_URL` | direct connection string z Neon |
   | `ADMIN_PASSWORD` | własne, silne hasło do panelu admina |

5. Kliknij **Deploy**. Po ok. minucie dostaniesz publiczny adres w stylu
   `https://gym-booking-xxxx.vercel.app`.

### 4. Pierwsze uruchomienie

- Otwórz `https://twoja-domena.vercel.app` — pierwsze żądanie samo utworzy
  tabele w bazie Neon i wstawi domyślne ustawienia grafiku.
- Wejdź na `/admin`, zaloguj się hasłem z `ADMIN_PASSWORD` i dostosuj
  godziny otwarcia, limity miejsc i teksty w zakładce „Grafik".
- Jeśli chcesz mieć dane demonstracyjne do testów, wywołaj raz funkcję
  `seedDemoBookingsIfEmpty()` z `lib/store.ts` (np. tymczasowo z poziomu
  jednego z API routes) — w wersji produkcyjnej możesz to pominąć.

### Późniejsze zmiany w kodzie

Każdy `git push` na branch `main` automatycznie uruchamia nowe wdrożenie
na Vercel — nic więcej nie trzeba klikać.

### Ograniczenia darmowych planów, o których warto wiedzieć

- **Vercel Hobby** jest formalnie przeznaczony do użytku niekomercyjnego
  (100 GB transferu i 1 mln wywołań funkcji miesięcznie — dla małej
  siłowni to bardzo dużo zapasu).
- **Neon Free** daje 0,5 GB miejsca i ok. 100 godzin obliczeniowych
  miesięcznie na projekt, baza „usypia" po okresie bezczynności i budzi
  się przy pierwszym zapytaniu (opóźnienie ok. pół sekundy) — dla ruchu
  typowego dla siłowni to niezauważalne.
