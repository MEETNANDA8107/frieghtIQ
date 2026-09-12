import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FreightIQ | Maritime Intelligence Platform",
  description: "AI-powered maritime freight forecasting and procurement decision platform for dry bulk commodity importers.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </head>
      <body style={{ margin: 0, padding: 0, fontFamily: "'Inter', -apple-system, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
