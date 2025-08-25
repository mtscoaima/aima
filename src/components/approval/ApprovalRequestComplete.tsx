"use client";

import React from "react";
import { useRouter } from "next/navigation";
import styles from "./ApprovalRequestComplete.module.css";

interface ApprovalRequestCompleteProps {
  onGoBack?: () => void;
  onConfirm?: () => void;
}

const ApprovalRequestComplete: React.FC<ApprovalRequestCompleteProps> = ({
  onGoBack,
  onConfirm,
}) => {
  const router = useRouter();

  const handleGoBack = () => {
    if (onGoBack) {
      onGoBack();
    } else {
      // 기본적으로 이전 페이지로 돌아가기
      router.back();
    }
  };

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    } else {
      // 기본적으로 캠페인 관리 탭으로 이동
      router.push("/target-marketing?tab=campaign-management");
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {/* 성공 아이콘 */}
        <div className={styles.iconContainer}>
          <div className={styles.successIcon}>
            👏
          </div>
        </div>

        {/* 메시지 */}
        <div className={styles.messageContainer}>
          <h1 className={styles.title}>승인 요청이 완료되었습니다</h1>
        </div>

        {/* 버튼 영역 */}
        <div className={styles.buttonContainer}>
                     <button 
             className={styles.backButton}
             onClick={handleGoBack}
           >
             <span className={styles.backIcon}>&lt;</span>
             이전으로 가기
           </button>
          <button 
            className={styles.confirmButton}
            onClick={handleConfirm}
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApprovalRequestComplete;
