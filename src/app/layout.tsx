import type { Metadata } from "next";
import { JetBrains_Mono, Nunito } from "next/font/google";

import { FloatingNav } from "@/components/floating-nav";
import { GameSettingsProvider } from "@/components/game/game-settings-provider";
import { PlayPerfProvider } from "@/components/game/play-perf-toggles";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
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
      className={`${nunito.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <GameSettingsProvider>
          <PlayPerfProvider>
            <FloatingNav />
            {children}
          </PlayPerfProvider>
        </GameSettingsProvider>
      </body>
    </html>
  );
}
