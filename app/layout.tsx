import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Siłownia — rezerwacja terminu | WT Fitness",
  description: "Zarezerwuj termin treningu w siłowni WT Fitness. Bez zakładania konta.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl" className="h-full">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
