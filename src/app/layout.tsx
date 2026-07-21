import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "C&G Global Ordering Portal",
  description: "Wholesale ordering for C&G Global accounts.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
