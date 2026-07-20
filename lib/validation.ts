export interface BookingFormValues {
  participants: string;
  email: string;
  message?: string;
}

export interface FormErrors {
  participants?: string;
  email?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateBookingForm(values: BookingFormValues): FormErrors {
  const errors: FormErrors = {};

  if (!values.participants || values.participants.trim().length < 2) {
    errors.participants = "Podaj imiona uczestników.";
  }

  if (!values.email || !EMAIL_RE.test(values.email.trim())) {
    errors.email = "Podaj poprawny adres e-mail.";
  }

  return errors;
}

export function hasErrors(errors: FormErrors): boolean {
  return Object.values(errors).some(Boolean);
}
