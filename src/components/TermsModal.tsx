"use client";

import React from "react";
import styles from "./TermsModal.module.css";

export type TermsType = "service" | "privacy" | "marketing";

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: TermsType;
}

const TermsModal: React.FC<TermsModalProps> = ({ isOpen, onClose, type }) => {
  if (!isOpen) return null;

  const getTermsContent = () => {
    switch (type) {
      case "service":
        return {
          title: "서비스 이용약관",
          content: (
            <div className={styles.termsContent}>
              <h3>제1조 목적</h3>
              <p>
                본 약관은 MTS플러스(이하 &ldquo;회사&rdquo;)가 제공하는 AI 기반
                타겟 마케팅 플랫폼의 이용조건 및 절차, 이용자와 회사 간의
                권리·의무 및 책임사항을 규정함을 목적으로 합니다.
              </p>

              <h3>제2조 정의</h3>
              <ul>
                <li>
                  <strong>&ldquo;서비스&rdquo;</strong>란 회사가 제공하는
                  B2B/B2C 대상 메시지 발송 및 타겟 마케팅 관련 모든 웹 포탈
                  기능을 의미합니다.
                </li>
                <li>
                  <strong>&ldquo;회원&rdquo;</strong>은 본 약관에 동의하고
                  회원가입을 완료한 개인 또는 법인을 의미합니다.
                </li>
              </ul>

              <h3>제3조 서비스의 제공</h3>
              <p>회사는 다음과 같은 서비스를 제공합니다:</p>
              <ul>
                <li>메시지 발송 서비스 (SMS, LMS, MMS, 알림톡, RCS 등)</li>
                <li>캠페인 생성 및 타겟 마케팅</li>
                <li>템플릿 생성 및 발송 관리</li>
                <li>리포트, 통계 및 분석 기능</li>
                <li>관리자 승인 기능</li>
                <li>결제 및 정산 기능 등</li>
              </ul>
              <p>
                서비스는 연중무휴, 1일 24시간 제공을 원칙으로 합니다. 단, 시스템
                점검이나 회사 사정에 따라 일시 중단될 수 있습니다.
              </p>

              <h3>제4조 이용자의 의무</h3>
              <ul>
                <li>
                  회원은 정확한 정보를 제공해야 하며, 타인의 정보를 무단으로
                  사용해서는 안 됩니다.
                </li>
                <li>
                  서비스 이용 시 관련 법령, 본 약관, 운영 정책을 준수해야
                  합니다.
                </li>
                <li>
                  메시지 발송 시 허위/과장 광고, 불법 스팸, 수신자 동의 없는
                  마케팅 등을 해서는 안 됩니다.
                </li>
              </ul>

              <h3>제5조 서비스 이용 제한 및 해지</h3>
              <p>
                회원이 약관을 위반하거나 부정 이용 시, 회사는 서비스 이용을
                제한하거나 회원 자격을 정지할 수 있습니다.
              </p>
            </div>
          ),
        };

      case "privacy":
        return {
          title: "개인정보 수집 및 이용 동의서",
          content: (
            <div className={styles.termsContent}>
              <h3>1. 수집 항목</h3>
              <ul>
                <li>
                  <strong>[회원정보]</strong> 이메일, 이름, 연락처, 비밀번호,
                  휴대폰 인증정보
                </li>
                <li>
                  <strong>[기업정보]</strong> 사업자등록번호, 사업자명,
                  대표자명, 업종, 담당자정보
                </li>
                <li>
                  <strong>[마케팅 데이터]</strong> 발송 이력, 캠페인 설정정보 등
                  서비스 이용기록
                </li>
              </ul>

              <h3>2. 수집 목적</h3>
              <ul>
                <li>회원가입 및 인증</li>
                <li>고객 관리 및 서비스 제공</li>
                <li>세금계산서 발행 및 법적 의무 이행</li>
                <li>시스템 보안 및 운영 안정성 확보</li>
              </ul>

              <h3>3. 보유 및 이용 기간</h3>
              <p>
                회원 탈퇴 시까지 또는 관련 법령에 따라 최대 5년 보관
                <br />
                단, 관계 법령에 따라 별도 보존이 필요한 경우 해당 기간 동안 보존
              </p>

              <h3>4. 동의를 거부할 권리 및 불이익</h3>
              <p>
                개인정보 수집·이용에 대한 동의를 거부할 수 있으며, 이 경우
                회원가입 및 서비스 이용이 제한될 수 있습니다.
              </p>
            </div>
          ),
        };

      case "marketing":
        return {
          title: "마케팅 정보 수집 및 활용 동의서",
          content: (
            <div className={styles.termsContent}>
              <h3>1. 수집 목적</h3>
              <ul>
                <li>
                  서비스 이용자에게 맞춤형 광고, 프로모션, 이벤트 안내 제공
                </li>
                <li>캠페인 최적화 및 응답률 향상을 위한 타겟팅 데이터 활용</li>
              </ul>

              <h3>2. 수집 및 활용 항목</h3>
              <ul>
                <li>이름, 이메일, 휴대폰 번호</li>
                <li>서비스 이용 기록, 캠페인 유형, 메시지 반응률</li>
              </ul>

              <h3>3. 전송 수단</h3>
              <ul>
                <li>이메일, 문자메시지(SMS/LMS), 알림톡, 앱 푸시</li>
              </ul>

              <h3>4. 보유 및 이용 기간</h3>
              <p>동의일로부터 회원 탈퇴 또는 동의 철회 시까지</p>

              <h3>5. 동의 철회</h3>
              <p>
                회원은 언제든지 마케팅 수신에 대한 동의를 철회할 수 있으며, 철회
                후에도 서비스 이용에는 영향을 미치지 않습니다.
              </p>
            </div>
          ),
        };

      default:
        return {
          title: "약관",
          content: <div>약관 내용을 불러올 수 없습니다.</div>,
        };
    }
  };

  const terms = getTermsContent();

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>{terms.title}</h2>
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </div>
        <div className={styles.modalBody}>{terms.content}</div>
        <div className={styles.modalFooter}>
          <button className={styles.confirmButton} onClick={onClose}>
            확인
          </button>
        </div>
      </div>
    </div>
  );
};

export default TermsModal;
