import "./globals.css";
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "SmartPrep Studio — Professional AI Workspace",
  description: "A high-performance, local-first AI workspace for intelligent learning and productivity. Powered by Claude-inspired aesthetics and T3-speed.",
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
    <html lang="en">
      <body className="h-screen w-screen overflow-hidden antialiased select-none">
        {children}
      </body>
    </html>
  );
}
