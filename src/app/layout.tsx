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

export const metadata: Metadata = {
  title: "CadreSports - Play. Compete. Connect.",
  description: "Join sports leagues, compete in tournaments, and connect with players near you.",
  manifest: "/manifest.json",
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
