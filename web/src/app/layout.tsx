import type { Metadata } from "next";
import "@/styles/globals.css";
import { Inter, Playfair_Display } from "next/font/google";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { AuthProvider } from "@/contexts/AuthContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://example.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  icons: {
    icon: "/logoicoB.png",
    apple: "/logoicoB.png",
  },
  title: "Kaleidoscope Dental Academy",
  description: "Kaleidoscope Dental Academy – iPlace & iRestore training",
  keywords: [
    "dental implant training",
    "iPlace course",
    "iRestore",
    "Kaleidoscope Dental Academy",
    "CPD dental courses",
    "dental implant education",
    "implant training UK",
  ],
  openGraph: {
    title: "Kaleidoscope Dental Academy",
    description: "Kaleidoscope Dental Academy – iPlace & iRestore training",
    url: "/",
    siteName: "Kaleidoscope Dental Academy",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kaleidoscope Dental Academy",
    description: "Kaleidoscope Dental Academy – iPlace & iRestore training",
  },
  verification: {
    ...(process.env.GOOGLE_SITE_VERIFICATION
      ? { google: process.env.GOOGLE_SITE_VERIFICATION }
      : {}),
    ...(process.env.BING_SITE_VERIFICATION
      ? { other: { "msvalidate.01": process.env.BING_SITE_VERIFICATION } }
      : {}),
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${playfair.variable} bg-background text-textLight antialiased`}
      >
        <AuthProvider>
        <div className="flex min-h-screen flex-col">
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
        </AuthProvider>
      </body>
    </html>
  );
}
