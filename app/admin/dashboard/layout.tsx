import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import LogoutButton from "@/components/admin/LogoutButton";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const authed = await isAuthenticated();
  if (!authed) redirect("/admin");

  return (
    <div className="flex-1 flex flex-col" style={{ background: "var(--paper)" }}>
      <header className="border-b" style={{ borderColor: "var(--border)" }}>
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-[var(--text-muted)]">Panel administratora</p>
            <h1 className="text-base font-semibold">Siłownia — zarządzanie rezerwacjami</h1>
          </div>
          <LogoutButton />
        </div>
      </header>
      <main className="flex-1 max-w-6xl w-full mx-auto px-5 sm:px-8 py-6">{children}</main>
    </div>
  );
}
