export interface BookingFormValues {
  fullName: string;
  phone: string;
  email: string;
  message?: string;
  acceptRules: boolean;
}

export interface FormErrors {
  fullName?: string;
  phone?: string;
  email?: string;
  acceptRules?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+0-9\s()-]{7,20}$/;

export function validateBookingForm(values: BookingFormValues): FormErrors {
  const errors: FormErrors = {};

  if (!values.fullName || values.fullName.trim().length < 3) {
    errors.fullName = "Podaj imię i nazwisko (min. 3 znaki).";
  }

  if (!values.phone || !PHONE_RE.test(values.phone.trim())) {
    errors.phone = "Podaj poprawny numer telefonu.";
  }

  if (!values.email || !EMAIL_RE.test(values.email.trim())) {
    errors.email = "Podaj poprawny adres e-mail.";
  }

  if (!values.acceptRules) {
    errors.acceptRules = "Musisz zaakceptować zasady rezerwacji.";
  }

  return errors;
}

export function hasErrors(errors: FormErrors): boolean {
  return Object.values(errors).some(Boolean);
}
