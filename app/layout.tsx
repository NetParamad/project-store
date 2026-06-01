import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { CartProvider } from "@/components/cart-provider";
import { ColorThemeProvider } from "@/components/color-theme-provider";
import "./globals.css";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Project Store",
  description: "Your personal project store",
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" suppressHydrationWarning>
      <body className={`${geistSans.className} antialiased`} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ColorThemeProvider>
          <CartProvider>
            <div className="min-h-screen flex flex-col pb-16 md:pb-0">
              <Header />
              <main className="flex-1">
                {children}
              </main>
              <Suspense fallback={null}><Footer /></Suspense>
              <Suspense fallback={null}><MobileBottomNav /></Suspense>
            </div>
          </CartProvider>
          </ColorThemeProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
