import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Alegreya, Alegreya_Sans, Azeret_Mono } from "next/font/google";

const alegreya = Alegreya({
  subsets: ["latin"],
  variable: "--font-alegreya",
  display: "swap",
});

const alegreyaSans = Alegreya_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-alegreya-sans",
  display: "swap",
});

const azeret = Azeret_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-azeret",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SmartPrep — local study desk",
  description:
    "A local-first study workspace. Chat, notes, and library stay on this device; you bring your own OpenRouter key.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${alegreya.variable} ${alegreyaSans.variable} ${azeret.variable}`}
    >
      <body className="h-screen w-screen overflow-hidden antialiased select-none font-serif">
        {children}
      </body>
    </html>
  );
}
