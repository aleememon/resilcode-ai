import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ResilCode AI — Automated Security & 1-Click Repair for AI-Generated Code",
  description:
    "Scan React, Next.js, Express, and Python apps for OWASP vulnerabilities. Detect hardcoded secrets, injection vectors, and broken access controls—then patch them instantly with synthetic precision.",
  applicationName: "ResilCode AI",
  keywords: [
    "application security",
    "OWASP",
    "AI code security",
    "static analysis",
    "vulnerability remediation",
    "developer security",
  ],
  openGraph: {
    title: "ResilCode AI — Security for AI-Generated Code",
    description:
      "Automated security and 1-click repair for vibe-coded web apps. OWASP coverage with AST + LLM precision.",
    type: "website",
    siteName: "ResilCode AI",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a0e17",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        {/* Apply the saved theme before first paint to avoid a flash of the wrong palette. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              '(function(){try{var t=localStorage.getItem("aegis-theme");var d=document.documentElement;if(t==="light"){d.classList.remove("dark");d.classList.add("light");}}catch(e){}})();',
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font -- App Router loads these once globally */}
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@500;600&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap"
          rel="stylesheet"
        />
        {/* eslint-disable-next-line @next/next/no-page-custom-font -- App Router loads these once globally */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-surface-container-lowest font-body-md text-body-md text-on-surface antialiased">
        {children}
      </body>
    </html>
  );
}
