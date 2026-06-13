import type { Metadata, Viewport } from "next";
import { DM_Sans, Space_Mono, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/layout/Providers";
import { Toaster } from "react-hot-toast";

const displayFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700", "800"],
});

const bodyFont = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["300", "400", "500", "600"],
});

const monoFont = Space_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "VitaConnect – Telehealth Platform",
    template: "%s | VitaConnect",
  },
  description:
    "Connect with doctors instantly, sync your health data from Health Connect, and manage your complete wellness journey.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "VitaConnect",
  },
  formatDetection: { telephone: true, email: true },
  keywords: ["telehealth", "telemedicine", "doctor", "health connect", "medical"],
  authors: [{ name: "VitaConnect" }],
  openGraph: {
    title: "VitaConnect – Telehealth",
    description: "Your health, connected.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)",  color: "#0a0f1e" },
    { media: "(prefers-color-scheme: light)", color: "#0a8ce8" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        {/* Digital Asset Links for TWA */}
        <link rel="assetlinks" href="/.well-known/assetlinks.json" />
      </head>
      <body
        className={`${displayFont.variable} ${bodyFont.variable} ${monoFont.variable} font-sans antialiased`}
      >
        <Providers>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "#0d1f3d",
                color: "#e6f4ff",
                border: "1px solid rgba(10,140,232,0.2)",
                borderRadius: "12px",
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
