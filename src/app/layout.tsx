import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import Layout from "../components/Layout";
import { AuthProvider } from "../contexts/AuthContext";
import { BalanceProvider } from "../contexts/BalanceContext";
import { NotificationProvider } from "../contexts/NotificationContext";
import { PricingProvider } from "../contexts/PricingContext";
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
  title: "에이마 - AI실시간타겟마케팅",
  description:
    "CRM 마케팅의 새로운 패러다임! AI와 마케팅전문가가 최적의 효율을 찾아냅니다.",
  openGraph: {
    title: "에이마 - AI실시간타겟마케팅",
    description: "CRM 마케팅의 새로운 패러다임! AI와 마케팅전문가가 최적의 효율을 찾아냅니다.",
  },
  other: {
    "naver-site-verification": "2acbc824d4bda0f427257226955d03ff9ce9dd6b",
  },
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
        {/* Google Analytics - GA4 추적 태그 */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-FYDV0W98J7"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-FYDV0W98J7', {
              page_title: document.title,
              page_location: window.location.href,
            });
          `}
        </Script>

        {/* 카카오 SDK 로드 */}
        <Script
          src="https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js"
          strategy="beforeInteractive"
        />

        {/* Nice Payments SDK 로드 */}
        <Script
          src="https://pay.nicepay.co.kr/v1/js/"
          strategy="beforeInteractive"
        />

        <AuthProvider>
          <BalanceProvider>
            <NotificationProvider>
              <PricingProvider>
                <Layout>{children}</Layout>
              </PricingProvider>
            </NotificationProvider>
          </BalanceProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
