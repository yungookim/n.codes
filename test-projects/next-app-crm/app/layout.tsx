import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import Sidebar from "./components/Sidebar";

export const metadata: Metadata = {
  title: "CRMhub - Mini CRM",
  description: "A lightweight CRM for managing contacts and deals",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="app-layout">
          <Sidebar />
          <main className="main-content">{children}</main>
        </div>
        <Script src="/ncodes-widget.js" strategy="beforeInteractive" />
        <Script id="ncodes-init" strategy="afterInteractive">{`
          NCodes.init({
            user: { id: '1', name: 'Demo User' },
            mode: 'simulation',
            theme: 'dark',
          });
        `}</Script>
      </body>
    </html>
  );
}
