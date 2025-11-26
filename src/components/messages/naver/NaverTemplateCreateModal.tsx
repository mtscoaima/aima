"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Plus, Trash2, Upload, Image as ImageIcon, FileText, Calendar, Info } from "lucide-react";
import VariableSelectModal from "../../modals/VariableSelectModal";

interface NaverTemplateCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface NaverAccount {
  id: number;
  partner_key: string;
  talk_name: string | null;
}

interface Button {
  type: "WEB_LINK" | "APP_LINK";
  buttonCode: string;
  buttonName: string;
}

// BENEFIT 관련 타입 정의
type BenefitTemplateType = "BENEFIT" | "BENEFIT_LMS";
type BenefitCategoryType = "FASHION" | "BEAUTY" | "DIGITAL_APPLIANCE" | "LIVING" | "FOOD" | "KIDS" | "SPORTS_LEISURE" | "NECESSITIES" | "BOOK_HOBBY" | "FINANCE" | "ETC";
type BenefitType = "TIMESALE" | "GIFT" | "BONUS" | "BRANDDAY" | "EVENT" | "PRODUCT" | "DELIVERY" | "ORDER" | "POINT";
type DiscountType = "AMOUNT" | "RATE" | "POINT";
type ValidType = "PERIOD" | "EXPIRATION";

interface DiscountInfo {
  discountType: DiscountType;
  discountAmount?: number;
  discountRate?: number;
  pointAmount?: number;
}

interface ValidityInfo {
  validType: ValidType;
  validStartedAt?: string;
  validEndedAt?: string;
  validExpiration?: number;
}

// BENEFIT 카테고리 옵션
const BENEFIT_CATEGORY_OPTIONS: { value: BenefitCategoryType; label: string }[] = [
  { value: "FASHION", label: "패션" },
  { value: "BEAUTY", label: "뷰티" },
  { value: "DIGITAL_APPLIANCE", label: "디지털/가전" },
  { value: "LIVING", label: "생활" },
  { value: "FOOD", label: "식품" },
  { value: "KIDS", label: "키즈" },
  { value: "SPORTS_LEISURE", label: "스포츠/레저" },
  { value: "NECESSITIES", label: "생필품" },
  { value: "BOOK_HOBBY", label: "도서/취미" },
  { value: "FINANCE", label: "금융" },
  { value: "ETC", label: "기타" },
];

// BENEFIT 유형 옵션
const BENEFIT_TYPE_OPTIONS: { value: BenefitType; label: string; needsDiscount: boolean }[] = [
  { value: "TIMESALE", label: "타임세일", needsDiscount: false },
  { value: "GIFT", label: "사은품", needsDiscount: false },
  { value: "BONUS", label: "보너스", needsDiscount: false },
  { value: "BRANDDAY", label: "브랜드데이", needsDiscount: false },
  { value: "EVENT", label: "이벤트", needsDiscount: false },
  { value: "PRODUCT", label: "상품할인", needsDiscount: true },
  { value: "DELIVERY", label: "배송비할인", needsDiscount: true },
  { value: "ORDER", label: "주문할인", needsDiscount: true },
  { value: "POINT", label: "포인트적립", needsDiscount: true },
];

