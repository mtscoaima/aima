"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="footer footer--landing">
      <div className="footer-landing-inner">
        <div className="footer-landing-left">
          <div className="footer-landing-logo-row">
            <Image
              src="/images/aima-logo-footer.svg"
              alt="aima logo"
              width={32}
              height={32}
              className="footer-landing-logo-img"
            />
            <span className="footer-landing-logo-text">aima</span>
          </div>
          <div className="footer-landing-links">
            <Link href="#">서비스 이용약관</Link>
            <span className="footer-landing-divider">|</span>
            <Link href="#">개인정보처리방침</Link>
          </div>
          <div className="footer-landing-company-info">
            (주)엠티에스컴퍼니 | 주소: 서울특별시 강남구 삼성로 434, 8층(대치동,
            크레타타워8차)
            <br />
            대표이사: 정일재 | 사업자등록번호: 513-88-00391 | help@mtsco.co.kr
          </div>
          <div className="footer-landing-copyright">
            Copyright © MTS Company CO., LTD. All rights reserved.
          </div>
        </div>
        <div className="footer-landing-right">
          <div className="footer-landing-customer">
            <div className="footer-landing-customer-title">고객센터</div>
            <div>대표번호: 02-111-1111</div>
            <div>이메일: aaaa@aima.com</div>
            <div>평일 10:00 ~ 17:00 (점심 12:00~13:00) 주말, 공휴일 제외</div>
          </div>
          <div className="footer-landing-certifications">
            <Image
              src="/images/cert.png"
              alt="인증마크1"
              width={220}
              height={38}
              className="footer-landing-cert-img"
            />
          </div>
        </div>
      </div>
    </footer>
  );
}
