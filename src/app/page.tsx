"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import SalespersonDashboard from "../components/SalespersonDashboard";

export default function Home() {
  const { isAuthenticated, user } = useAuth();

  // 영업사원으로 로그인한 경우 전용 대시보드 표시
  if (isAuthenticated && user?.role === "SALESPERSON") {
    return <SalespersonDashboard />;
  }

  return (
    <div className="landing-root">
      {/* Hero Section */}
      <section className="landing-hero-section">
        <div className="landing-hero-bg">
          <div className="landing-hero-inner">
            <div className="landing-hero-title-group">
              <h2 className="landing-hero-title">
                마케팅의 새로운 기준
                <br />
                AI 간편 마케팅 도우미,{" "}
                <span className="landing-hero-blue">에이마</span>
              </h2>
              <p className="landing-hero-desc">
                클릭 한 번으로 시작하는 쉽고 빠른 가게 홍보
                <br />
                에이마로 확실한 매출 효과를 경험하세요!
              </p>
              <Link
                href={
                  isAuthenticated
                    ? "/target-marketing/send/create-template"
                    : "/login"
                }
                className="landing-hero-btn"
              >
                지금 바로 시작하기
              </Link>
            </div>
            <div className="landing-hero-rocket" aria-hidden>
              <Image
                src="/images/rocket.svg"
                alt="로켓 일러스트"
                width={416}
                height={416}
                className="landing-hero-rocket-img"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Why Section */}
      <section className="landing-why-section">
        <h3 className="landing-why-title">
          마케팅 어렵고 비싸서 포기하셨나요?
          <br />
          절차는 간단하게, 효과는 확실하게!
        </h3>
        <p className="landing-why-desc">
          에이마라면 복잡한 과정 없이
          <br />내 주변 고객에게 바로, 저렴하게 홍보할 수 있어요.
        </p>
        <div className="landing-why-benefits">
          <div className="landing-why-benefit-card">
            <h4>광고비 최대 60% 절감</h4>
            <p>
              불특정 다수에게 보내는 비효율적인 홍보는 이제 그만
              <br />
              실제로 반응할 가능성이 높은 고객에게만 정확하게 도달하니까
              <br />
              광고비는 줄이고, 효과는 상승
            </p>
          </div>
          <div className="landing-why-benefit-card">
            <h4>원하는 시간에, 바로 반응</h4>
            <p>
              가게 주변 고객에게 내가 정한 시간에 맞춰 직접 홍보
              <br />
              방문율은 물론, 단골로 이어질 확률까지 높아져요.
            </p>
          </div>
        </div>
      </section>

      {/* Use Case Section */}
      <section className="landing-usecase-section">
        <div className="landing-usecase-row">
          <div className="landing-usecase-text">
            <h4>
              주변 직장인·가족 단위 고객에게
              <br />
              점심·저녁 시간 맞춤 홍보
            </h4>
            <p>
              방문할 가능성이 높은 고객만 골라 보내니까
              <br />
              홍보비 부담은 줄고, 고기 굽는 테이블은 늘어나요
            </p>
          </div>
          <div className="landing-usecase-img"></div>
        </div>
        <div className="landing-usecase-row landing-usecase-row-reverse">
          <div className="landing-usecase-text">
            <h4>예약 없는 시간대, 빈자리 채워보세요</h4>
            <p>
              평일 한산한 시간엔 근처 고객에게 딱 맞춰 할인 알림림
              <br />
              단골 유입은 물론, 예약률도 자연스럽게 올라갑니다
            </p>
          </div>
          <div className="landing-usecase-img">
            <Image
              src="/images/hairshop.png"
              alt="미용실 예시"
              width={340}
              height={240}
            />
          </div>
        </div>
        <div className="landing-usecase-row">
          <div className="landing-usecase-text">
            <h4>
              혼자 운영해도
              <br />
              마케팅은 자동으로 해결
            </h4>
            <p>
              시간 들이지 않아도 AI가 고객 타깃부터 홍보까지 착착
              <br />
              적은 예산으로 꼭 필요한 고객에게 도달 가능
            </p>
          </div>
          <div className="landing-usecase-img">
            <Image
              src="/images/flower.png"
              alt="플라워샵 예시"
              width={340}
              height={240}
            />
          </div>
        </div>
      </section>

      {/* AI Section */}
      <section className="landing-ai-section">
        <h3 className="landing-ai-title">
          홍보 문구 고민 끝<br />
          제작부터 설정까지, AI가 알아서
        </h3>
        <p className="landing-ai-desc">
          마케팅 전문가가 아니어도 괜찮아요.
          <br />
          AI가 업종에 맞는 템플릿과 타깃 고객 설정까지 자동으로 만들어줍니다.
        </p>
        <div className="landing-ai-images">
          <Image
            src="/images/ai-1.png"
            alt="AI 문구 생성 예시"
            width={348}
            height={361}
          />
          <Image
            src="/images/ai-2.png"
            alt="AI 아이콘"
            width={187}
            height={241}
          />
          <Image
            src="/images/ai-3.png"
            alt="AI 홍보 예시"
            width={205}
            height={460}
          />
          <Image
            src="/images/ai-4.png"
            alt="AI 타겟 예시"
            width={373}
            height={248}
          />
        </div>
      </section>

      {/* Smart Marketing Section */}
      <section className="landing-smart-section">
        <h3 className="landing-smart-title">
          우리 가게를 바로 알리는 스마트 마케팅
        </h3>
        <p className="landing-smart-desc">
          에이마는 국내 최대 카드사 빅데이터 분석을 통해
          <br />
          가게에 딱 맞는 고객에게 홍보 메시지를 즉시 전달해요.
        </p>
        <div className="landing-smart-images">
          <Image
            src="/images/store.png"
            alt="가게 일러스트"
            width={391}
            height={359}
          />
          <Image
            src="/images/sms-picture.png"
            alt="홍보 메시지 그림"
            width={410}
            height={273}
          />
          <Image
            src="/images/sms-examples.png"
            alt="홍보 메시지 예시"
            width={630}
            height={335}
          />
        </div>
        <p className="landing-smart-footer">
          카드 승인 문자 또는 모바일 영수증에
          <br />
          우리 가게 홍보 문구를 실어 고객에게 즉시 전송해요.
        </p>
      </section>

      {/* Testimonial Section */}
      <section className="landing-testimonial-section">
        <h3 className="landing-testimonial-title">
          에이마로 우리 가게 홍보가 쉬워졌어요
        </h3>
        <div className="landing-testimonial-list">
          <div className="landing-testimonial-item">
            <div className="landing-testimonial-avatar landing-testimonial-avatar1"></div>
            <div className="landing-testimonial-bubble">
              <p>
                &quot;예전엔 전단지 돌리거나 블로그 글 쓰는 데만 시간을 엄청
                썼거든요.
                <br />
                에이마 쓰고 나서는 손님들이 바로 알아보고 와요.
                <br />
                진짜 필요한 분들한테만 홍보가 되니까 너무 편하고 효과도
                좋아요.&quot;
                <br />
                <span className="landing-testimonial-name">
                  - 송파구 미용실 사장님
                </span>
              </p>
            </div>
          </div>
          <div className="landing-testimonial-item">
            <div className="landing-testimonial-avatar landing-testimonial-avatar2"></div>
            <div className="landing-testimonial-bubble">
              <p>
                &quot;카페 홍보는 늘 감으로 했는데,
                <br />
                이제는 AI가 알려주니까 정말 정확하게 다가갈 수 있더라고요.
                <br />
                에이마 덕분에 시간도 줄고, 단골도 늘었어요.&quot;
                <br />
                <span className="landing-testimonial-name">
                  - 성수동 카페 사장님
                </span>
              </p>
            </div>
          </div>
          <div className="landing-testimonial-item">
            <div className="landing-testimonial-avatar landing-testimonial-avatar3"></div>
            <div className="landing-testimonial-bubble">
              <p>
                &quot;혼자 가게 하면서 마케팅까지 하려니 너무 막막했어요.
                <br />
                에이마는 정말 간편해서 설정도 쉽고, 손님들한테 바로 홍보되니까
                <br />
                시간 아끼고 고기도 더 많이 팔게 됐습니다.&quot;
                <br />
                <span className="landing-testimonial-name">
                  - 노원구 고깃집 사장님
                </span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 혜택 Section */}
      <section className="landing-benefit-section">
        <h3 className="landing-benefit-title">
          신규 광고주님께 드리는
          <br /> 특별한 혜택
        </h3>
        <div className="landing-benefit-box">
          <div className="landing-benefit-content">
            <span className="landing-benefit-label">포인트 적립 혜택</span>
            <span className="landing-benefit-desc">
              결제 금액의 최대 5%를
              <br /> 포인트로 적립해 드립니다.
            </span>
          </div>
          <div className="landing-benefit-image">
            <Image
              src="/images/gift.png"
              alt="선물 이미지"
              width={290}
              height={210}
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="landing-cta-section">
        <h3 className="landing-cta-title">
          매출을 높이는 단 하나의 솔루션
          <br />
          지금 에이마로 시작하세요!
        </h3>
        <Link
          href={
            isAuthenticated
              ? "/target-marketing/send/create-template"
              : "/login"
          }
          className="landing-cta-btn"
        >
          무료로 시작하기
        </Link>
      </section>
    </div>
  );
}
