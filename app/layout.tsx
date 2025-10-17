import type React from "react";
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { ADLaM_Display } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { Suspense } from "react";
import { ThemeProvider } from "@/components/theme-provider";

const adlamDisplay = ADLaM_Display({
  subsets: ["latin"],
  variable: "--font-adlam",
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "MinistryGo",
  description: "MinistryGo is a platform for creating collaborative ministry games and sharing prayer requests for large and small groups",
  icons: "/mgpro_logo_sm.ico",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <meta name="theme-color" content="#FCD34D" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body className={`font-sans ${adlamDisplay.variable} ${GeistSans.variable} ${GeistMono.variable}`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <Suspense fallback={null}>{children}</Suspense>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
