import type { Metadata } from "next";
import { Manrope, Sora } from "next/font/google";
import "@belezafoco/ui/styles.css";
import "./globals.css";

const sora = Sora({
  variable: "--font-heading",
  subsets: ["latin"],
});

const manrope = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BELEZAFOCO 2.0",
  description: "Agenda, WhatsApp, Pix e financeiro premium para negocios de beleza."
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${sora.variable} ${manrope.variable} editorial-gradient antialiased`}>
        <div className="min-h-screen">{children}</div>
      </body>
    </html>
  );
}
