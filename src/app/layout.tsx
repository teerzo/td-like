import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { FloatingNav } from "@/components/floating-nav";
import { PlayDebugToolbarProvider } from "@/components/game/play-debug-toolbar";
import { PlayPerfProvider } from "@/components/game/play-perf-toggles";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "td-like",
  description: "A 3D tower defense starter with Next.js, shadcn, R3F, and Supabase.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <PlayDebugToolbarProvider>
          <PlayPerfProvider>
            <FloatingNav />
            {children}
          </PlayPerfProvider>
        </PlayDebugToolbarProvider>
      </body>
    </html>
  );
}
