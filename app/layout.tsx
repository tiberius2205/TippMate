import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TippMate — WM 2026",
  description: "Das Tippspiel zur FIFA Fußball-Weltmeisterschaft 2026",
};

export const viewport: Viewport = {
  themeColor: "#003DA5",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className={`${geist.variable} h-full antialiased`}>
      <body className="bg-gray-950 text-white min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}
