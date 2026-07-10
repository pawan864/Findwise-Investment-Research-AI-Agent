import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Research Desk — AI Investment Research Agent",
  description: "Give it a company name. It researches, reasons, and calls it: invest, pass, or watch.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
