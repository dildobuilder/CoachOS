import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CoachOS",
  description: "Workspace for personal trainers"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
