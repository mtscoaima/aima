"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AdvertiserLoginRequiredGuard } from "@/components/RoleGuard";

export default function BusinessVerificationPage() {
  const [businessType, setBusinessType] = useState("individual");
  const [businessName, setBusinessName] = useState("");
  const [representativeName, setRepresentativeName] = useState("");
  const [businessNumber, setBusinessNumber] = useState("");
  const [address, setAddress] = useState("");
  const [businessCategory, setBusinessCategory] = useState("");
  const [businessType2, setBusinessType2] = useState("");
  const [managerName, setManagerName] = useState("");
  const [managerPhone, setManagerPhone] = useState("");
  const [managerEmail, setManagerEmail] = useState("");
  const [usePersonalInfo, setUsePersonalInfo] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 인증 제출 로직
    console.log("인증 정보 제출");
  };

  const handleFileUpload = (type: string) => {
    // 파일 업로드 로직
    console.log(`${type} 파일 업로드`);
  };

  return (
    <AdvertiserLoginRequiredGuard>
      <div className="business-verification-container">
        <div className="bv-container">
          <header className="bv-header">
            <h1>사업자정보 인증</h1>
            <div className="bv-description">
              <p>
                • 기업 정보/재직 시 정보 입력 및 필요 서류 첨부 후 신청 버튼을
                클릭하시면 사업자 인증 신청이 완료됩니다.
              </p>
              <p>• 관리자 승인까지 영업일 1~3일 소요됩니다.</p>
            </div>
          </header>

          <form onSubmit={handleSubmit} className="verification-form">
            {/* 사업자정보 섹션 */}
            <div className="form-section">
              <h2 className="section-title">사업자정보</h2>

              <div className="form-group">
                <label className="form-label required">기업유형</label>
                <div className="radio-group">
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="businessType"
                      value="individual"
                      checked={businessType === "individual"}
                      onChange={(e) => setBusinessType(e.target.value)}
                    />
                    <span className="radio-text">개인사업자</span>
                  </label>
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="businessType"
                      value="corporation"
                      checked={businessType === "corporation"}
                      onChange={(e) => setBusinessType(e.target.value)}
                    />
                    <span className="radio-text">법인사업자</span>
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label required">사업자명</label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="form-input"
                  placeholder="사업자명을 입력해주세요"
                />
              </div>

              <div className="form-group">
                <label className="form-label required">대표자명</label>
                <input
                  type="text"
                  value={representativeName}
                  onChange={(e) => setRepresentativeName(e.target.value)}
                  className="form-input"
                  placeholder="대표자명을 입력해주세요"
                />
              </div>

              <div className="form-group">
                <label className="form-label required">사업자등록번호</label>
                <div className="input-with-button">
                  <input
                    type="text"
                    value={businessNumber}
                    onChange={(e) => setBusinessNumber(e.target.value)}
                    className="form-input"
                    placeholder="사업자번호 확인"
                  />
                  <button type="button" className="verify-button">
                    확인
                  </button>
                </div>
                <div className="business-status">
                  사업자등록번호 확인이 완료되었습니다.
                </div>
              </div>

              <div className="form-group">
                <label className="form-label required">주소</label>
                <div className="address-group">
                  <div className="address-search">
                    <input
                      type="text"
                      className="form-input address-input-main"
                      placeholder="도로명 주소 찾기"
                      disabled
                    />
                    <button type="button" className="address-button">
                      주소찾기
                    </button>
                  </div>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="form-input address-input"
                    placeholder="나머지 주소를 입력해 주세요"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">업태</label>
                <input
                  type="text"
                  value={businessCategory}
                  onChange={(e) => setBusinessCategory(e.target.value)}
                  className="form-input"
                  placeholder="선택"
                />
              </div>

              <div className="form-group">
                <label className="form-label">업종</label>
                <input
                  type="text"
                  value={businessType2}
                  onChange={(e) => setBusinessType2(e.target.value)}
                  className="form-input"
                  placeholder="선택"
                />
              </div>

              <div className="form-group">
                <label className="form-label required">인증정보</label>
                <div className="upload-section">
                  <div className="upload-title-section">
                    <span className="upload-title">
                      사업자등록증/사업자등록증명원 (택1)
                    </span>
                  </div>
                  <div className="file-input-group">
                    <input
                      type="text"
                      className="form-input file-display-input"
                      placeholder="사업자등록증 또는 사업자등록증명원을 등록해 주세요."
                      readOnly
                    />
                    <button
                      type="button"
                      className="upload-button"
                      onClick={() => handleFileUpload("business")}
                    >
                      파일 첨부
                    </button>
                  </div>

                  <div className="file-requirement">
                    <p className="requirement-text">
                      <strong>
                        90일 이내 발행된 사업자등록증 또는 사업자등록증명원을
                        첨부해 주세요.
                      </strong>
                    </p>
                    <p className="file-info">
                      <span className="highlight-red">
                        단, 주민등록번호 뒷자리는 노출되지 않도록 처리
                      </span>
                      <br />
                      (ex 991234 - ******* 표시 등)가 되어 있어야 합니다. (파일
                      형식 : JPEG, JPG, PNG, PDF, TIF / 용량 20MB 이하)
                    </p>
                  </div>

                  <div className="file-buttons">
                    <a
                      href="https://hometax.go.kr/websquare/websquare.html?w2xPath=/ui/pp/index_pp.xml&menuCd=index3"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="file-btn"
                    >
                      사업자등록증 발급 바로가기 &gt;
                    </a>
                    <a
                      href="https://www.gov.kr/mw/AA020InfoCappView.do?HighCtgCD=&CappBizCD=12100000016"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="file-btn"
                    >
                      사업자등록증명원 발급 바로가기 &gt;
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* 재직자 인증 섹션 */}
            <div className="form-section">
              <h2 className="section-title optional">재직자 인증</h2>

              <div className="employment-section">
                <div className="upload-title-section">
                  <span className="upload-title">인증정보</span>
                </div>
                <div className="file-input-group">
                  <input
                    type="text"
                    className="form-input file-display-input"
                    placeholder="재직증명서를 등록해주세요.(임직원만)"
                    readOnly
                  />
                  <button
                    type="button"
                    className="upload-button"
                    onClick={() => handleFileUpload("employment")}
                  >
                    파일 첨부
                  </button>
                </div>
                <div className="upload-description">
                  <p>• 대표자가 아닌 임직원인 경우 제출</p>
                  <p>
                    • 해당 사업체 근무 여부를 확인합니다. 임직원만 제출해주세요.
                  </p>
                  <p>
                    • 본인의 재직증명서를 제출해주시고, 주민번호 뒷자리와 주소는
                    가려서 제출해주세요.
                  </p>
                </div>
              </div>
            </div>

            {/* 세금계산서 담당자 섹션 */}
            <div className="form-section">
              <div className="section-header">
                <h2 className="section-title optional">세금계산서 담당자</h2>
                <div className="checkbox-group inline">
                  <label className="checkbox-option">
                    <input
                      type="checkbox"
                      checked={usePersonalInfo}
                      onChange={(e) => setUsePersonalInfo(e.target.checked)}
                    />
                    <span className="checkbox-text">가입자 정보와 동일</span>
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">담당자 이름</label>
                <input
                  type="text"
                  value={managerName}
                  onChange={(e) => setManagerName(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">담당자 휴대폰</label>
                <div className="phone-group">
                  <input
                    type="text"
                    className="form-input phone-input"
                    defaultValue="010"
                  />
                  <span>-</span>
                  <input
                    type="text"
                    value={managerPhone.split("-")[1] || ""}
                    onChange={(e) =>
                      setManagerPhone(
                        `010-${e.target.value}-${
                          managerPhone.split("-")[2] || ""
                        }`
                      )
                    }
                    className="form-input phone-input"
                  />
                  <span>-</span>
                  <input
                    type="text"
                    value={managerPhone.split("-")[2] || ""}
                    onChange={(e) =>
                      setManagerPhone(
                        `010-${managerPhone.split("-")[1] || ""}-${
                          e.target.value
                        }`
                      )
                    }
                    className="form-input phone-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">계산서 수신 이메일</label>
                <input
                  type="email"
                  value={managerEmail}
                  onChange={(e) => setManagerEmail(e.target.value)}
                  className="form-input"
                />
              </div>
            </div>

            {/* 세금계산서 발급 안내 */}
            <div className="form-section info-section">
              <h2 className="section-title">세금계산서 발급 안내</h2>
              <div className="info-content">
                <p>
                  • 세금계산서는 매월 사용분을 합산하여 다음달 10일 자동으로
                  발행됩니다.
                </p>
                <p>• 부가가치세법에 의거, 실사용금액을 기준으로 발행됩니다.</p>
                <p>
                  • 카드 전표는 단순 영수증으로, 부가가치세 신고는 세금계산서를
                  기준으로만 진행해 주세요.
                </p>
              </div>
            </div>

            {/* 제출 버튼 */}
            <div className="submit-section">
              <button type="submit" className="submit-button">
                인증하기
              </button>
              <div className="inquiry-section">
                <Link href="/support" className="inquiry-link">
                  인증 문의
                </Link>
              </div>
            </div>
          </form>
        </div>
      </div>

      <style jsx global>{`
        /* Layout 오버라이드 */
        body .main-content {
          padding: 0 !important;
          padding-top: 140px !important;
          max-width: none !important;
          margin: 0 !important;
        }

        .business-verification-container {
          min-height: calc(100vh - 140px);
          display: flex;
          flex-direction: column;
          padding: 20px;
          background-color: #ffffff;
          position: relative;
        }

        .bv-container {
          flex: 1;
          display: flex;
          flex-direction: column;
          max-width: 800px;
          width: 100%;
          margin: 0 auto;
        }

        .bv-header {
          margin-bottom: 2rem;
          background: transparent;
          padding: 2rem 0;
          border-bottom: 1px solid #e9ecef;
        }

        .bv-header h1 {
          color: #1681ff;
          font-family: "Noto Sans KR";
          font-size: 24px;
          font-weight: 600;
          line-height: 120%;
          letter-spacing: -0.48px;
          margin: 0 0 1rem 0;
          text-align: center;
        }

        .bv-description {
          font-size: 0.9rem;
          color: #333;
          line-height: 1.5;
        }

        .bv-description p {
          margin: 0.5rem 0;
        }

        .verification-form {
          background: transparent;
        }

        .form-section {
          padding: 2rem 0;
          border-bottom: 1px solid #e9ecef;
        }

        .form-section:last-child {
          border-bottom: none;
        }

        .section-title {
          font-size: 1.2rem;
          font-weight: 600;
          color: #333;
          margin: 0 0 1.5rem 0;
          padding-bottom: 0.5rem;
          border-bottom: 2px solid #f8f9fa;
        }

        .section-title.required:after {
          content: " (필수)";
          color: #dc3545;
          font-size: 0.9rem;
        }

        .section-title.optional:after {
          content: " (선택)";
          color: #6c757d;
          font-size: 0.9rem;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .checkbox-group.inline {
          margin: 0;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-label {
          display: block;
          font-weight: 600;
          color: #333;
          margin-bottom: 0.5rem;
        }

        .form-label.required:after {
          content: " (필수)";
          color: #dc3545;
          font-size: 0.8rem;
        }

        .form-input {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 1rem;
          transition: border-color 0.2s;
        }

        .form-input:focus {
          outline: none;
          border-color: #1681ff;
          box-shadow: 0 0 0 2px rgba(22, 129, 255, 0.1);
        }

        .radio-group {
          display: flex;
          gap: 2rem;
        }

        .radio-option {
          display: flex;
          align-items: center;
          cursor: pointer;
        }

        .radio-option input[type="radio"] {
          margin-right: 0.5rem;
          transform: scale(1.2);
        }

        .radio-text {
          font-size: 1rem;
          color: #333;
        }

        .input-with-button {
          display: flex;
          gap: 0.5rem;
        }

        .input-with-button .form-input {
          flex: 1;
        }

        .verify-button {
          padding: 0.75rem 1.5rem;
          background-color: #6c757d;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.9rem;
          white-space: nowrap;
        }

        .verify-button:hover {
          background-color: #5a6268;
        }

        .business-status {
          margin-top: 0.5rem;
          padding: 0.5rem;
          background-color: #d4edda;
          color: #155724;
          border-radius: 4px;
          font-size: 0.9rem;
        }

        .address-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .address-search {
          display: flex;
          gap: 0.5rem;
        }

        .address-input-main {
          flex: 1;
          background-color: #f8f9fa;
          cursor: not-allowed;
        }

        .address-input-main:disabled {
          background-color: #f8f9fa;
          color: #6c757d;
        }

        .address-button {
          padding: 0.75rem 1rem;
          background-color: #1681ff;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.9rem;
          white-space: nowrap;
        }

        .address-button:hover {
          background-color: #1366cc;
        }

        .address-input {
          margin-top: 0.5rem;
        }

        .upload-section,
        .employment-section {
          padding: 1.5rem;
          border: 1px solid #e9ecef;
          border-radius: 4px;
          margin-bottom: 1rem;
        }

        .upload-title-section {
          margin-bottom: 1rem;
        }

        .file-input-group {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .file-display-input {
          flex: 1;
          background-color: #f8f9fa;
          cursor: default;
        }

        .file-display-input:focus {
          outline: none;
          border-color: #ddd;
          box-shadow: none;
        }

        .upload-info,
        .employment-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .upload-title {
          font-weight: 600;
          color: #333;
        }

        .upload-button {
          padding: 0.5rem 1.5rem;
          background-color: #1681ff;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.9rem;
          text-align: center;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .upload-button:hover {
          background-color: #1366cc;
        }

        .upload-description {
          font-size: 0.9rem;
          color: #666;
          line-height: 1.5;
          margin-bottom: 1rem;
        }

        .upload-description p {
          margin: 0.25rem 0;
        }

        .file-requirement {
          margin: 1rem 0;
        }

        .requirement-text {
          font-size: 0.9rem;
          color: #333;
          margin-bottom: 0.5rem;
        }

        .file-info {
          font-size: 0.8rem;
          color: #666;
          line-height: 1.4;
        }

        .highlight-red {
          color: #dc3545;
          font-weight: 600;
        }

        .file-buttons {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .file-btn {
          display: block;
          padding: 0.75rem 1rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          background-color: white;
          cursor: pointer;
          font-size: 0.9rem;
          text-align: center;
          text-decoration: none;
          color: inherit;
        }

        .file-btn:hover {
          background-color: #f8f9fa;
        }

        .phone-group {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .phone-input {
          flex: 1;
          max-width: 100px;
        }

        .checkbox-group {
          margin-top: 1rem;
        }

        .checkbox-option {
          display: flex;
          align-items: center;
          cursor: pointer;
        }

        .checkbox-option input[type="checkbox"] {
          margin-right: 0.5rem;
          transform: scale(1.2);
        }

        .checkbox-text {
          font-size: 1rem;
          color: #1681ff;
        }

        .info-section {
          background-color: #f8f9fa;
          border: 1px solid #e9ecef;
          border-radius: 4px;
          padding: 1.5rem;
          margin-bottom: 1rem;
        }

        .info-content {
          font-size: 0.9rem;
          color: #666;
          line-height: 1.5;
        }

        .info-content p {
          margin: 0.5rem 0;
        }

        .submit-section {
          padding: 2rem 0;
          text-align: center;
          background-color: transparent;
        }

        .submit-button {
          width: 100%;
          max-width: 400px;
          padding: 1rem 2rem;
          background-color: #1681ff;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          margin-bottom: 0;
        }

        .submit-button:hover {
          background-color: #1366cc;
        }

        .inquiry-section {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid #e9ecef;
        }

        .inquiry-link {
          color: #1681ff;
          text-decoration: underline;
          text-decoration-color: #1681ff;
          text-underline-offset: 2px;
          font-size: 0.9rem;
        }

        .inquiry-link:hover {
          color: #1366cc;
          text-decoration-color: #1366cc;
        }

        @media (max-width: 768px) {
          .business-verification-container {
            padding: 10px;
          }

          .bv-container {
            max-width: 100%;
          }

          .form-section {
            padding: 1.5rem 0;
          }

          .radio-group {
            flex-direction: column;
            gap: 1rem;
          }

          .address-search {
            flex-direction: column;
            gap: 1rem;
          }

          .address-input-main {
            margin-bottom: 0.5rem;
          }

          .file-buttons {
            gap: 1rem;
          }

          .phone-group {
            flex-wrap: wrap;
          }

          .file-input-group {
            flex-direction: column;
            gap: 1rem;
          }

          .section-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }

          body .main-content {
            padding-top: 120px !important;
          }
        }
      `}</style>
    </AdvertiserLoginRequiredGuard>
  );
}
