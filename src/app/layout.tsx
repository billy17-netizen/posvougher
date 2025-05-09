import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { LoadingProvider } from '@/contexts/LoadingContext';
import { StoreProvider } from '@/contexts/StoreContext';
import ClientLayout from "@/components/ClientLayout";
import SmoothScroll from "@/components/SmoothScroll";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "POS Vougher - Sistem Kasir Modern",
  description: "Aplikasi Point of Sale (POS) dengan desain neu brutalism menggunakan Next.js dan PostgreSQL",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClientLayout interVariable={inter.variable} geistSansVariable={GeistSans.variable} geistMonoVariable={GeistMono.variable}>
      <LoadingProvider>
        <StoreProvider>
          <SettingsProvider>
            <SmoothScroll>
              {children}
            </SmoothScroll>
          </SettingsProvider>
        </StoreProvider>
      </LoadingProvider>
    </ClientLayout>
  );
}
