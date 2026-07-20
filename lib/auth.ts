import { cookies } from "next/headers";

// Bardzo prosty mechanizm logowania administratora oparty na cookie.
// W wersji produkcyjnej należy zastąpić to prawdziwym systemem
// uwierzytelniania (np. NextAuth) i hasłem hashowanym w bazie danych.

const SESSION_COOKIE = "gym_admin_session";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "silownia123";
const SESSION_VALUE = "authenticated";

export function checkPassword(password: string): boolean {
  return password === ADMIN_PASSWORD;
}

export async function createSession() {
  const store = await cookies();
  store.set(SESSION_COOKIE, SESSION_VALUE, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8, // 8 godzin
  });
}

export async function destroySession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function isAuthenticated(): Promise<boolean> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value === SESSION_VALUE;
}
