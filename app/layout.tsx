import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SiteCare Pulse — Agency Client Care",
  description: "The operations hub for website care teams and their clients."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}