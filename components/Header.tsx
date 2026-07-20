"use client";

import { useState } from "react";
import Image from "next/image";

interface HeaderProps {
  companyName: string;
  facilityName: string;
  rulesText: string;
}

export default function Header({ companyName, facilityName, rulesText }: HeaderProps) {
  const [rulesOpen, setRulesOpen] = useState(false);

  return (
    <header className="w-full border-b" style={{ borderColor: "var(--border)" }}>
      <div className="max-w-5xl mx-auto px-5 sm:px-8 py-10 sm:py-14 flex flex-col items-center text-center">
        <Image
          src="/logo.png"
          alt={companyName}
          width={191}
          height={120}
          className="h-16 sm:h-20 w-auto"
          priority
        />

        <p
          className="mt-4 text-xs sm:text-sm font-medium tracking-[0.2em] uppercase"
          style={{ color: "var(--text-secondary)" }}
        >
          {companyName}
        </p>
        <h1 className="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight">{facilityName}</h1>

        <div className="mt-5">
          <button
            type="button"
            onClick={() => setRulesOpen((v) => !v)}
            className="text-sm text-[var(--text-secondary)] underline underline-offset-2 focus-ring rounded"
          >
            {rulesOpen ? "Ukryj zasady rezerwacji" : "Zasady rezerwacji"}
          </button>
          {rulesOpen && (
            <p className="mt-3 text-sm text-[var(--text-secondary)] leading-relaxed max-w-md mx-auto">
              {rulesText}
            </p>
          )}
        </div>
      </div>
    </header>
  );
}
