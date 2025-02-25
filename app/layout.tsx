import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import "@rainbow-me/rainbowkit/styles.css";
import { Header } from "@/components/header";
import ContextProvider from "@/context";
import { Toaster } from "@/components/ui/sonner";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Opti.Domains ENS L2 on Optimism",
  description: "Connect wallet and migrate your ENS domains to Optimism",
  icons: {
    icon: "/icons/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ContextProvider>
          <Header />
          <main className="mx-auto max-w-screen-xl px-4 py-8">{children}</main>
          {/* <Footer /> */}
          <Toaster />
        </ContextProvider>
      </body>
    </html>
  );
}
