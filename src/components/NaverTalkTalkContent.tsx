"use client";

/* eslint-disable @typescript-eslint/no-unused-vars */

import React, { useState, useRef, useEffect, Suspense } from "react";
import Image from "next/image";
import { Sparkles, X } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import SuccessModal from "@/components/SuccessModal";
import { PaymentModal } from "@/components/PaymentModal";
import { useBalance } from "@/contexts/BalanceContext";
import {
  targetOptions,
  generateBatchTimeOptions,
  batchSendDateOptions,
  getDistrictsByCity,
  getIndustriesByTopLevel,
} from "@/lib/targetOptions";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  imageUrl?: string;
  isImageLoading?: boolean;
}

interface GeneratedTemplate {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  createdAt: Date;
  status: "생성완료" | "전송준비" | "전송완료";
}

interface Package {
  id: string;
  name: string;
  credits: number;
  price: number;
  bonus: number;
  isPopular?: boolean;
}

// 스타일 모듈
const styles = {
  targetMarketingContainer: "target-marketing-container",
  targetMarketingHeader: "target-marketing-header",
  landingHeader: "landing-header",
  targetMarketingContent: "target-marketing-content",
  chatSection: "chat-section",
  chatMessages: "chat-messages",
  message: "message",
  userMessage: "user-message",
  assistantMessage: "assistant-message",
  messageContent: "message-content",
  messageImage: "message-image",
  imageLoadingOverlay: "image-loading-overlay",
  loadingSpinner: "loading-spinner",
  typingIndicator: "typing-indicator",
  chatInputSection: "chat-input-section",
  inputWrapper: "input-wrapper",
  chatInput: "chat-input",
  sendButton: "send-button",
  inputHelp: "input-help",
  mmsSendContainer: "mms-send-container",
  mmsSendSection: "mms-send-section",
  templatePreviewCard: "template-preview-card",
  templateBadge: "template-badge",
  templateCardContent: "template-card-content",
  templateImage: "template-image",
  imageGeneratingOverlay: "image-generating-overlay",
  templateImagePlaceholder: "template-image-placeholder",
  placeholderContent: "placeholder-content",
  templateInfo: "template-info",
  templateTitle: "template-title",
  templateDescription: "template-description",
  templateDescriptionTextarea: "template-description-textarea",
  charCount: "char-count",
  templateActions: "template-actions",
  templateActionButton: "template-action-button",
  targetRecommendationCard: "target-recommendation-card",
  targetFiltersSection: "target-filters-section",
  sectionTitle: "section-title",
  filterRow: "filter-row",
  filterGroup: "filter-group",
  filterLabel: "filter-label",
  filterSelect: "filter-select",
  cardAmountSection: "card-amount-section",
  amountCardOptions: "amount-card-options",
  amountCard: "amount-card",
  amountCardLabel: "amount-card-label",
  amountCardRadio: "amount-card-radio",
  radioCircle: "radio-circle",
  selected: "selected",
  checked: "checked",
  customAmountInput: "custom-amount-input",
  customAmountWrapper: "custom-amount-wrapper",
  customAmountField: "custom-amount-field",
  customAmountUnit: "custom-amount-unit",
  customAmountHint: "custom-amount-hint",
  cardTimeSection: "card-time-section",
  timeSelectors: "time-selectors",
  timeGroup: "time-group",
  timeSelect: "time-select",
  timeSeparator: "time-separator",
  costEstimationSection: "cost-estimation-section",
  costLabel: "cost-label",
  costValue: "cost-value",
  costAmount: "cost-amount",
  costUnit: "cost-unit",
  approvalButtonSection: "approval-button-section",
  approvalButton: "approval-button",
  primary: "primary",
  modalOverlay: "modal-overlay",
  modalContent: "modal-content",
  approvalModal: "approval-modal",
  modalHeader: "modal-header",
  modalClose: "modal-close",
  modalBody: "modal-body",
  policyDescription: "policy-description",
  policyOptions: "policy-options",
  checkboxLabel: "checkbox-label",
  checkbox: "checkbox",
  validitySection: "validity-section",
  dateInputs: "date-inputs",
  dateInput: "date-input",
  periodButtons: "period-buttons",
  periodButton: "period-button",
  active: "active",
  recipientLimitSection: "recipient-limit-section",
  recipientInput: "recipient-input",
  batchSection: "batch-section",
  batchInfo: "batch-info",
  batchContentContainer: "batch-content-container",
  batchSelectors: "batch-selectors",
  batchSelect: "batch-select",
  targetCountInfo: "target-count-info",
  adRecipientSection: "ad-recipient-section",
  adRecipientInput: "ad-recipient-input",
  adRecipientNotice: "ad-recipient-notice",
  costSummary: "cost-summary",
  costRow: "cost-row",
  balanceAmount: "balance-amount",
  balanceUnit: "balance-unit",
  chargeNoticeText: "charge-notice-text",
  chargeButton: "charge-button",
  modalFooter: "modal-footer",
  cancelButton: "cancel-button",
  paymentModalWrapper: "payment-modal-wrapper",
};

