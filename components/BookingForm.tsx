"use client";

import { FormEvent, useState } from "react";
import { FormErrors, hasErrors, validateBookingForm } from "@/lib/validation";

interface BookingFormProps {
  onSubmit: (values: { participants: string; email: string; message: string }) => Promise<void>;
  submitting: boolean;
  serverError: string | null;
}

export default function BookingForm({ onSubmit, submitting, serverError }: BookingFormProps) {
  const [participants, setParticipants] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const values = { participants, email, message };
    const validation = validateBookingForm(values);
    setErrors(validation);
    setTouched(true);
    if (hasErrors(validation)) return;
    await onSubmit(values);
  }

  const fieldClass = "w-full rounded-lg border px-3 py-2.5 text-sm focus-ring outline-none transition-colors bg-[var(--surface)]";

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div>
        <label htmlFor="participants" className="block text-sm font-medium mb-1.5">
          Uczestnicy
        </label>
        <textarea
          id="participants"
          value={participants}
          onChange={(e) => setParticipants(e.target.value)}
          rows={2}
          className={fieldClass}
          style={{ borderColor: touched && errors.participants ? "#c0392b" : "var(--border)", resize: "vertical" }}
          placeholder="Imiona osób, które przyjdą, np. Jan, Kasia"
        />
        {touched && errors.participants && (
          <p className="text-xs mt-1" style={{ color: "#c0392b" }}>
            {errors.participants}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1.5">
          Adres e-mail
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={fieldClass}
          style={{ borderColor: touched && errors.email ? "#c0392b" : "var(--border)" }}
          placeholder="jan.kowalski@example.com"
          autoComplete="email"
        />
        {touched && errors.email && (
          <p className="text-xs mt-1" style={{ color: "#c0392b" }}>
            {errors.email}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-medium mb-1.5">
          Wiadomość <span className="text-[var(--text-muted)] font-normal">(opcjonalnie)</span>
        </label>
        <textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          className={fieldClass}
          style={{ borderColor: "var(--border)", resize: "vertical" }}
          placeholder="Dodatkowe informacje dla siłowni"
        />
      </div>

      {serverError && (
        <div
          role="alert"
          className="rounded-lg border px-3 py-2.5 text-sm"
          style={{ borderColor: "#e3b3ad", background: "#fbeeec", color: "#8a2f24" }}
        >
          {serverError}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg px-4 py-3 text-sm font-medium text-white transition-opacity focus-ring disabled:opacity-60"
        style={{ background: "var(--ink)" }}
      >
        {submitting ? "Wysyłanie…" : "Potwierdzam rezerwację"}
      </button>
    </form>
  );
}
