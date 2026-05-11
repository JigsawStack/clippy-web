import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
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
  title: "Clippy Web",
  description: "AI-powered floating mouse that guides users through your web app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Script id="clippy-init" strategy="beforeInteractive">
          {`window.ClippyWeb = window.ClippyWeb || {}; window.ClippyWeb.apiKey = "${process.env.NEXT_PUBLIC_INTERFAZE_API_KEY || ""}";`}
        </Script>
        <Script src="/clippy.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
