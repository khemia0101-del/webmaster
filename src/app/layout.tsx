import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Insurance Website Concierge",
  description: "Build an insurance website through guided chat."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
