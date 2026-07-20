"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="text-sm px-3 py-1.5 rounded-md border hover:bg-black/5 focus-ring"
      style={{ borderColor: "var(--border-strong)" }}
    >
      Wyloguj się
    </button>
  );
}
