import type { Metadata, Viewport } from "next";
import "./globals.css";

const siteUrl = "https://sitecare-pulse1.pages.dev";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "SiteCare Pulse — Client Care Operations for Web Agencies",
    template: "%s | SiteCare Pulse"
  },
  description: "A focused workspace for web agencies to organise client websites, service requests, team activity, SLA targets, and monthly work reports.",
  applicationName: "SiteCare Pulse",
  keywords: ["web agency operations", "website care", "client service requests", "agency workflow", "SLA tracking"],
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "SiteCare Pulse",
    title: "SiteCare Pulse — Client Care Operations for Web Agencies",
    description: "Organise client websites, service requests, team activity, and monthly work reports in one agency workspace."
  },
  twitter: {
    card: "summary",
    title: "SiteCare Pulse — Client Care Operations for Web Agencies",
    description: "A focused workspace for web agencies to manage ongoing client care."
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true }
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#167d68",
  colorScheme: "light"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
