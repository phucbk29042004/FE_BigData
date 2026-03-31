import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["vietnamese", "latin"], variable: "--font-inter" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "FraudGuard — Cinematic Security",
  description: "Linear Modern Fraud Detection System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="h-full bg-[#050506]" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrains.variable} font-sans min-h-full antialiased text-[#EDEDEF]`}>
        {children}
      </body>
    </html>
  );
}