// 메인 컨텐츠 컴포넌트
function NaverTalkTalkContentInternal() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    balanceData,
    isLoading: isLoadingCredits,
    refreshTransactions,
  } = useBalance();

  const [messages, setMessages] = useState<Message[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showTypingIndicator, setShowTypingIndicator] = useState(false);
  const [smsTextContent, setSmsTextContent] = useState("");
  const [currentGeneratedImage, setCurrentGeneratedImage] = useState<
    string | null
  >(null);

  const [isFromTemplate, setIsFromTemplate] = useState(false);
  const [templates, setTemplates] = useState<GeneratedTemplate[]>([]);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [sendPolicy, setSendPolicy] = useState<"realtime" | "batch">(
    "realtime"
  );
  const [validityStartDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [validityEndDate, setValidityEndDate] = useState(() => {
    const today = new Date();
    const oneWeekLater = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    return oneWeekLater.toISOString().split("T")[0];
  });
  const [maxRecipients, setMaxRecipients] = useState("30");
  const [selectedPeriod, setSelectedPeriod] = useState<
    "week" | "month" | "year"
  >("week");

  // 타겟 필터 상태들
  const [targetGender, setTargetGender] = useState("all");
  const [targetAge, setTargetAge] = useState("all");
  const [targetCity, setTargetCity] = useState("all");
  const [targetDistrict, setTargetDistrict] = useState("all");
  const [targetTopLevelIndustry, setTargetTopLevelIndustry] = useState("all");
  const [targetIndustry, setTargetIndustry] = useState("all");
  const [cardAmount, setCardAmount] = useState("10000");
  const [customAmount, setCustomAmount] = useState("50");
  const [cardStartTime, setCardStartTime] = useState("08:00");
  const [cardEndTime, setCardEndTime] = useState("18:00");

  // 승인 신청 처리 상태
  const [isSubmittingApproval, setIsSubmittingApproval] = useState(false);

  // 성공 모달 상태
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // 템플릿 제목 상태
  const [templateTitle, setTemplateTitle] = useState("AI 생성 콘텐츠");

  // 기존 템플릿 ID 상태 (템플릿 사용하기로 온 경우)
  const [existingTemplateId, setExistingTemplateId] = useState<number | null>(
    null
  );

  // 크레딧 관련 상태
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);

  // BalanceContext에서 크레딧 정보 가져오기
  const userCredits = balanceData.balance;

  // 이미지 생성 로딩 상태 추가
  const [isImageGenerating, setIsImageGenerating] = useState(false);

  //상태 추가 (일괄 발송 관련)
  const [batchSendDate, setBatchSendDate] = useState("오늘+3일");
  const [batchSendTime, setBatchSendTime] = useState("00:00");
  const [targetCount, setTargetCount] = useState(500); // 타겟 대상자 수
  const [adRecipientCount, setAdRecipientCount] = useState(30); // 광고 수신자 수

  const chatMessagesRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const prevMessagesLengthRef = useRef(0);

  // URL에서 id 추출
  const chatId = window.location.pathname.split("/").pop();

  // 여기에 모든 함수들을 추가... (handleSendMessage, analyzeTargetContent 등)
  // 간단히 하기 위해 핵심 JSX만 포함

  return (
    <div className={styles.targetMarketingContainer}>
      <div className={styles.targetMarketingContent}>
        {/* 좌측: AI 채팅 영역 */}
        <div className={styles.chatSection}>
          <div className={styles.chatMessages} ref={chatMessagesRef}>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`${styles.message} ${
                  message.role === "user"
                    ? styles.userMessage
                    : styles.assistantMessage
                }`}
              >
                <div className={styles.messageContent}>
                  {message.imageUrl && (
                    <div className={styles.messageImage}>
                      <Image
                        src={message.imageUrl}
                        alt="Generated content"
                        width={300}
                        height={200}
                        style={{ objectFit: "cover" }}
                      />
                      {message.isImageLoading && (
                        <div className={styles.imageLoadingOverlay}>
                          <div className={styles.loadingSpinner}></div>
                          <span>이미지 생성 중...</span>
                        </div>
                      )}
                    </div>
                  )}
                  <p>{message.content}</p>
                </div>
              </div>
            ))}
            {showTypingIndicator && (
              <div className={`${styles.message} ${styles.assistantMessage}`}>
                <div className={styles.messageContent}>
                  <div className={styles.typingIndicator}>
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className={styles.chatInputSection}>
            <div className={styles.inputWrapper}>
              <textarea
                ref={textareaRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    // handleSendMessage();
                  }
                }}
                placeholder="어떤 광고를 만들고 싶나요?"
                className={styles.chatInput}
                rows={3}
                disabled={isLoading || showTypingIndicator}
              />
              <button
                onClick={() => {
                  // handleSendMessage();
                }}
                disabled={!inputMessage.trim() || isLoading}
                className={styles.sendButton}
              >
                입력
              </button>
            </div>
            <div className={styles.inputHelp}>
              <Sparkles size={14} />
              <span>AI가 이미지 생성, 편집과 마케팅 문구를 도와드립니다</span>
            </div>
          </div>
        </div>

        {/* 우측: 캠페인 설정 영역 */}
        <div className={styles.mmsSendContainer}>
          <div className={styles.mmsSendSection}>
            {/* 템플릿 미리보기 카드 */}
            <div className={styles.templatePreviewCard}>
              <div className={styles.templateBadge}>템플릿 생성결과</div>
              <div className={styles.templateCardContent}>
                {currentGeneratedImage ? (
                  <div className={styles.templateImage}>
                    <Image
                      src={currentGeneratedImage}
                      alt="생성된 템플릿 이미지"
                      width={300}
                      height={200}
                      style={{ objectFit: "cover" }}
                    />
                    {isImageGenerating && (
                      <div className={styles.imageGeneratingOverlay}>
                        <div className={styles.loadingSpinner}></div>
                        <span>이미지 생성 중...</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className={styles.templateImagePlaceholder}>
                    <div className={styles.placeholderContent}>
                      {isImageGenerating ? (
                        <>
                          <div className={styles.loadingSpinner}></div>
                          <span>AI가 이미지를 생성하고 있습니다...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles size={32} />
                          <span>AI가 이미지를 생성하면 여기에 표시됩니다</span>
                        </>
                      )}
                    </div>
                  </div>
                )}
                <div className={styles.templateInfo}>
                  <h3 className={styles.templateTitle}>{templateTitle}</h3>
                  <div className={styles.templateDescription}>
                    <textarea
                      value={smsTextContent || ""}
                      onChange={(e) => setSmsTextContent(e.target.value)}
                      placeholder="AI가 생성한 마케팅 콘텐츠가 여기에 표시됩니다."
                      className={styles.templateDescriptionTextarea}
                      rows={4}
                    />
                    <span className={styles.charCount}>
                      {new Blob([smsTextContent]).size} / 2,000 bytes
                    </span>
                  </div>
                </div>

                {/* 템플릿 액션 버튼들 */}
                <div className={styles.templateActions}>
                  <button className={styles.templateActionButton}>
                    템플릿 불러오기
                  </button>
                  <button className={styles.templateActionButton}>
                    이미지 편집
                  </button>
                  <button className={styles.templateActionButton}>
                    템플릿 저장
                  </button>
                </div>
              </div>
            </div>

            {/* 승인 신청 버튼 */}
            <div className={styles.approvalButtonSection}>
              <button
                className={`${styles.approvalButton} ${styles.primary}`}
                onClick={() => {
                  if (smsTextContent.trim() && currentGeneratedImage) {
                    setShowApprovalModal(true);
                  } else {
                    alert("템플릿 내용을 먼저 생성해주세요.");
                  }
                }}
              >
                승인 신청
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 성공 모달 */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="승인 요청이 완료되었습니다"
        message="캠페인 승인 요청이 성공적으로 제출되었습니다."
        buttonText="확인"
      />

      {/* 결제 모달 */}
      <div
        className={styles.paymentModalWrapper}
        style={{
          display: isPaymentModalOpen ? "block" : "none",
          zIndex: 1010,
        }}
      >
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          packageInfo={selectedPackage}
          redirectUrl={window.location.pathname}
        />
      </div>
    </div>
  );
}

// Suspense로 감싼 메인 컴포넌트
export default function NaverTalkTalkContent() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NaverTalkTalkContentInternal />
    </Suspense>
  );
}
