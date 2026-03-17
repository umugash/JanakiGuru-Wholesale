import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "JG Wholesale",
  description: "Janaki Guru Enterprises - Wholesale Price Catalog",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "JG Wholesale",
  },
};

export const viewport: Viewport = {
  themeColor: "#b91c1c",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="JG Wholesale" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link rel="icon" href="/icon-192.png" />
      </head>
      <body style={{ margin: 0, padding: 0, background: "#fff9f9" }}>
        {children}
        <script dangerouslySetInnerHTML={{ __html: `
          // Register service worker for offline support
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
              navigator.serviceWorker.register('/sw.js').then(function(reg) {
                console.log('SW registered:', reg.scope);
              }).catch(function(err) {
                console.log('SW registration failed:', err);
              });
            });
          }

          // Push initial history entry so back button works inside app
          // instead of closing the app
          if (window.history.length <= 1) {
            window.history.pushState({ app: 'jg-wholesale' }, '', window.location.href);
          }
        `}} />
      </body>
    </html>
  );
}