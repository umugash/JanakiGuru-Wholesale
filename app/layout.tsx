import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Janaki Guru Enterprises - Wholesale",
  description: "Wholesale price list for Janaki Guru Enterprises, Thoothukudi.",
  manifest: "/manifest.json",
  themeColor: "#ef4444",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "JG Wholesale" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body>{children}</body>
    </html>
  );
}