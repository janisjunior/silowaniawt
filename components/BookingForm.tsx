"use client";

import { FormEvent, useState } from "react";
import { FormErrors, hasErrors, validateBookingForm } from "@/lib/validation";

interface BookingFormProps {
  onSubmit: (values: {
    fullName: string;
    phone: string;
    email: string;
    message: string;
    acceptRules: boolean;
  }) => Promise<void>;
  submitting: boolean;
  serverError: string | null;
}

export default function BookingForm({ onSubmit, submitting, serverError }: BookingFormProps) {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [acceptRules, setAcceptRules] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const values = { fullName, phone, email, message, acceptRules };
    const validation = validateBookingForm(values);
    setErrors(validation);
    setTouched(true);
    if (hasErrors(validation)) return;
    await onSubmit(values);
  }

  const fieldClass = (hasError: boolean) =>
    `w-full rounded-lg border px-3 py-2.5 text-sm focus-ring outline-none transition-colors bg-[var(--surface)]`;

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div>
        <label htmlFor="fullName" className="block text-sm font-medium mb-1.5">
          Imię i nazwisko
        </label>
        <input
          id="fullName"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className={fieldClass(!!errors.fullName)}
          style={{ borderColor: touched && errors.fullName ? "#c0392b" : "var(--border)" }}
          placeholder="Jan Kowalski"
          autoComplete="name"
        />
        {touched && errors.fullName && (
          <p className="text-xs mt-1" style={{ color: "#c0392b" }}>
            {errors.fullName}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="phone" className="block text-sm font-medium mb-1.5">
            Numer telefonu
          </label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={fieldClass(!!errors.phone)}
            style={{ borderColor: touched && errors.phone ? "#c0392b" : "var(--border)" }}
            placeholder="+48 600 000 000"
            autoComplete="tel"
          />
          {touched && errors.phone && (
            <p className="text-xs mt-1" style={{ color: "#c0392b" }}>
              {errors.phone}
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
            className={fieldClass(!!errors.email)}
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
          className={fieldClass(false)}
          style={{ borderColor: "var(--border)", resize: "vertical" }}
          placeholder="Dodatkowe informacje dla siłowni"
        />
      </div>

      <div>
        <label className="flex items-start gap-2.5 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={acceptRules}
            onChange={(e) => setAcceptRules(e.target.checked)}
            className="mt-0.5 w-4 h-4 focus-ring"
          />
          <span>Akceptuję zasady rezerwacji i regulamin obiektu.</span>
        </label>
        {touched && errors.acceptRules && (
          <p className="text-xs mt-1" style={{ color: "#c0392b" }}>
            {errors.acceptRules}
          </p>
        )}
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
