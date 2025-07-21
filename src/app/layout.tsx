import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import Layout from "../components/Layout";
import { AuthProvider } from "../contexts/AuthContext";
import { BalanceProvider } from "../contexts/BalanceContext";
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
  title: "MTS마케팅 - SaaS 마케팅 플랫폼",
  description:
    "AI 기반 타겟 마케팅 솔루션으로 효과적인 마케팅 캠페인을 만들어보세요",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* 카카오 SDK 로드 */}
        <Script
          src="https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js"
          strategy="beforeInteractive"
        />

        <AuthProvider>
          <BalanceProvider>
            <Layout>{children}</Layout>
          </BalanceProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
