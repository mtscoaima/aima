"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import SalespersonDashboard from "@/components/salesperson/SalespersonDashboard";

function ResponsiveButton({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <button className={`bg-[#1681ff] text-white px-6 py-3 md:px-8 md:py-4 rounded-2xl font-bold text-sm md:text-base hover:bg-[#1460d1] transition-colors ${className}`}>
      {children}
    </button>
  );
}

function HeroSection() {
  return (
    <section className="relative min-h-[600px] md:min-h-[700px] bg-gradient-to-br from-blue-50 to-white overflow-hidden">
      <div className="container mx-auto px-4 py-12 md:py-16 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center min-h-[500px]">
          {/* 텍스트 콘텐츠 */}
          <div className="space-y-6 md:space-y-8 text-center lg:text-left">
            <div className="space-y-2 md:space-y-4">
              <h1 className="font-bold text-3xl md:text-4xl lg:text-5xl xl:text-6xl leading-tight text-[#333333] tracking-[-0.3px]">
                <div className="mb-2">마케팅이 쉬워지는</div>
                <div className="mb-2">AI 간편 마케팅 도우미</div>
                <div className="text-[#1681ff]">에이마</div>
              </h1>
            </div>
            
            <div className="space-y-2">
              <p className="font-semibold text-lg md:text-xl lg:text-2xl text-[#46474c] leading-relaxed">
                AI 로 간단하게, 효과는 확실하게!
              </p>
              <p className="font-semibold text-lg md:text-xl lg:text-2xl text-[#46474c] leading-relaxed">
                에이마 로 확실한 매출 효과를 경험하세요
              </p>
            </div>
            
            <div className="pt-4 md:pt-6">
              <Link href="/target-marketing">
                <ResponsiveButton>에이마 가입하기</ResponsiveButton>
              </Link>
            </div>
          </div>

          {/* 이미지 콘텐츠 */}
          <div className="relative h-[400px] md:h-[500px] lg:h-[600px] flex items-center justify-center">
            <div className="absolute top-0 left-4 md:left-8 w-32 h-32 md:w-40 md:h-40 transform rotate-[-15deg]">
              <Image
                src="/images/landing/ai-icon.svg"
                alt="AI 아이콘"
                width={160}
                height={160}
                className="w-full h-full"
              />
            </div>
            
            <div className="absolute top-16 md:top-20 right-4 md:right-8 w-12 h-12 md:w-16 md:h-16">
              <Image
                src="/images/landing/star.svg"
                alt="별 아이콘"
                width={64}
                height={64}
                className="w-full h-full"
              />
            </div>
            
            <div className="w-64 h-64 md:w-80 md:h-80 lg:w-96 lg:h-96">
              <Image
                src="/images/landing/aima-logo.svg"
                alt="에이마 로고"
                width={384}
                height={384}
                className="w-full h-full"
              />
            </div>
            
            <div className="absolute bottom-4 md:bottom-8 right-8 md:right-12 w-24 h-24 md:w-32 md:h-32 transform rotate-[10deg]">
              <Image
                src="/images/landing/chart.svg"
                alt="차트 아이콘"
                width={128}
                height={128}
                className="w-full h-full"
              />
            </div>
            
            <div className="absolute bottom-16 md:bottom-20 left-8 md:left-12 w-8 h-8 md:w-10 md:h-10">
              <Image
                src="/images/landing/diamond.svg"
                alt="다이아몬드 아이콘"
                width={40}
                height={40}
                className="w-full h-full"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TestimonialCard({ title, content }: { title: string; content: string }) {
  return (
    <div className="bg-white rounded-2xl shadow-[0px_0px_10px_0px_rgba(22,129,255,0.3)] overflow-hidden h-full">
      <div className="h-48 md:h-56 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
        <span className="text-gray-500 font-bold text-lg">사장님 이미지</span>
      </div>
      <div className="p-6 md:p-8">
        <h3 className="font-bold text-lg md:text-xl text-black mb-4">{title}</h3>
        <p className="font-medium text-[#5a5c63] text-sm md:text-base leading-relaxed">{content}</p>
      </div>
    </div>
  );
}

function TestimonialsSection() {
  const testimonials = [
    {
      title: "OO 식당 사장님",
      content: "손님 응대가 서툴러 매장에 빈자리가 많았는데 에이마를 활용한 후 고객 유입이 빠르게 늘었어요."
    },
    {
      title: "의류 쇼핑몰 사장님", 
      content: "신상품 홍보가 필요했지만, 대상도 광고 시간도 부족했어요. 이 부분을 에이마가 대신 해결해주어 매출 향상으로 이어졌어요."
    },
    {
      title: "공간대여 스튜디오 사장님",
      content: "공간 대여업 특성상 공실은 곧 손실인데 에이마로 인근 고객에게 할인 메시지를 발송해 예약을 채웠어요."
    }
  ];

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="font-extrabold text-3xl md:text-4xl lg:text-5xl text-[#333333] tracking-[-0.3px] leading-tight">
            에이마는 이런 사장님께 꼭! 필요합니다
          </h2>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {testimonials.map((testimonial, index) => (
            <TestimonialCard key={index} {...testimonial} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="bg-white rounded-2xl shadow-[0px_0px_10px_0px_rgba(22,129,255,0.3)] p-6 md:p-8 flex flex-col md:flex-row gap-6 items-center">
      <div className="w-24 h-24 md:w-32 md:h-32 lg:w-40 lg:h-40 flex-shrink-0 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
        <span className="text-blue-600 font-bold">아이콘</span>
      </div>
      <div className="flex-1 text-center md:text-left">
        <h3 className="font-extrabold text-xl md:text-2xl lg:text-3xl text-black mb-4 tracking-[-0.84px]">
          {title}
        </h3>
        <p className="text-[#2c2c2c] text-sm md:text-base lg:text-lg leading-relaxed tracking-[-0.54px]">
          {description}
        </p>
      </div>
    </div>
  );
}

function FeaturesSection() {
  const features = [
    {
      title: "정밀한 타겟팅",
      description: "불특정 다수는 이제 그만! 매장에 관심 있는 고객에게만 메시지를 전송해요"
    },
    {
      title: "실시간 혜택 메시지 발송", 
      description: "우리 매장 근처에서 카드를 결제 한 고객에게 카드 승인 알림과 함께 실시간으로 혜택을 안내해요"
    },
    {
      title: "다양한 채널로, 더 많은 고객에게",
      description: "몇 번 클릭만으로 손쉽게 홍보 설정을 완료해요 네이버 톡톡 • 카카오 친구톡 • 문자 • RCS"
    },
    {
      title: "광고 성과 한눈에 확인",
      description: "메시지 캠페인의 성과를 분석하여 마케팅 효과를 실시간으로 확인해요"
    }
  ];

  return (
    <section className="py-16 md:py-24 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="font-extrabold text-3xl md:text-4xl lg:text-5xl text-[#333333] leading-tight tracking-[-0.3px] mb-6">
            <div className="mb-2">소액으로 쉽게 시작하는</div>
            <div>AI 시대의 CRM 마케팅</div>
          </h2>
        </div>
        
        <div className="grid gap-6 md:gap-8">
          <div className="grid md:grid-cols-2 gap-6 md:gap-8">
            {features.slice(0, 2).map((feature, index) => (
              <FeatureCard key={index} {...feature} />
            ))}
          </div>
          <div className="grid md:grid-cols-2 gap-6 md:gap-8">
            {features.slice(2, 4).map((feature, index) => (
              <FeatureCard key={index + 2} {...feature} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function CheckIcon() {
  return (
    <div className="w-6 h-6 rounded-full bg-[#1681ff] flex items-center justify-center flex-shrink-0">
      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    </div>
  );
}

function AIDemo() {
  const steps = [
    "광고 메시지 작성을 완료했어요",
    "광고 이미지를 생성했어요", 
    "성별·나이·지역 타깃을 설정했어요"
  ];

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="font-extrabold text-3xl md:text-4xl lg:text-5xl text-[#333333] mb-6 tracking-[-0.3px] leading-tight">
            누구나 쉽게 쓰는 AI 마케팅 도우미
          </h2>
          <p className="font-medium text-lg md:text-xl lg:text-2xl text-[#46474c] leading-relaxed max-w-4xl mx-auto">
            <span className="block mb-2">AI가 광고 메시지 내용 부터 타깃 설정까지 자동으로 도와주니까</span>
            <span>복잡한 마케팅도 이제 몇 분이면 끝나요</span>
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* 체크리스트 */}
          <div className="space-y-6 md:space-y-8">
            {steps.map((step, index) => (
              <div key={index} className="flex items-start gap-4">
                <CheckIcon />
                <p className="font-semibold text-lg md:text-xl lg:text-2xl text-[#3b3b3b] leading-relaxed">
                  {step}
                </p>
              </div>
            ))}
          </div>

          {/* 모바일 앱 미리보기 */}
          <div className="flex justify-center">
            <div className="grid md:grid-cols-2 gap-4 md:gap-6 max-w-md">
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="h-32 md:h-40 bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center">
                  <span className="text-orange-600 font-bold">피자 이미지</span>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-sm md:text-base text-black mb-2">
                    첫 방문 고객 할인 혜택!
                  </h3>
                  <p className="font-medium text-xs md:text-sm text-black leading-relaxed">
                    처음 오신 고객님께 드리는 작은 선물 🎁 피자 메뉴 주문 시 시원한 콜라 1잔을 무료로 제공합니다.
                  </p>
                  <div className="flex gap-2 mt-3">
                    <span className="px-2 py-1 bg-[#f5fafe] text-[#1b9cff] text-xs rounded border border-[#5bbbff]">매장 위치</span>
                    <span className="px-2 py-1 bg-[#f5fafe] text-[#1b9cff] text-xs rounded border border-[#5bbbff]">홈페이지</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="h-32 md:h-40 bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center">
                  <span className="text-purple-600 font-bold">이벤트 이미지</span>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-sm md:text-base text-black mb-2">
                    새로운 혜택 소식!
                  </h3>
                  <p className="font-medium text-xs md:text-sm text-black leading-relaxed">
                    이번 주말 특별 이벤트를 놓치지 마세요. 더 많은 혜택이 기다리고 있습니다.
                  </p>
                  <div className="flex gap-2 mt-3">
                    <span className="px-2 py-1 bg-[#f5fafe] text-[#1b9cff] text-xs rounded border border-[#5bbbff]">홈페이지</span>
                    <span className="px-2 py-1 bg-[#f5fafe] text-[#1b9cff] text-xs rounded border border-[#5bbbff]">블로그</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="py-16 md:py-24 bg-gradient-to-br from-[#1681ff] to-[#0066cc]">
      <div className="container mx-auto px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-extrabold text-3xl md:text-4xl lg:text-5xl text-white mb-6 md:mb-8 leading-tight">
            지금 바로 에이마와 함께 시작하세요
          </h2>
          <p className="font-medium text-lg md:text-xl text-white/90 mb-8 md:mb-12 leading-relaxed">
            AI 마케팅으로 매출 향상을 경험해보세요
          </p>
          <Link href="/target-marketing">
            <ResponsiveButton className="bg-white text-[#1681ff] hover:bg-gray-100">
              무료로 시작하기
            </ResponsiveButton>
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const { isAuthenticated, user } = useAuth();

  // 영업사원으로 로그인한 경우 전용 대시보드 표시
  if (isAuthenticated && user?.role === "SALESPERSON") {
    return <SalespersonDashboard />;
  }

  return (
    <div className="min-h-screen">
      <main>
        <HeroSection />
        <TestimonialsSection />
        <FeaturesSection />
        <AIDemo />
        <CTASection />
      </main>
    </div>
  );
}