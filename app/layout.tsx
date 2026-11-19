import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SiteCare Pulse — Website Care Operations for Agencies",
  description: "Manage client accounts, website portfolios, service requests, discussions, activity history, and monthly work reports in one agency workspace."
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