"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Nieprawidłowe hasło.");
        return;
      }
      router.push("/admin/dashboard");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center px-5" style={{ background: "var(--paper)" }}>
      <form
        onSubmit={handleSubmit}
        className="max-w-sm w-full rounded-xl border p-6"
        style={{ borderColor: "var(--border)", background: "var(--surface)" }}
      >
        <h1 className="text-lg font-semibold mb-1">Panel administratora</h1>
        <p className="text-sm text-[var(--text-secondary)] mb-5">Zaloguj się, aby zarządzać rezerwacjami.</p>

        <label htmlFor="password" className="block text-sm font-medium mb-1.5">
          Hasło
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border px-3 py-2.5 text-sm focus-ring outline-none mb-1"
          style={{ borderColor: "var(--border)" }}
          autoFocus
        />
        {error && (
          <p className="text-xs mb-3" style={{ color: "#c0392b" }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg px-4 py-2.5 text-sm font-medium text-white focus-ring disabled:opacity-60 mt-4"
          style={{ background: "var(--ink)" }}
        >
          {loading ? "Logowanie…" : "Zaloguj się"}
        </button>

        <p className="text-xs text-[var(--text-muted)] mt-4">
          Wersja demonstracyjna — domyślne hasło: <code>silownia123</code>
        </p>
      </form>
    </div>
  );
}
