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
    <section className="relative min-h-[600px] md:min-h-[700px] bg-gradient-to-br from-blue-50 to-white overflow-hidden pt-20 md:pt-32 lg:pt-16">
      <div className="container mx-auto px-4 py-12 md:py-16 lg:py-16">
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
              <Link href="/signup">
                <ResponsiveButton>에이마 가입하기</ResponsiveButton>
              </Link>
            </div>
          </div>

          {/* 이미지 콘텐츠 */}
          <div className="relative h-[450px] md:h-[550px] lg:h-[650px] flex items-center justify-center">
            <div className="w-[350px] h-[350px] md:w-[450px] md:h-[450px] lg:w-[550px] lg:h-[550px] xl:w-[600px] xl:h-[600px]">
              <Image
                src="/images/landing/aima-logo.svg"
                alt="에이마 로고"
                width={600}
                height={600}
                className="w-full h-full"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TestimonialCard({ title, content, image }: { title: string; content: string; image: string }) {
  return (
    <div className="bg-white rounded-2xl shadow-[0px_0px_10px_0px_rgba(22,129,255,0.3)] overflow-hidden h-full">
      <div className="h-48 md:h-56 relative">
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover"
        />
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
      content: "손님 응대가 서툴러 매장에 빈자리가 많았는데 에이마를 활용한 후 고객 유입이 빠르게 늘었어요.",
      image: "/images/landing/section2/restaurant-manager.jpg"
    },
    {
      title: "의류 쇼핑몰 사장님", 
      content: "신상품 홍보가 필요했지만, 대상도 광고 시간도 부족했어요. 이 부분을 에이마가 대신 해결해주어 매출 향상으로 이어졌어요.",
      image: "/images/landing/section2/cloth-manager.jpg"
    },
    {
      title: "공간대여 스튜디오 사장님",
      content: "공간 대여업 특성상 공실은 곧 손실인데 에이마로 인근 고객에게 할인 메시지를 발송해 예약을 채웠어요.",
      image: "/images/landing/section2/place-manager.jpg"
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
            <TestimonialCard key={index} title={testimonial.title} content={testimonial.content} image={testimonial.image} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ title, description, image }: { title: string; description: string; image: string }) {
  return (
    <div className="bg-white rounded-2xl shadow-[0px_0px_10px_0px_rgba(22,129,255,0.3)] p-6 md:p-8 flex flex-col md:flex-row gap-6 items-center">
      <div className="w-24 h-24 md:w-32 md:h-32 lg:w-40 lg:h-40 flex-shrink-0 relative rounded-lg overflow-hidden">
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover"
        />
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
      description: "불특정 다수는 이제 그만! 매장에 관심 있는 고객에게만 메시지를 전송해요",
      image: "/images/landing/section3/ads-target.png"
    },
    {
      title: "실시간 혜택 메시지 발송", 
      description: "우리 매장 근처에서 카드를 결제 한 고객에게 카드 승인 알림과 함께 실시간으로 혜택을 안내해요",
      image: "/images/landing/section3/realtime-target.png"
    },
    {
      title: "다양한 채널로, 더 많은 고객에게",
      description: "몇 번 클릭만으로 손쉽게 홍보 설정을 완료해요 네이버 톡톡 • 카카오 친구톡 • 문자 • RCS",
      image: "/images/landing/section3/channel-target.png"
    },
    {
      title: "광고 성과 한눈에 확인",
      description: "메시지 캠페인의 성과를 분석하여 마케팅 효과를 실시간으로 확인해요",
      image: "/images/landing/section3/datail-target.png"
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
              <FeatureCard key={index} title={feature.title} description={feature.description} image={feature.image} />
            ))}
          </div>
          <div className="grid md:grid-cols-2 gap-6 md:gap-8">
            {features.slice(2, 4).map((feature, index) => (
              <FeatureCard key={index + 2} title={feature.title} description={feature.description} image={feature.image} />
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
          <h2 className="font-extrabold text-3xl md:text-4xl lg:text-5xl xl:text-[52px] text-[#333333] mb-6 tracking-[-0.3px] leading-tight">
            누구나 쉽게 쓰는 AI 마케팅 도우미
          </h2>
          <p className="font-medium text-lg md:text-xl lg:text-[22px] text-[#46474c] leading-[30px] max-w-4xl mx-auto">
            AI가 광고 메시지 내용 부터 타깃 설정까지 자동으로 도와주니까<br />
            복잡한 마케팅도 이제 몇 분이면 끝나요
          </p>
        </div>

        {/* AI 데모 인터페이스 */}
        <div className="bg-[#dfeffe] rounded-[20px] p-8 md:p-12 lg:p-16 max-w-[1200px] mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            {/* 왼쪽: AI 채팅과 체크리스트 */}
            <div className="space-y-8">
              {/* AI 채팅 인터페이스 */}
              <div className="relative">
                <div className="bg-[#1681ff] inline-block px-6 py-2 rounded-full mb-4">
                  <span className="text-white font-semibold text-sm md:text-base">에이마 AI 에이전트</span>
                </div>

                <div className="bg-white rounded-[24px] p-6 shadow-[0px_4px_10px_0px_rgba(0,0,0,0.1)] border border-[#1681ff] relative mb-6">
                  <p className="text-black font-medium text-sm md:text-base lg:text-lg leading-relaxed">
                    첫 방문 고객을 위한 할인 혜택 광고 만들어줘
                  </p>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-[#1681ff] rounded-xl p-2">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M2 21l21-9L2 3v7l15 2-15 2v7z"/>
                    </svg>
                  </div>
                </div>

                {/* 체크리스트 */}
                <div className="space-y-4 md:space-y-6">
                  {steps.map((step, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <CheckIcon />
                      <p className="font-semibold text-base md:text-lg lg:text-[25px] text-[#3b3b3b] leading-relaxed">
                        {step}
                      </p>
                    </div>
                  ))}
                </div>

                {/* AI 생성 중 표시 */}
                <div className="flex flex-col gap-2 mt-4" style={{ marginLeft: '150px' }}>
                  <div className="w-3 h-3 bg-[#1681ff] rounded-full animate-pulse"></div>
                  <div className="w-3 h-3 bg-[#1681ff] opacity-50 rounded-full animate-pulse delay-75"></div>
                  <div className="w-3 h-3 bg-[#1681ff] opacity-10 rounded-full animate-pulse delay-150"></div>
                </div>

                {/* 로봇 이미지 */}
                <div className="absolute -bottom-8 lg:-bottom-[200px] right-0 lg:-right-40 xl:-right-56 w-48 h-48 md:w-56 md:h-56 lg:w-72 lg:h-72 xl:w-80 xl:h-80 transform rotate-[12deg] z-10">
                  <Image
                    src="/images/landing/section4/robot-ai.png"
                    alt="AI 로봇"
                    width={500}
                    height={500}
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            </div>

            {/* 오른쪽: 모바일 미리보기 */}
            <div className="flex justify-center items-center">
              <div className="relative">
                {/* 모바일 프레임 */}
                <div className="bg-[#666666] rounded-[30px] p-2 shadow-2xl">
                  <div className="bg-[#e9edf0] rounded-[20px] p-4 w-[300px] md:w-[350px] h-[600px] md:h-[650px] overflow-y-auto">
                    {/* 상태바 */}
                    <div className="bg-[#d9d9d9] h-2 w-20 rounded-full mx-auto mb-4"></div>
                    
                    {/* 컨텐츠 카드들 */}
                    <div className="space-y-4">
                      <div className="bg-white rounded-xl shadow-md overflow-hidden">
                        <div className="h-32 relative">
                          <Image
                            src="/images/landing/section4/pizza-ai.png"
                            alt="피자 이미지"
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="p-3">
                          <h3 className="font-bold text-sm text-black mb-2">
                            첫 방문 고객 할인 혜택!
                          </h3>
                          <p className="font-medium text-xs text-black leading-relaxed mb-3">
                            처음 오신 고객님께 드리는 작은 선물 🎁<br />
                            피자 메뉴 주문 시 시원한 콜라 1잔을 무료로 제공합니다.<br />
                            맛있는 피자를 더 특별하게 즐겨보세요!
                          </p>
                          <div className="flex gap-2">
                            <span className="px-2 py-1 bg-[#f5fafe] text-[#1b9cff] text-[10px] rounded border border-[#5bbbff]">매장 위치</span>
                            <span className="px-2 py-1 bg-[#f5fafe] text-[#1b9cff] text-[10px] rounded border border-[#5bbbff]">홈페이지</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-xl shadow-md overflow-hidden">
                        <div className="h-32 relative">
                          <Image
                            src="/images/landing/section4/jeju-ai.png"
                            alt="제주 항공 이미지"
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="p-3">
                          <h3 className="font-bold text-sm text-black mb-2">
                            제주로 떠나는 특별한 혜택
                          </h3>
                          <p className="font-medium text-xs text-black leading-relaxed mb-3">
                            한국 항공과 함께 제주 여행 떠나세요!<br />
                            항공편 예약 시 제주도 렌트카 1만원 할인 쿠폰을 드립니다.<br />
                            지금 바로 특별한 제주 여행을 준비해보세요 ✈️🌼
                          </p>
                          <div className="flex gap-2">
                            <span className="px-2 py-1 bg-[#f5fafe] text-[#1b9cff] text-[10px] rounded border border-[#5bbbff]">홈페이지</span>
                            <span className="px-2 py-1 bg-[#f5fafe] text-[#1b9cff] text-[10px] rounded border border-[#5bbbff]">블로그</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-xl shadow-md overflow-hidden">
                        <div className="h-32 relative">
                          <Image
                            src="/images/landing/section4/child-ai.png"
                            alt="학원 이미지"
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="p-3">
                          <h3 className="font-bold text-sm text-black mb-2">
                            우리 아이 맞춤 학습 진단+2회 체험 수업!
                          </h3>
                          <p className="font-medium text-xs text-black leading-relaxed mb-3">
                            우리 아이 공부, 어디서부터 시작할까요?<br />
                            지금 상담 예약하고 아이의 가능성을 직접 확인해보세요!
                          </p>
                          <div className="flex gap-2">
                            <span className="px-2 py-1 bg-[#f5fafe] text-[#1b9cff] text-[10px] rounded border border-[#5bbbff]">학원 위치</span>
                            <span className="px-2 py-1 bg-[#f5fafe] text-[#1b9cff] text-[10px] rounded border border-[#5bbbff]">홈페이지</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* 모바일 프레임 테두리 */}
                <div className="absolute inset-0 border-[10px] border-black rounded-[30px] pointer-events-none"></div>
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
          <Link href="/signup">
            <button className="bg-white text-[#1681FF] px-6 py-3 md:px-8 md:py-4 rounded-2xl font-bold text-sm md:text-base hover:bg-gray-100 transition-colors">
              무료로 시작하기
            </button>
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