const NaverTemplateCreateModal: React.FC<NaverTemplateCreateModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [accounts, setAccounts] = useState<NaverAccount[]>([]);
  const [partnerKey, setPartnerKey] = useState("");
  const [code, setCode] = useState("");
  const [text, setText] = useState("");
  const [productCode, setProductCode] = useState<"INFORMATION" | "BENEFIT" | "CARDINFO">("INFORMATION");
  const [categoryCode, setCategoryCode] = useState("S001");
  const [buttons, setButtons] = useState<Button[]>([]);
  const [uploadedImageHashId, setUploadedImageHashId] = useState<string>("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isVariableModalOpen, setIsVariableModalOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // BENEFIT 전용 state
  const [benefitTemplateType, setBenefitTemplateType] = useState<BenefitTemplateType>("BENEFIT");
  const [benefitTitle, setBenefitTitle] = useState("");
  const [benefitCategoryType, setBenefitCategoryType] = useState<BenefitCategoryType>("ETC");
  const [benefitTypes, setBenefitTypes] = useState<BenefitType[]>([]);
  const [feedDisplayEndedAt, setFeedDisplayEndedAt] = useState("");
  const [feedImageHashId, setFeedImageHashId] = useState("");
  const [isUploadingFeedImage, setIsUploadingFeedImage] = useState(false);
  const [blockCallNumber, setBlockCallNumber] = useState("");
  const [blockMessageUrl, setBlockMessageUrl] = useState("");
  // 할인/적립 정보
  const [discountInfo, setDiscountInfo] = useState<DiscountInfo>({
    discountType: "AMOUNT",
    discountAmount: undefined,
    discountRate: undefined,
    pointAmount: undefined,
  });
  const [validityInfo, setValidityInfo] = useState<ValidityInfo>({
    validType: "PERIOD",
    validStartedAt: "",
    validEndedAt: "",
    validExpiration: undefined,
  });

  // 계정 목록 조회
  useEffect(() => {
    if (isOpen) {
      fetchAccounts();
    }
  }, [isOpen]);

  const fetchAccounts = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("/api/naver/accounts", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const result = await response.json();
      if (response.ok && result.success) {
        setAccounts(result.data || []);
        if (result.data && result.data.length > 0) {
          setPartnerKey(result.data[0].partner_key);
        }
      }
    } catch (error) {
      console.error("계정 조회 오류:", error);
    }
  };

  const handleAddButton = () => {
    if (buttons.length >= 5) {
      alert("버튼은 최대 5개까지 추가할 수 있습니다.");
      return;
    }

    setButtons([
      ...buttons,
      {
        type: "WEB_LINK",
        buttonCode: `BTN${buttons.length + 1}`.padStart(6, "0"),
        buttonName: "",
      },
    ]);
  };

  const handleRemoveButton = (index: number) => {
    setButtons(buttons.filter((_, i) => i !== index));
  };

  const handleButtonChange = (index: number, field: keyof Button, value: string) => {
    const newButtons = [...buttons];
    newButtons[index] = { ...newButtons[index], [field]: value };
    setButtons(newButtons);
  };

  // 이미지 업로드 핸들러
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!partnerKey) {
      setError('파트너키를 먼저 선택해주세요.');
      return;
    }

    // 파일 크기 검증 (5MB)
    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      setError('이미지 파일 크기는 5MB 이하여야 합니다.');
      return;
    }

    // 파일 타입 검증
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setError('지원하지 않는 이미지 형식입니다. (JPG, PNG, GIF만 가능)');
      return;
    }

    setIsUploadingImage(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/naver/image/upload?navertalkId=${partnerKey}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '이미지 업로드 실패');
      }

      setUploadedImageHashId(result.imageHashId);
      setSuccess('이미지 업로드 성공');

      // 3초 후 성공 메시지 제거
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      console.error('이미지 업로드 오류:', err);
      setError(err instanceof Error ? err.message : '이미지 업로드 중 오류가 발생했습니다.');
    } finally {
      setIsUploadingImage(false);
    }

    // 파일 입력 초기화
    e.target.value = '';
  };

  // 이미지 제거 핸들러
  const handleRemoveImage = () => {
    setUploadedImageHashId('');
    setSuccess('이미지가 제거되었습니다.');
    setTimeout(() => {
      setSuccess(null);
    }, 2000);
  };

  // BENEFIT 피드 이미지 업로드 핸들러
  const handleFeedImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!partnerKey) {
      setError('파트너키를 먼저 선택해주세요.');
      return;
    }

    // 파일 크기 검증 (5MB)
    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      setError('피드 이미지 파일 크기는 5MB 이하여야 합니다.');
      return;
    }

    // 파일 타입 검증
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      setError('피드 이미지는 JPG, PNG 형식만 가능합니다.');
      return;
    }

    setIsUploadingFeedImage(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/naver/image/upload?navertalkId=${partnerKey}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '피드 이미지 업로드 실패');
      }

      setFeedImageHashId(result.imageHashId);
      setSuccess('피드 이미지 업로드 성공');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('피드 이미지 업로드 오류:', err);
      setError(err instanceof Error ? err.message : '피드 이미지 업로드 중 오류가 발생했습니다.');
    } finally {
      setIsUploadingFeedImage(false);
    }

    e.target.value = '';
  };

  // BENEFIT 피드 이미지 제거 핸들러
  const handleRemoveFeedImage = () => {
    setFeedImageHashId('');
    setSuccess('피드 이미지가 제거되었습니다.');
    setTimeout(() => setSuccess(null), 2000);
  };

  // BENEFIT 유형 토글 (최대 2개)
  const toggleBenefitType = (type: BenefitType) => {
    if (benefitTypes.includes(type)) {
      setBenefitTypes(benefitTypes.filter(t => t !== type));
    } else {
      if (benefitTypes.length >= 2) {
        setError('혜택 유형은 최대 2개까지 선택할 수 있습니다.');
        setTimeout(() => setError(null), 3000);
        return;
      }
      setBenefitTypes([...benefitTypes, type]);
    }
  };

  // 할인/적립 정보가 필요한지 확인
  const requiresDiscountInfo = benefitTypes.some(type =>
    BENEFIT_TYPE_OPTIONS.find(opt => opt.value === type)?.needsDiscount
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 공통 유효성 검사
    if (!partnerKey) {
      setError("파트너키를 선택해주세요.");
      return;
    }

    if (!code.trim()) {
      setError("템플릿 코드를 입력해주세요.");
      return;
    }

    if (!text.trim()) {
      setError("템플릿 내용을 입력해주세요.");
      return;
    }

    // BENEFIT 전용 유효성 검사
    if (productCode === "BENEFIT") {
      if (!benefitTitle.trim()) {
        setError("혜택 제목을 입력해주세요.");
        return;
      }
      if (benefitTypes.length === 0) {
        setError("혜택 유형을 1개 이상 선택해주세요.");
        return;
      }
      if (!feedDisplayEndedAt) {
        setError("피드 표시 종료일을 선택해주세요.");
        return;
      }
      // 피드 표시 종료일은 현재로부터 최대 2주 이내
      const maxDate = new Date();
      maxDate.setDate(maxDate.getDate() + 14);
      if (new Date(feedDisplayEndedAt) > maxDate) {
        setError("피드 표시 종료일은 현재로부터 최대 2주 이내여야 합니다.");
        return;
      }
      if (!feedImageHashId) {
        setError("피드 이미지를 업로드해주세요. (598x300 해상도 권장)");
        return;
      }
      if (!blockCallNumber && !blockMessageUrl) {
        setError("수신거부 전화번호 또는 수신거부 URL 중 하나 이상 입력해주세요.");
        return;
      }
      // 할인/적립 정보 필수 체크
      if (requiresDiscountInfo) {
        if (discountInfo.discountType === "AMOUNT" && !discountInfo.discountAmount) {
          setError("할인 금액을 입력해주세요.");
          return;
        }
        if (discountInfo.discountType === "RATE" && !discountInfo.discountRate) {
          setError("할인율을 입력해주세요.");
          return;
        }
        if (discountInfo.discountType === "POINT" && !discountInfo.pointAmount) {
          setError("포인트 금액을 입력해주세요.");
          return;
        }
      }
    } else {
      // INFORMATION, CARDINFO는 categoryCode 필수
      if (!categoryCode) {
        setError("카테고리 코드를 선택해주세요.");
        return;
      }
    }

    setIsLoading(true);

    try {
      const token = localStorage.getItem("accessToken");

      // 요청 데이터 구성
      const requestData: Record<string, unknown> = {
        partnerKey,
        code: code.trim(),
        text: text.trim(),
        productCode,
        buttons: buttons.length > 0
          ? buttons.filter(btn => btn.buttonName.trim() !== '')
          : undefined,
        sampleImageHashId: uploadedImageHashId || undefined,
      };

      // BENEFIT 전용 데이터
      if (productCode === "BENEFIT") {
        requestData.templateType = benefitTemplateType;
        requestData.benefit = {
          categoryType: benefitCategoryType,
          benefitTypes: benefitTypes,
          feedDisplayEndedAt: feedDisplayEndedAt,
          feedDisplayImageHashId: feedImageHashId,
          title: benefitTitle.trim(),
          blockCallNumber: blockCallNumber || undefined,
          blockMessageUrl: blockMessageUrl || undefined,
        };

        // 할인/적립 정보 추가
        if (requiresDiscountInfo) {
          const benefitObj = requestData.benefit as Record<string, unknown>;
          benefitObj.discountType = discountInfo.discountType;
          if (discountInfo.discountType === "AMOUNT") {
            benefitObj.discountAmount = discountInfo.discountAmount;
          } else if (discountInfo.discountType === "RATE") {
            benefitObj.discountRate = discountInfo.discountRate;
          } else if (discountInfo.discountType === "POINT") {
            benefitObj.pointAmount = discountInfo.pointAmount;
          }

          // 유효기간 정보
          benefitObj.validType = validityInfo.validType;
          if (validityInfo.validType === "PERIOD") {
            benefitObj.validStartedAt = validityInfo.validStartedAt || undefined;
            benefitObj.validEndedAt = validityInfo.validEndedAt || undefined;
          } else {
            benefitObj.validExpiration = validityInfo.validExpiration || undefined;
          }
        }
      } else {
        // INFORMATION, CARDINFO
        requestData.categoryCode = categoryCode;
      }

      const response = await fetch("/api/messages/naver/templates/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "템플릿 생성 실패");
      }

      alert("네이버 톡톡 템플릿이 성공적으로 생성되었습니다.\nMTS 검수 후 사용 가능합니다.");
      handleReset();
      onSuccess();
      onClose();
    } catch (err) {
      console.error("템플릿 생성 오류:", err);
      setError(err instanceof Error ? err.message : "템플릿 생성 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setCode("");
    setText("");
    setProductCode("INFORMATION");
    setCategoryCode("S001");
    setButtons([]);
    setUploadedImageHashId("");
    setError(null);
    setSuccess(null);
    // BENEFIT 필드 초기화
    setBenefitTemplateType("BENEFIT");
    setBenefitTitle("");
    setBenefitCategoryType("ETC");
    setBenefitTypes([]);
    setFeedDisplayEndedAt("");
    setFeedImageHashId("");
    setBlockCallNumber("");
    setBlockMessageUrl("");
    setDiscountInfo({
      discountType: "AMOUNT",
      discountAmount: undefined,
      discountRate: undefined,
      pointAmount: undefined,
    });
    setValidityInfo({
      validType: "PERIOD",
      validStartedAt: "",
      validEndedAt: "",
      validExpiration: undefined,
    });
  };

  const handleVariableSelect = (variable: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newText = text.substring(0, start) + variable + text.substring(end);

    setText(newText);

    // Restore focus and cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + variable.length, start + variable.length);
    }, 0);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg w-full max-w-2xl m-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">네이버 톡톡 템플릿 생성</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
            disabled={isLoading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* 에러 메시지 */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              {error}
            </div>
          )}

          {/* 성공 메시지 */}
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-sm text-green-700">
              {success}
            </div>
          )}

          <div className="space-y-4">
            {/* 파트너 키 선택 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                네이버 톡톡 계정 <span className="text-red-500">*</span>
              </label>
              {accounts.length === 0 ? (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                  등록된 계정이 없습니다. 먼저 &quot;톡톡 아이디&quot; 탭에서 계정을 등록해주세요.
                </div>
              ) : (
                <select
                  value={partnerKey}
                  onChange={(e) => setPartnerKey(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  disabled={isLoading}
                  required
                >
                  <option value="">계정 선택...</option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.partner_key}>
                      {account.talk_name || account.partner_key}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* 템플릿 코드 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                템플릿 코드 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="예: TEST_TEMPLATE_001 (영문+숫자, 유니크)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                disabled={isLoading}
                required
              />
            </div>

            {/* 템플릿 내용 */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  템플릿 내용 <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsVariableModalOpen(true)}
                  className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                  title="치환문구 추가"
                  disabled={isLoading}
                >
                  <FileText className="w-4 h-4" />
                </button>
              </div>
              <textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="예: #{이름}님, 예약이 완료되었습니다.&#10;예약일시: #{오늘날짜}&#10;감사합니다."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 min-h-[100px]"
                disabled={isLoading}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                치환문구 버튼을 클릭하여 변수를 삽입할 수 있습니다.
              </p>
            </div>

            {/* 상품 코드 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                상품 코드 <span className="text-red-500">*</span>
              </label>
              <select
                value={productCode}
                onChange={(e) => setProductCode(e.target.value as "INFORMATION" | "BENEFIT" | "CARDINFO")}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                disabled={isLoading}
              >
                <option value="INFORMATION">정보성 - 알림 (INFORMATION) - 13원</option>
                <option value="BENEFIT">마케팅/광고 - 혜택 (BENEFIT) - 20원</option>
                <option value="CARDINFO">정보성 - 카드알림 (CARDINFO) - 13원</option>
              </select>
            </div>

            {/* 카테고리 코드 - INFORMATION, CARDINFO만 */}
            {productCode !== "BENEFIT" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  카테고리 코드 <span className="text-red-500">*</span>
                </label>
                <select
                  value={categoryCode}
                  onChange={(e) => setCategoryCode(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  disabled={isLoading}
                >
                  <optgroup label="숙박(S)">
                    <option value="S001">S001 - 예약완료</option>
                    <option value="S002">S002 - 예약취소</option>
                    <option value="S003">S003 - 바우처발송</option>
                    <option value="S004">S004 - 결제요청</option>
                  </optgroup>
                  <optgroup label="예약(T)">
                    <option value="T001">T001 - 예약완료</option>
                    <option value="T002">T002 - 예약취소</option>
                    <option value="T003">T003 - 바우처발송</option>
                    <option value="T004">T004 - 결제요청</option>
                  </optgroup>
                </select>
              </div>
            )}

            {/* ========== BENEFIT 전용 섹션 ========== */}
            {productCode === "BENEFIT" && (
              <div className="space-y-4 p-4 border border-orange-200 bg-orange-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="w-4 h-4 text-orange-600" />
                  <span className="text-sm font-semibold text-orange-800">혜택(BENEFIT) 전용 설정</span>
                </div>

                {/* 템플릿 유형 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    템플릿 유형 <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setBenefitTemplateType("BENEFIT")}
                      className={`flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                        benefitTemplateType === "BENEFIT"
                          ? "bg-orange-600 text-white border-orange-600"
                          : "bg-white text-gray-700 border-gray-300 hover:border-orange-400"
                      }`}
                      disabled={isLoading}
                    >
                      기본형 (360자)
                    </button>
                    <button
                      type="button"
                      onClick={() => setBenefitTemplateType("BENEFIT_LMS")}
                      className={`flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                        benefitTemplateType === "BENEFIT_LMS"
                          ? "bg-orange-600 text-white border-orange-600"
                          : "bg-white text-gray-700 border-gray-300 hover:border-orange-400"
                      }`}
                      disabled={isLoading}
                    >
                      LMS형 (2000자)
                    </button>
                  </div>
                </div>

                {/* 혜택 제목 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    혜택 제목 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={benefitTitle}
                    onChange={(e) => setBenefitTitle(e.target.value)}
                    placeholder="예: 특가 할인 이벤트"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    disabled={isLoading}
                    maxLength={50}
                  />
                  <p className="text-xs text-gray-500 mt-1">피드에 표시될 제목입니다 (최대 50자)</p>
                </div>

                {/* 혜택 카테고리 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    혜택 카테고리 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={benefitCategoryType}
                    onChange={(e) => setBenefitCategoryType(e.target.value as BenefitCategoryType)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    disabled={isLoading}
                  >
                    {BENEFIT_CATEGORY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 혜택 유형 (다중 선택, 최대 2개) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    혜택 유형 <span className="text-red-500">*</span>
                    <span className="text-xs font-normal text-gray-500 ml-1">(최대 2개 선택)</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {BENEFIT_TYPE_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => toggleBenefitType(opt.value)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                          benefitTypes.includes(opt.value)
                            ? "bg-orange-600 text-white border-orange-600"
                            : "bg-white text-gray-600 border-gray-300 hover:border-orange-400"
                        }`}
                        disabled={isLoading}
                      >
                        {opt.label}
                        {opt.needsDiscount && <span className="text-xs ml-1">💰</span>}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    💰 표시 항목 선택 시 할인/적립 정보 입력이 필요합니다.
                  </p>
                </div>

                {/* 피드 표시 종료일 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    피드 표시 종료일 <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="datetime-local"
                      value={feedDisplayEndedAt}
                      onChange={(e) => setFeedDisplayEndedAt(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      disabled={isLoading}
                    />
                    <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">현재로부터 최대 2주 이내로 설정 가능</p>
                </div>

                {/* 피드 이미지 업로드 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    피드 이미지 <span className="text-red-500">*</span>
                    <span className="text-xs font-normal text-gray-500 ml-1">(598x300 권장)</span>
                  </label>
                  {feedImageHashId ? (
                    <div className="border border-orange-300 rounded-lg p-3 bg-orange-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ImageIcon className="w-5 h-5 text-orange-600" />
                          <div>
                            <p className="text-sm font-medium text-gray-700">피드 이미지 업로드 완료</p>
                            <p className="text-xs text-gray-500">Hash ID: {feedImageHashId.substring(0, 20)}...</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveFeedImage}
                          className="text-red-500 hover:text-red-700"
                          disabled={isUploadingFeedImage || isLoading}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="cursor-pointer block">
                      <div className="border-2 border-dashed border-orange-300 rounded-lg p-4 text-center hover:border-orange-500 hover:bg-orange-100 transition-colors">
                        <Upload className="w-6 h-6 mx-auto text-orange-400 mb-1" />
                        <p className="text-sm text-gray-600">
                          {isUploadingFeedImage ? "업로드 중..." : "피드 이미지 업로드"}
                        </p>
                        <p className="text-xs text-gray-500">JPG, PNG (최대 5MB)</p>
                      </div>
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png"
                        onChange={handleFeedImageUpload}
                        className="hidden"
                        disabled={isUploadingFeedImage || isLoading || !partnerKey}
                      />
                    </label>
                  )}
                </div>

                {/* 수신거부 정보 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      수신거부 전화번호
                    </label>
                    <input
                      type="tel"
                      value={blockCallNumber}
                      onChange={(e) => setBlockCallNumber(e.target.value)}
                      placeholder="예: 0801234567"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      수신거부 URL
                    </label>
                    <input
                      type="url"
                      value={blockMessageUrl}
                      onChange={(e) => setBlockMessageUrl(e.target.value)}
                      placeholder="https://example.com/unsubscribe"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      disabled={isLoading}
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500">둘 중 하나 이상 필수 입력</p>

                {/* 할인/적립 정보 (조건부 표시) */}
                {requiresDiscountInfo && (
                  <div className="space-y-4 p-3 border border-yellow-200 bg-yellow-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Info className="w-4 h-4 text-yellow-600" />
                      <span className="text-sm font-semibold text-yellow-800">할인/적립 정보</span>
                    </div>

                    {/* 할인 유형 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        할인/적립 유형 <span className="text-red-500">*</span>
                      </label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setDiscountInfo({ ...discountInfo, discountType: "AMOUNT" })}
                          className={`flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                            discountInfo.discountType === "AMOUNT"
                              ? "bg-yellow-600 text-white border-yellow-600"
                              : "bg-white text-gray-700 border-gray-300 hover:border-yellow-400"
                          }`}
                          disabled={isLoading}
                        >
                          금액 할인
                        </button>
                        <button
                          type="button"
                          onClick={() => setDiscountInfo({ ...discountInfo, discountType: "RATE" })}
                          className={`flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                            discountInfo.discountType === "RATE"
                              ? "bg-yellow-600 text-white border-yellow-600"
                              : "bg-white text-gray-700 border-gray-300 hover:border-yellow-400"
                          }`}
                          disabled={isLoading}
                        >
                          비율 할인
                        </button>
                        <button
                          type="button"
                          onClick={() => setDiscountInfo({ ...discountInfo, discountType: "POINT" })}
                          className={`flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                            discountInfo.discountType === "POINT"
                              ? "bg-yellow-600 text-white border-yellow-600"
                              : "bg-white text-gray-700 border-gray-300 hover:border-yellow-400"
                          }`}
                          disabled={isLoading}
                        >
                          포인트 적립
                        </button>
                      </div>
                    </div>

                    {/* 금액/비율 입력 */}
                    <div>
                      {discountInfo.discountType === "AMOUNT" && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            할인 금액 (원) <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            value={discountInfo.discountAmount || ""}
                            onChange={(e) => setDiscountInfo({ ...discountInfo, discountAmount: parseInt(e.target.value) || undefined })}
                            placeholder="예: 5000"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                            disabled={isLoading}
                            min={0}
                          />
                        </div>
                      )}
                      {discountInfo.discountType === "RATE" && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            할인율 (%) <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            value={discountInfo.discountRate || ""}
                            onChange={(e) => setDiscountInfo({ ...discountInfo, discountRate: parseInt(e.target.value) || undefined })}
                            placeholder="예: 10"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                            disabled={isLoading}
                            min={1}
                            max={100}
                          />
                        </div>
                      )}
                      {discountInfo.discountType === "POINT" && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            포인트 금액 (P) <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            value={discountInfo.pointAmount || ""}
                            onChange={(e) => setDiscountInfo({ ...discountInfo, pointAmount: parseInt(e.target.value) || undefined })}
                            placeholder="예: 1000"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                            disabled={isLoading}
                            min={0}
                          />
                        </div>
                      )}
                    </div>

                    {/* 유효기간 유형 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        유효기간 유형
                      </label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setValidityInfo({ ...validityInfo, validType: "PERIOD" })}
                          className={`flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                            validityInfo.validType === "PERIOD"
                              ? "bg-yellow-600 text-white border-yellow-600"
                              : "bg-white text-gray-700 border-gray-300 hover:border-yellow-400"
                          }`}
                          disabled={isLoading}
                        >
                          기간 지정
                        </button>
                        <button
                          type="button"
                          onClick={() => setValidityInfo({ ...validityInfo, validType: "EXPIRATION" })}
                          className={`flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                            validityInfo.validType === "EXPIRATION"
                              ? "bg-yellow-600 text-white border-yellow-600"
                              : "bg-white text-gray-700 border-gray-300 hover:border-yellow-400"
                          }`}
                          disabled={isLoading}
                        >
                          발급 후 만료일
                        </button>
                      </div>
                    </div>

                    {/* 유효기간 입력 */}
                    {validityInfo.validType === "PERIOD" ? (
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">시작일</label>
                          <input
                            type="date"
                            value={validityInfo.validStartedAt}
                            onChange={(e) => setValidityInfo({ ...validityInfo, validStartedAt: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                            disabled={isLoading}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">종료일</label>
                          <input
                            type="date"
                            value={validityInfo.validEndedAt}
                            onChange={(e) => setValidityInfo({ ...validityInfo, validEndedAt: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                            disabled={isLoading}
                          />
                        </div>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          발급 후 만료일 (일)
                        </label>
                        <input
                          type="number"
                          value={validityInfo.validExpiration || ""}
                          onChange={(e) => setValidityInfo({ ...validityInfo, validExpiration: parseInt(e.target.value) || undefined })}
                          placeholder="예: 30"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                          disabled={isLoading}
                          min={1}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 이미지 업로드 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                이미지 첨부 (선택사항)
              </label>

              {uploadedImageHashId ? (
                <div className="border border-gray-300 rounded-lg p-3 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">이미지 업로드 완료</p>
                        <p className="text-xs text-gray-500">Hash ID: {uploadedImageHashId.substring(0, 20)}...</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="text-red-500 hover:text-red-700"
                      disabled={isUploadingImage || isLoading}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="cursor-pointer">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-500 hover:bg-green-50 transition-colors">
                      <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600 mb-1">
                        {isUploadingImage ? "업로드 중..." : "클릭하여 이미지 업로드"}
                      </p>
                      <p className="text-xs text-gray-500">
                        JPG, PNG, GIF (최대 5MB)
                      </p>
                    </div>
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/gif"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={isUploadingImage || isLoading || !partnerKey}
                    />
                  </label>
                  {!partnerKey && (
                    <p className="text-xs text-yellow-600 mt-1">
                      * 이미지 업로드는 파트너키 선택 후 가능합니다.
                    </p>
                  )}
                </div>
              )}
              <p className="text-xs text-gray-500 mt-2">
                템플릿에 포함될 이미지를 업로드하세요. 업로드된 이미지는 템플릿 검수 시 함께 제출됩니다.
              </p>
            </div>

            {/* 버튼 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  버튼 (선택사항, 최대 5개)
                </label>
                <button
                  type="button"
                  onClick={handleAddButton}
                  className="text-sm text-green-600 hover:text-green-700 flex items-center gap-1"
                  disabled={isLoading || buttons.length >= 5}
                >
                  <Plus className="w-4 h-4" />
                  버튼 추가
                </button>
              </div>

              {buttons.map((button, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-3 mb-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">버튼 #{index + 1}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveButton(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">버튼 타입</label>
                        <select
                          value={button.type}
                          onChange={(e) => handleButtonChange(index, "type", e.target.value as "WEB_LINK" | "APP_LINK")}
                          className="w-full px-2 py-1 text-sm border rounded"
                        >
                          <option value="WEB_LINK">웹 링크</option>
                          <option value="APP_LINK">앱 링크</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">버튼 코드</label>
                        <input
                          type="text"
                          value={button.buttonCode}
                          onChange={(e) => handleButtonChange(index, "buttonCode", e.target.value)}
                          placeholder="예: BTN000001"
                          className="w-full px-2 py-1 text-sm border rounded"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-gray-600 mb-1">버튼 이름</label>
                      <input
                        type="text"
                        value={button.buttonName}
                        onChange={(e) => handleButtonChange(index, "buttonName", e.target.value)}
                        placeholder="예: 예약 확인하기"
                        className="w-full px-2 py-1 text-sm border rounded"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    * 버튼 URL은 메시지 발송 시 설정합니다.
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* 버튼 */}
          <div className="flex gap-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              disabled={isLoading}
            >
              취소
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              disabled={isLoading || accounts.length === 0}
            >
              {isLoading ? "생성 중..." : "템플릿 생성"}
            </button>
          </div>
        </form>

        {/* Variable Select Modal */}
        <VariableSelectModal
          isOpen={isVariableModalOpen}
          onClose={() => setIsVariableModalOpen(false)}
          onSelect={handleVariableSelect}
        />
      </div>
    </div>
  );
};

export default NaverTemplateCreateModal;
