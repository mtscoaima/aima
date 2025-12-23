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
  title: "에이마",
  description:
    "에이마(AIMA)는 엠티에스컴퍼니의 AI 기술로 고객 데이터를 분석하고 실시간 타깃 마케팅을 자동화하는 플랫폼입니다. CRM 효율을 극대화하는 인공지능 마케팅 솔루션을 만나보세요.",
  keywords: "에이마, AIMA, 엠티에스컴퍼니, AI 마케팅, 실시간 타깃 마케팅, CRM, 인공지능 마케팅, 마케팅 자동화, 디지털 마케팅, 고객데이터 분석",
  openGraph: {
    title: "에이마",
    description: "에이마(AIMA)는 엠티에스컴퍼니의 AI 기술로 고객 데이터를 분석하고 실시간 타깃 마케팅을 자동화하는 플랫폼입니다. CRM 효율을 극대화하는 인공지능 마케팅 솔루션을 만나보세요.",
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

        {/* LG CNS CNSPay SDK - PaymentModal에서 동적으로 로드함 */}

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
