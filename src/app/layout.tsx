import type { Metadata, Viewport } from "next";
import { DM_Sans, Cardo } from "next/font/google";
import { Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth/auth-provider";
import { TRPCProvider } from "@/lib/trpc/provider";
import { Navbar } from "@/components/layout/navbar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { ScrollReset } from "@/components/scroll-reset";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["400", "500", "600", "700"],
});

const cardo = Cardo({
  subsets: ["latin"],
  variable: "--font-cardo",
  weight: ["400", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://cadresports.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "CadreSports - Play. Compete. Connect.",
    template: "%s | CadreSports",
  },
  description: "India's multi-sport league platform. Join badminton, football leagues near you. Compete in tournaments, track standings, and connect with players in Mumbai, Delhi, Pune, Bangalore, Chennai & more.",
  keywords: ["sports league", "badminton league", "football league", "tournament", "India", "Mumbai", "Delhi", "Pune", "Bangalore", "Chennai", "Hyderabad", "CadreSports", "sports platform"],
  authors: [{ name: "CadreSports" }],
  creator: "CadreSports",
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: siteUrl,
    siteName: "CadreSports",
    title: "CadreSports - Play. Compete. Connect.",
    description: "India's multi-sport league platform. Join badminton & football leagues, compete in tournaments, and connect with players near you.",
    images: [{ url: "/logo.png", width: 512, height: 512, alt: "CadreSports Logo" }],
  },
  twitter: {
    card: "summary",
    title: "CadreSports - Play. Compete. Connect.",
    description: "India's multi-sport league platform. Join leagues, compete, and connect with players near you.",
    images: ["/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CadreSports",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#FFFEF7",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${cardo.variable} ${geistMono.variable} antialiased`}
    >
      <body className="bg-background text-foreground overflow-hidden">
        <AuthProvider>
          <TRPCProvider>
            <div className="relative h-dvh w-full flex flex-col">
              <Navbar />
              <ScrollReset />
              <main className="flex-1 overflow-y-auto overscroll-contain pb-16 md:pb-0">
                {children}
              </main>
              <BottomNav />
            </div>
          </TRPCProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
