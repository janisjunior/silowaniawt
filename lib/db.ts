import { Pool } from "pg";

// -----------------------------------------------------------------------
// Pula połączeń do Postgresa (np. darmowa baza Neon) + samoczynne
// tworzenie schematu przy pierwszym użyciu. Dzięki temu nie jest
// potrzebne osobne narzędzie do migracji — wystarczy ustawić DATABASE_URL
// i aplikacja sama przygotuje potrzebne tabele przy pierwszym zapytaniu.
// -----------------------------------------------------------------------

const globalForDb = globalThis as unknown as { __pgPool?: Pool; __schemaReady?: Promise<void> };

function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "Brak zmiennej środowiskowej DATABASE_URL. Ustaw ją na connection string z Neon (lub innej bazy Postgres)."
    );
  }
  const isLocal = connectionString.includes("localhost") || connectionString.includes("127.0.0.1");
  return new Pool({
    connectionString,
    ssl: isLocal ? undefined : { rejectUnauthorized: false },
    max: 5,
  });
}

export function getPool(): Pool {
  if (!globalForDb.__pgPool) {
    globalForDb.__pgPool = createPool();
  }
  return globalForDb.__pgPool;
}

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY,
  cancel_token TEXT UNIQUE NOT NULL,
  date TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  duration INTEGER NOT NULL,
  seats INTEGER NOT NULL DEFAULT 1,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS bookings_date_idx ON bookings (date);

CREATE TABLE IF NOT EXISTS history_entries (
  id TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL,
  action TEXT NOT NULL,
  detail TEXT NOT NULL,
  actor TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS history_booking_idx ON history_entries (booking_id);

CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  data JSONB NOT NULL
);
`;

export async function ensureSchema(): Promise<void> {
  if (!globalForDb.__schemaReady) {
    globalForDb.__schemaReady = getPool()
      .query(SCHEMA_SQL)
      .then(() => undefined);
  }
  await globalForDb.__schemaReady;
}
