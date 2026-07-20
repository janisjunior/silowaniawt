"use client";

import { useState } from "react";

interface HeaderProps {
  companyName: string;
  facilityName: string;
  rulesText: string;
}

export default function Header({ companyName, facilityName, rulesText }: HeaderProps) {
  const [rulesOpen, setRulesOpen] = useState(false);

  return (
    <header className="w-full border-b" style={{ borderColor: "var(--border)" }}>
      <div className="max-w-5xl mx-auto px-5 sm:px-8 py-6 sm:py-8">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold shrink-0"
            style={{ background: "var(--ink)", color: "#fff" }}
            aria-hidden="true"
          >
            {companyName
              .split(" ")
              .map((w) => w[0])
              .slice(0, 2)
              .join("")
              .toUpperCase()}
          </div>
          <div>
            <p className="text-sm text-[var(--text-secondary)] leading-tight">{companyName}</p>
            <h1 className="text-xl sm:text-2xl font-semibold leading-tight">{facilityName}</h1>
          </div>
        </div>

        <div className="mt-4">
          <button
            type="button"
            onClick={() => setRulesOpen((v) => !v)}
            className="text-sm text-[var(--text-secondary)] underline underline-offset-2 focus-ring rounded"
          >
            {rulesOpen ? "Ukryj zasady rezerwacji" : "Zasady rezerwacji"}
          </button>
          {rulesOpen && (
            <p className="mt-2 text-sm text-[var(--text-secondary)] leading-relaxed max-w-2xl">
              {rulesText}
            </p>
          )}
        </div>
      </div>
    </header>
  );
}
