"use client";

import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-top">
          <div className="footer-logo">
            <h3>MTS플러스</h3>
            <p>쉽고 효과적인 마케팅 솔루션</p>
          </div>
          
          <div className="footer-links">
            <div className="footer-links-column">
              <h4>회사 정보</h4>
              <ul>
                <li><Link href="/about">회사 소개</Link></li>
                <li><Link href="/service-terms">서비스 이용약관</Link></li>
                <li><Link href="/privacy-policy">개인정보처리방침</Link></li>
              </ul>
            </div>
            
            <div className="footer-links-column">
              <h4>서비스</h4>
              <ul>
                <li><Link href="/target-marketing">타겟 마케팅</Link></li>
                <li><Link href="/messages">문자 메시지</Link></li>
                <li><Link href="/ai-marketing">AI 마케팅</Link></li>
              </ul>
            </div>
            
            <div className="footer-links-column">
              <h4>고객지원</h4>
              <ul>
                <li><Link href="/customer-support/notices">공지사항</Link></li>
                <li><Link href="/customer-support/faq">자주 묻는 질문</Link></li>
                <li><Link href="/customer-support/inquiry">1:1 문의</Link></li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>© 2024 MTS플러스. All rights reserved.</p>
          <div className="contact-info">
            <p>고객센터: 1234-5678 (평일 09:00-18:00)</p>
            <p>이메일: support@dongledongle.com</p>
          </div>
        </div>
      </div>
    </footer>
  );
} 