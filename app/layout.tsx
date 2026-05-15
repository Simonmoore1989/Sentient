import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sentient — Execution Intelligence",
  description: "Shutdown planning and execution platform",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Sentient",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Sentient" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml"/>
        <link rel="apple-touch-icon" href="/icon.svg"/>
        <meta name="theme-color" content="#2ECC9A" />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}