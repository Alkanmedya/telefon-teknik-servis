import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Teknik Servis Pro - Telefon Tamir Yönetim Sistemi",
  description: "Profesyonel telefon teknik servis yönetim paneli. Cihaz takibi, stok yönetimi, müşteri ilişkileri ve finansal raporlama.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
