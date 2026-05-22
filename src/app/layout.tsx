import type { Metadata, Viewport } from "next";
import { Poppins, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth/auth-provider";
import { TRPCProvider } from "@/lib/trpc/provider";
import { Navbar } from "@/components/layout/navbar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { ScrollReset } from "@/components/scroll-reset";

const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-poppins",
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
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
  themeColor: "#FFFFFF",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} ${inter.variable} ${jetbrainsMono.variable} antialiased`}
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
