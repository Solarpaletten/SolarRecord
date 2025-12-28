import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Solar Recorder - Local Screen Recording",
  description: "AI-powered screen recording with automatic transcription and translation",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
