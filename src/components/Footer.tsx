"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="footer footer--landing">
      <div className="footer-landing-inner">
        <div className="footer-landing-left">
          <Image
            src="/images/aima-logo-footer.svg"
            alt="aima logo"
            width={106}
            height={27}
            className="footer-landing-logo-img"
          />
          <div className="footer-landing-links">
            <Link href="#" className="footer-landing-terms">
              서비스 이용약관
            </Link>
            <span className="footer-landing-divider">|</span>
            <Link href="#" className="footer-landing-privacy">
              개인정보처리방침
            </Link>
          </div>
          <div className="footer-landing-company-info">
            (주)엠티에스컴퍼니 | 주소: 서울특별시 강남구 삼성로 434, 8층(대치동,
            크레타나인대치)
            <br />
            대표이사: 정희원 | 사업자등록번호: 513-88-00391 | aima@mtsco.co.kr
          </div>
          <div className="footer-landing-copyright">
            Copyright © MTS Company CO., LTD. All rights reserved.
          </div>
        </div>
        <div className="footer-landing-right">
          <div className="footer-landing-customer">
            <div className="footer-landing-customer-title">고객센터</div>
            <div className="footer-landing-customer-contact">
              <div>대표번호: 070-8824-1139</div>
              <div>이메일: aima@mtsco.co.kr</div>
            </div>
            <div>평일 10:00 ~ 17:00 (점심 12:00~13:00) 주말, 공휴일 제외</div>
          </div>
          <div className="footer-landing-certifications">
            <Image
              src="/images/landing/footer/ISMS.png"
              alt="ISMS 인증"
              width={80}
              height={80}
              className="footer-landing-cert-img"
            />
            <Image
              src="/images/landing/footer/innobiz.png"
              alt="이노비즈 인증"
              width={80}
              height={80}
              className="footer-landing-cert-img"
            />
            <Image
              src="/images/landing/footer/shinbo.png"
              alt="신용보증기금"
              width={80}
              height={80}
              className="footer-landing-cert-img"
            />
            <Image
              src="/images/landing/footer/kakao.png"
              alt="카카오 파트너"
              width={80}
              height={80}
              className="footer-landing-cert-img"
            />
          </div>
        </div>
      </div>
    </footer>
  );
}
