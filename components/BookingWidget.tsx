"use client";

import { useEffect, useMemo, useState } from "react";
import { Booking, Duration, Settings, TimeSlot } from "@/lib/types";
import CalendarPicker from "./CalendarPicker";
import DurationSelector from "./DurationSelector";
import TimeSlotList from "./TimeSlotList";
import BookingSummary from "./BookingSummary";
import BookingForm from "./BookingForm";
import SuccessScreen from "./SuccessScreen";

type Step = "select" | "form" | "success";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function BookingWidget({ settings }: { settings: Settings }) {
  const [step, setStep] = useState<Step>("select");
  const [date, setDate] = useState(todayIso());
  const [duration, setDuration] = useState<Duration>(60);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [dateBookable, setDateBookable] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standardowy wzorzec ładowania danych: reset stanu przed fetchem
    setSlotsLoading(true);
    setSelectedTime(null);
    fetch(`/api/slots?date=${date}&duration=${duration}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setSlots(data.slots || []);
        setDateBookable(!!data.bookable);
      })
      .finally(() => !cancelled && setSlotsLoading(false));
    return () => {
      cancelled = true;
    };
  }, [date, duration]);

  const canProceed = useMemo(() => !!selectedTime, [selectedTime]);

  async function handleFormSubmit(values: { participants: string; email: string; message: string }) {
    setSubmitting(true);
    setServerError(null);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          startTime: selectedTime,
          duration,
          ...values,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setServerError(data.error || "Nie udało się dokonać rezerwacji.");
        return;
      }
      setConfirmedBooking(data.booking);
      setStep("success");
    } catch {
      setServerError("Wystąpił błąd połączenia. Spróbuj ponownie.");
    } finally {
      setSubmitting(false);
    }
  }

  function startOver() {
    setStep("select");
    setSelectedTime(null);
    setConfirmedBooking(null);
    setServerError(null);
  }

  if (step === "success" && confirmedBooking) {
    return (
      <div className="max-w-5xl mx-auto px-5 sm:px-8 py-10">
        <SuccessScreen booking={confirmedBooking} facilityName={settings.facilityName} onStartOver={startOver} />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-5 sm:px-8 py-8 sm:py-10">
      {/* Wskaźnik kroku — widoczny głównie na telefonie */}
      <p className="text-xs font-medium text-[var(--text-muted)] mb-4 sm:hidden">
        {step === "select" ? "Krok 1 z 2 — wybór terminu" : "Krok 2 z 2 — dane rezerwacji"}
      </p>

      {step === "select" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          <div>
            <CalendarPicker selectedDate={date} duration={duration} onSelectDate={setDate} />
          </div>

          <div className="space-y-6">
            <DurationSelector value={duration} onChange={setDuration} />
            <div>
              <p className="text-sm font-medium mb-2">Dostępne godziny</p>
              <TimeSlotList
                slots={slots}
                selectedTime={selectedTime}
                onSelect={setSelectedTime}
                loading={slotsLoading}
                dateBookable={dateBookable}
              />
            </div>

            <button
              type="button"
              disabled={!canProceed}
              onClick={() => setStep("form")}
              className="w-full rounded-lg px-4 py-3 text-sm font-medium text-white focus-ring disabled:opacity-40 transition-opacity"
              style={{ background: "var(--ink)" }}
            >
              Dalej — podaj dane
            </button>
          </div>
        </div>
      )}

      {step === "form" && selectedTime && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          <div className="order-2 lg:order-1">
            <button
              type="button"
              onClick={() => setStep("select")}
              className="text-sm text-[var(--text-secondary)] underline underline-offset-2 mb-4 focus-ring rounded"
            >
              &#8592; Wróć do wyboru terminu
            </button>
            <BookingForm onSubmit={handleFormSubmit} submitting={submitting} serverError={serverError} />
          </div>
          <div className="order-1 lg:order-2">
            <BookingSummary date={date} time={selectedTime} duration={duration} />
          </div>
        </div>
      )}
    </div>
  );
}
