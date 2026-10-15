import type { Metadata } from "next";
import localFont from "next/font/local";
import { ChogWorld } from "@/components/chog-world";
import { Header } from "@/components/header";
import { Providers } from "./providers";
import "./globals.css";

// Fonts are bundled with the project (SIL Open Font License), so no network request to Google is needed.
const display = localFont({
  src: "./fonts/bricolage-grotesque-latin-wght-normal.woff2",
  variable: "--font-display",
  weight: "200 800",
  display: "swap",
});
const body = localFont({
  src: "./fonts/figtree-latin-wght-normal.woff2",
  variable: "--font-body",
  weight: "300 900",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Chog Echo",
  description: "Your Chog NFT is the voice. Its traits decide how it writes.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>
        <Providers>
          <ChogWorld />
          <div className="relative z-10">
            <Header />
            <main className="mx-auto w-full max-w-6xl px-4 pb-32 pt-6 sm:px-6 md:pb-20">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
