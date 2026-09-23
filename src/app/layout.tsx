import type { Metadata } from "next";
import { Sora, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  weight: ["500", "600", "700", "800"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600", "700"],
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  weight: ["400", "500"],
});

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Cavite Crop List Registry — PSA Region IV-A",
  description:
    "Provincial crop-list updating portal for the 23 cities and municipalities of Cavite, Philippine Statistics Authority Region IV-A.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${sora.variable} ${inter.variable} ${jetbrains.variable} font-body bg-ledger-paper text-ledger-ink antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
