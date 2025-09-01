"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AdvertiserLoginRequiredGuard } from "@/components/RoleGuard";
import { useAuth } from "@/contexts/AuthContext";
import { tokenManager, getUserInfo, UserInfoResponse } from "@/lib/api";

// 타입 정의
interface BusinessDetails {
  name?: string;
  representativeName?: string;
  address?: string;
  sector?: string;
  taxType?: string;
  estimatedType?: string;
  isActive?: boolean;
  [key: string]: string | boolean | undefined;
}

// 모달 컴포넌트
interface AlertModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onClose: () => void;
}

const AlertModal: React.FC<AlertModalProps> = ({
  isOpen,
  title,
  message,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 backdrop-blur-sm flex justify-center items-center z-50"
      style={{ backgroundColor: "rgba(0,0,0,0.35)" }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white rounded-lg p-0 max-w-96 w-4/5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 pt-6 pb-0 border-b border-gray-200">
          <h3 className="m-0 text-xl font-semibold text-gray-700 pb-4">{title}</h3>
        </div>
        <div className="px-6 py-6">
          <p className="m-0 leading-relaxed text-gray-700 whitespace-pre-line">{message}</p>
        </div>
        <div className="px-6 pb-6 flex justify-end">
          <button
            type="button"
            className="px-6 py-2 bg-blue-500 text-white border-none rounded cursor-pointer text-sm hover:bg-blue-600"
            onClick={onClose}
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
};

export default function BusinessVerificationPage() {
  const { user } = useAuth();
  const router = useRouter();

  // 기존 데이터 로드 완료 여부
  const [isInitialized, setIsInitialized] = useState(false);
  
  // 인증 신청 성공 상태
  const [isSubmissionSuccess, setIsSubmissionSuccess] = useState(false);

  const [businessType, setBusinessType] = useState("individual");
  const [businessName, setBusinessName] = useState("");
  const [representativeName, setRepresentativeName] = useState("");
  const [businessNumber, setBusinessNumber] = useState("");
  const [address, setAddress] = useState("");
  const [businessCategory, setBusinessCategory] = useState("");
  const [businessType2, setBusinessType2] = useState("");
  const [homepage, setHomepage] = useState("");
  const [managerName, setManagerName] = useState("");
  const [managerPhone, setManagerPhone] = useState("");
  const [managerEmail, setManagerEmail] = useState("");
  const [usePersonalInfo, setUsePersonalInfo] = useState(false);

  // 파일 첨부 상태
  const [businessDocumentFile, setBusinessDocumentFile] = useState<File | null>(
    null
  );
  const [employmentDocumentFile, setEmploymentDocumentFile] =
    useState<File | null>(null);

  // 기존 문서 정보 상태
  const [existingBusinessDocument, setExistingBusinessDocument] = useState<{
    fileName: string;
    fileSize: number;
    fileType: string;
  } | null>(null);
  const [existingEmploymentDocument, setExistingEmploymentDocument] = useState<{
    fileName: string;
    fileSize: number;
    fileType: string;
  } | null>(null);

  // 주소 검색 모달 상태
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [searchAddress, setSearchAddress] = useState("");
  const [roadAddress, setRoadAddress] = useState("");
  const [detailAddress, setDetailAddress] = useState("");

  // 사업자등록번호 검증 관련 상태
  const [isBusinessNumberVerified, setIsBusinessNumberVerified] =
    useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");

  // 자동입력 관련 상태 (현재 미사용 - 향후 다른 API 연동 시 사용 예정)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [pendingBusinessDetails, setPendingBusinessDetails] =
    useState<BusinessDetails | null>(null);
  const [autoFilledFields, setAutoFilledFields] = useState<string[]>([]);

  // 가입자 정보와 동일 체크박스 처리
  useEffect(() => {
    if (usePersonalInfo && user) {
      // 체크박스가 체크되고 사용자 정보가 있을 때 자동으로 채우기
      setManagerName(user.name || "");
      setManagerEmail(user.email || "");

      // 전화번호 처리 (010-1234-5678 형태를 분리)
      if (user.phoneNumber) {
        const phoneMatch = user.phoneNumber.match(
          /^(\d{3})-?(\d{3,4})-?(\d{4})$/
        );
        if (phoneMatch) {
          setManagerPhone(`${phoneMatch[1]}-${phoneMatch[2]}-${phoneMatch[3]}`);
        } else {
          setManagerPhone(user.phoneNumber);
        }
      }
    } else if (!usePersonalInfo) {
      // 체크박스가 해제되면 필드 초기화
      setManagerName("");
      setManagerPhone("");
      setManagerEmail("");
    }
  }, [usePersonalInfo, user]);

  // 주소 업데이트 (도로명 주소 + 상세 주소)
  useEffect(() => {
    const fullAddress =
      roadAddress + (detailAddress ? ` ${detailAddress}` : "");
    setAddress(fullAddress);
  }, [roadAddress, detailAddress]);

  // 회사 정보 존재 여부 확인 함수
  const hasCompanyInfo = (userData: UserInfoResponse | null): boolean => {
    if (!userData?.companyInfo) {
      return false;
    }

    // 필수 정보 중 하나라도 있으면 회사 정보가 있다고 판단
    const { companyName, ceoName, businessNumber } = userData.companyInfo;
    return !!(companyName || ceoName || businessNumber);
  };

  // 사용자 정보 로드 및 기존 데이터로 폼 채우기
  useEffect(() => {
    const loadUserData = async () => {
      if (isInitialized) return; // 이미 초기화된 경우 재실행 방지

      try {
        const userInfo = await getUserInfo();

        // 미인증 상태가 아닌 경우에만 기존 데이터로 폼 채우기
        if (hasCompanyInfo(userInfo)) {
          const { companyInfo, taxInvoiceInfo, documents } = userInfo;

          // 기업정보 설정
          if (companyInfo) {
            const companyInfoData = companyInfo as Record<string, unknown>;
            
            setBusinessType(companyInfo.businessType || "individual");
            setBusinessName(companyInfo.companyName || "");
            setRepresentativeName(companyInfo.ceoName || "");
            setBusinessNumber(companyInfo.businessNumber || "");
            setBusinessCategory(typeof companyInfoData.businessCategory === 'string' ? companyInfoData.businessCategory : "");
            setBusinessType2(typeof companyInfoData.businessType2 === 'string' ? companyInfoData.businessType2 : "");
            setHomepage(companyInfo.homepage || "");

            // 주소 정보 설정
            if (companyInfo.companyAddress) {
              setAddress(companyInfo.companyAddress);
              setRoadAddress(companyInfo.companyAddress);
              // detailAddress는 기본값 그대로 사용
            }
          }

          // 세금계산서 담당자 정보 설정
          if (taxInvoiceInfo) {
            setManagerName(taxInvoiceInfo.manager || "");
            setManagerPhone(taxInvoiceInfo.contact || "");
            setManagerEmail(taxInvoiceInfo.email || "");
          }

          // 기존 문서 정보 설정
          if (documents) {
            if (documents.businessRegistration) {
              setExistingBusinessDocument({
                fileName: documents.businessRegistration.fileName,
                fileSize: 0, // API 응답에 fileSize가 없으므로 기본값
                fileType: "", // API 응답에 fileType이 없으므로 기본값
              });
            }

            if (documents.employmentCertificate) {
              setExistingEmploymentDocument({
                fileName: documents.employmentCertificate.fileName,
                fileSize: 0, // API 응답에 fileSize가 없으므로 기본값
                fileType: "", // API 응답에 fileType이 없으므로 기본값
              });
            }
          }

          // 사업자등록번호가 있으면 검증 완료 상태로 설정
          if (companyInfo?.businessNumber) {
            setIsBusinessNumberVerified(true);
            setVerificationMessage("사업자등록번호 확인 완료");
          }
        }

        setIsInitialized(true);
      } catch (error) {
        console.error("사용자 정보 로드 실패:", error);
        setIsInitialized(true);
      }
    };

    if (user && !isInitialized) {
      loadUserData();
    }
  }, [user, isInitialized]);

  // 파일을 Base64로 변환하는 함수
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // data:image/jpeg;base64, 부분을 제거하고 base64 데이터만 반환
        const base64Data = result.split(",")[1];
        resolve(base64Data);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  // 사업자등록번호 포맷팅 (숫자만 입력, 하이픈 자동 추가)
  const formatBusinessNumber = (value: string) => {
    const numbers = value.replace(/[^0-9]/g, "");
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 5)
      return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 5)}-${numbers.slice(
      5,
      10
    )}`;
  };

  // 주소 파싱 함수 (도로명 주소와 상세 주소 분리)
  const parseAddress = (fullAddress: string) => {
    // 기본적으로 전체 주소를 도로명 주소로 설정
    return {
      roadAddress: fullAddress.trim(),
      detailAddress: "",
    };
  };

  // 자동입력 확인 함수 (현재 미사용 - 향후 다른 API 연동 시 사용 예정)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const confirmAutoFill = (businessDetails: BusinessDetails) => {
    setPendingBusinessDetails(businessDetails);

    // 자동입력 가능한 필드들 확인
    const availableFields = [];
    if (businessDetails.name) availableFields.push("상호");
    if (businessDetails.representativeName) availableFields.push("대표자명");
    if (businessDetails.address) availableFields.push("주소");
    if (businessDetails.sector) availableFields.push("업태");

    if (availableFields.length > 0) {
      const fieldList = availableFields.join(", ");
      const confirmMessage = `조회된 사업자 정보로 자동 입력하시겠습니까?\n\n자동입력 가능 항목: ${fieldList}\n\n※ 자동입력 후에도 수정이 가능합니다.`;

      if (window.confirm(confirmMessage)) {
        autoFillBusinessInfo(businessDetails);
      }
    }
  };

  // 자동입력 실행 함수 (현재 미사용 - 향후 다른 API 연동 시 사용 예정)
  const autoFillBusinessInfo = (businessDetails: BusinessDetails) => {
    const filledFields: string[] = [];

    try {
      // 상호 자동입력
      if (businessDetails.name && businessDetails.name.trim()) {
        setBusinessName(businessDetails.name.trim());
        filledFields.push("businessName");
      }

      // 대표자명 자동입력 (개인사업자인 경우)
      if (
        businessDetails.representativeName &&
        businessDetails.representativeName.trim()
      ) {
        setRepresentativeName(businessDetails.representativeName.trim());
        filledFields.push("representativeName");
      }

      // 주소 자동입력
      if (businessDetails.address && businessDetails.address.trim()) {
        const addressInfo = parseAddress(businessDetails.address);
        setRoadAddress(addressInfo.roadAddress);
        setDetailAddress(addressInfo.detailAddress);
        filledFields.push("address");
      }

      // 업태 자동입력
      if (businessDetails.sector && businessDetails.sector.trim()) {
        setBusinessCategory(businessDetails.sector.trim());
        filledFields.push("businessCategory");
      }

      // 자동입력된 필드 목록 저장
      setAutoFilledFields(filledFields);

      // 성공 메시지 표시
      showAlertModal(
        "자동입력 완료",
        `사업자 정보가 자동으로 입력되었습니다.\n\n입력된 정보를 확인하시고 필요시 수정해주세요.`
      );
    } catch (error) {
      console.error("자동입력 중 오류:", error);
      showAlertModal("오류", "자동입력 중 오류가 발생했습니다.");
    }
  };

  // 자동입력 취소 함수 (현재 미사용 - 향후 사용 예정)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const cancelAutoFill = () => {
    if (autoFilledFields.length === 0) return;

    const confirmCancel = window.confirm(
      "자동입력된 정보를 모두 초기화하시겠습니까?"
    );
    if (!confirmCancel) return;

    // 자동입력된 필드들 초기화
    autoFilledFields.forEach((field: string) => {
      switch (field) {
        case "businessName":
          setBusinessName("");
          break;
        case "representativeName":
          setRepresentativeName("");
          break;
        case "address":
          setRoadAddress("");
          setDetailAddress("");
          break;
        case "businessCategory":
          setBusinessCategory("");
          break;
      }
    });

    setAutoFilledFields([]);
    showAlertModal("초기화 완료", "자동입력된 정보가 초기화되었습니다.");
  };

  // 사업자등록번호 입력 핸들러
  const handleBusinessNumberChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const formatted = formatBusinessNumber(e.target.value);
    setBusinessNumber(formatted);
    // 번호가 변경되면 검증 상태 초기화
    if (isBusinessNumberVerified) {
      setIsBusinessNumberVerified(false);
      setVerificationMessage("");
    }
  };

  // 사업자등록번호 검증 함수
  const verifyBusinessNumber = async () => {
    // 입력값 검증
    const cleanNumber = businessNumber.replace(/[^0-9]/g, "");

    if (!cleanNumber) {
      showAlertModal("알림", "사업자등록번호를 입력해주세요.");
      return;
    }

    if (cleanNumber.length !== 10) {
      showAlertModal("알림", "사업자등록번호는 10자리 숫자여야 합니다.");
      return;
    }

    setIsVerifying(true);

    try {
      // 공공데이터 포털 API 호출
      const data = {
        b_no: [cleanNumber],
      };

      const response = await fetch(
        "/api/business-verification/verify-business-number", // 프록시 API 엔드포인트
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        }
      );

      const result = await response.json();

      if (response.ok && result.match_cnt > 0) {
        // 검증 성공
        const businessInfo = result.data[0];
        let statusMessage = "";
        let detailMessage = "";

        // 사업자 상태에 따른 메시지 설정
        if (businessInfo.b_stt_cd === "01") {
          statusMessage = "정상운영중";
          detailMessage =
            "사업자등록번호가 확인되었습니다.\n현재 정상적으로 운영 중인 사업자입니다.";
        } else if (businessInfo.b_stt_cd === "02") {
          statusMessage = "일시 휴업 상태";
          detailMessage =
            "사업자등록번호가 확인되었습니다.\n현재 일시적으로 휴업 신고된 상태입니다.";
        } else if (businessInfo.b_stt_cd === "03") {
          statusMessage = "폐업 상태";
          detailMessage =
            "사업자등록번호가 확인되었습니다.\n현재 폐업 처리된 상태입니다.";
        } else {
          statusMessage = "확인 완료";
          detailMessage = "사업자등록번호가 확인되었습니다.";
        }

        setIsBusinessNumberVerified(true);
        setVerificationMessage(`사업자등록번호 확인 완료 - ${statusMessage}`);

        // API 제한사항 안내
        if (result.businessDetails) {
          const details = result.businessDetails;

          // 상세 메시지에 API 제한사항 포함
          let enhancedMessage = detailMessage;

          if (details.taxType) {
            enhancedMessage += `\n\n📋 확인된 정보:\n• 과세유형: ${details.taxType}`;

            if (details.estimatedType) {
              enhancedMessage += `\n• 추정 사업자 유형: ${details.estimatedType}`;
            }
          }

          enhancedMessage += `\n\n⚠️ 안내사항:\n국세청 API는 개인정보보호 정책으로 인해\n상호명, 주소, 업태 등의 상세 정보를\n제공하지 않습니다.\n\n해당 정보는 직접 입력해주세요.`;

          showAlertModal("사업자 정보 확인", enhancedMessage);

          if (details.estimatedType && details.isActive) {
            if (details.estimatedType === "개인") {
              setBusinessType("individual");
            } else if (details.estimatedType === "법인") {
              setBusinessType("corporation");
            }
          }
        } else {
          showAlertModal("사업자 정보 확인", detailMessage);
        }
      } else {
        // 검증 실패
        setIsBusinessNumberVerified(false);
        setVerificationMessage("");
        showAlertModal(
          "알림",
          "국세청에 등록되지 않은 사업자등록번호입니다.\n올바른 사업자등록번호를 입력해주세요."
        );
      }
    } catch (error) {
      console.error("사업자등록번호 검증 오류:", error);
      setIsBusinessNumberVerified(false);
      setVerificationMessage("");
      showAlertModal(
        "오류",
        "사업자등록번호 확인 중 오류가 발생했습니다.\n잠시 후 다시 시도해주세요."
      );
    } finally {
      setIsVerifying(false);
    }
  };

  // 모달 표시 함수
  const showAlertModal = (title: string, message: string) => {
    setModalTitle(title);
    setModalMessage(message);
    setShowModal(true);
  };

  // 모달 닫기 함수
  const closeModal = () => {
    setShowModal(false);
    setModalTitle("");
    setModalMessage("");
    
    // 인증 신청이 성공한 경우 루트 페이지로 리다이렉트
    if (isSubmissionSuccess) {
      setIsSubmissionSuccess(false);
      router.push("/");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 필수 항목 검증
    // 1. 기업유형 (기본값이 있으므로 항상 선택됨, 추가 검증 불필요)

    // 2. 사업자명
    if (!businessName.trim()) {
      showAlertModal("알림", "사업자명을 입력해주세요.");
      return;
    }

    // 3. 대표자명
    if (!representativeName.trim()) {
      showAlertModal("알림", "대표자명을 입력해주세요.");
      return;
    }

    // 4. 사업자등록번호 검증 완료
    if (!isBusinessNumberVerified) {
      showAlertModal("알림", "사업자등록번호 확인을 완료해주세요.");
      return;
    }

    // 5. 주소 입력 확인
    if (!roadAddress.trim()) {
      showAlertModal("알림", "주소를 검색하고 선택해주세요.");
      return;
    }

    // 6. 업태 입력 확인
    if (!businessCategory.trim()) {
      showAlertModal("알림", "업태를 입력해주세요.");
      return;
    }

    // 7. 업종 입력 확인
    if (!businessType2.trim()) {
      showAlertModal("알림", "업종을 입력해주세요.");
      return;
    }

    // 8. 인증정보 (사업자등록증/증명원) 파일 첨부
    if (!businessDocumentFile && !existingBusinessDocument) {
      showAlertModal(
        "알림",
        "사업자등록증 또는 사업자등록증명원을 첨부해주세요."
      );
      return;
    }

    try {
      // 로딩 상태 표시
      setIsVerifying(true);

      // 파일을 base64로 변환 (새로운 파일이 있는 경우에만)
      let businessDocumentData = null;
      if (businessDocumentFile) {
        businessDocumentData = await fileToBase64(businessDocumentFile);
      }

      let employmentDocumentData = null;
      if (employmentDocumentFile) {
        employmentDocumentData = await fileToBase64(employmentDocumentFile);
      }

      // API 호출용 데이터 구성
      const submitData = {
        businessType,
        businessName,
        representativeName,
        businessNumber,
        roadAddress,
        detailAddress,
        businessCategory,
        businessType2,
        homepage,
        managerName,
        managerPhone,
        managerEmail,
        businessDocumentFile: businessDocumentFile
          ? {
              name: businessDocumentFile.name,
              size: businessDocumentFile.size,
              type: businessDocumentFile.type,
              data: businessDocumentData,
            }
          : undefined,
        employmentDocumentFile: employmentDocumentFile
          ? {
              name: employmentDocumentFile.name,
              size: employmentDocumentFile.size,
              type: employmentDocumentFile.type,
              data: employmentDocumentData,
            }
          : undefined,
        // 기존 문서 정보 (새로운 파일이 없는 경우 사용)
        hasExistingBusinessDocument: !!existingBusinessDocument,
        hasExistingEmploymentDocument: !!existingEmploymentDocument,
      };

      // JWT 토큰 가져오기
      const token = tokenManager.getAccessToken();
      if (!token) {
        showAlertModal("오류", "인증이 필요합니다. 다시 로그인해주세요.");
        return;
      }

      // API 호출
      const response = await fetch("/api/business-verification/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(submitData),
      });

      const result = await response.json();

      if (response.ok) {
        setIsSubmissionSuccess(true);
        showAlertModal(
          "완료",
          result.message || "사업자 인증 신청이 완료되었습니다."
        );

        // 폼 초기화 (선택사항)
        // setBusinessName("");
        // setRepresentativeName("");
        // setBusinessNumber("");
        // setBusinessDocumentFile(null);
        // setEmploymentDocumentFile(null);
        // setIsBusinessNumberVerified(false);
        // setVerificationMessage("");
      } else {
        showAlertModal(
          "오류",
          result.error || "사업자 인증 신청 중 오류가 발생했습니다."
        );
      }
    } catch (error) {
      console.error("사업자 인증 제출 오류:", error);
      showAlertModal(
        "오류",
        "네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
      );
    } finally {
      setIsVerifying(false);
    }
  };

  const handleFileUpload = (type: string) => {
    // 파일 선택을 위한 input 엘리먼트 생성
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".jpg,.jpeg,.png,.pdf,.tif";

    input.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];

      if (file) {
        // 파일 크기 검증 (20MB)
        if (file.size > 20 * 1024 * 1024) {
          showAlertModal("알림", "파일 크기는 20MB 이하여야 합니다.");
          return;
        }

        // 파일 형식 검증
        const allowedTypes = [
          "image/jpeg",
          "image/jpg",
          "image/png",
          "application/pdf",
          "image/tiff",
        ];
        if (!allowedTypes.includes(file.type)) {
          showAlertModal(
            "알림",
            "JPEG, JPG, PNG, PDF, TIF 형식의 파일만 업로드 가능합니다."
          );
          return;
        }

        // 파일 저장
        if (type === "business") {
          setBusinessDocumentFile(file);
          showAlertModal(
            "알림",
            `사업자등록증 파일이 선택되었습니다.\n파일명: ${file.name}`
          );
        } else if (type === "employment") {
          setEmploymentDocumentFile(file);
          showAlertModal(
            "알림",
            `재직증명서 파일이 선택되었습니다.\n파일명: ${file.name}`
          );
        }
      }
    };

    input.click();
  };

  // 주소찾기 버튼 클릭 함수
  const handleAddressSearch = () => {
    // 현재 address 값이 있으면 searchAddress에 미리 설정
    setSearchAddress(address);
    setShowAddressModal(true);
  };

  // 주소 선택 함수
  const handleAddressSelect = (selectedAddress: string) => {
    setRoadAddress(selectedAddress);
    setAddress(selectedAddress); // 기존 address state에도 설정
    setDetailAddress(""); // 상세주소 초기화
    setShowAddressModal(false);
  };

  // 주소 모달 닫기
  const closeAddressModal = () => {
    setShowAddressModal(false);
    setSearchAddress("");
  };

  return (
    <AdvertiserLoginRequiredGuard>
      <div className="min-h-screen flex flex-col p-5 bg-white">
        <div className="flex-1 flex flex-col max-w-3xl w-full mx-auto">
          <header className="bg-transparent">
            <h1 className="text-black font-semibold text-2xl leading-tight tracking-tight mb-4 text-center">사업자정보 인증</h1>
            <div className="text-sm text-gray-700 leading-relaxed">
              <p className="my-2">• 사업자 정보, 세금계산서 정보 입력 및 필요 서류 첨부 후 인증 버튼을 클릭하시면 사업자 인증 신청이 완료됩니다.</p>
              <p className="my-2">• 관리자 승인까지 영업일 1~3일 소요됩니다.</p>
            </div>
          </header>

          <form onSubmit={handleSubmit} className="bg-transparent">
            <div>
              <h2 className="text-xl font-semibold text-gray-700 pb-4">사업자정보</h2>
              <table className="w-full border-collapse border border-gray-300 bg-white">
                <tbody>
                  <tr>
                    <td className="bg-gray-50 px-5 py-4 border border-gray-300 font-semibold text-gray-700 w-48 align-top text-left">
                      기업유형<span className="text-red-600 ml-1">*</span>
                    </td>
                    <td className="px-5 py-4 border border-gray-300 align-top">
                      <div className="flex gap-5 items-center">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" name="businessType" value="individual" checked={businessType === "individual"} onChange={(e) => setBusinessType(e.target.value)} className="accent-blue-500" />
                          <span className="text-sm text-gray-700">개인사업자</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" name="businessType" value="corporation" checked={businessType === "corporation"} onChange={(e) => setBusinessType(e.target.value)} className="accent-blue-500" />
                          <span className="text-sm text-gray-700">법인사업자</span>
                        </label>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="bg-gray-50 px-5 py-4 border border-gray-300 font-semibold text-gray-700 w-48 align-top text-left">
                      사업자명<span className="text-red-600 ml-1">*</span>
                    </td>
                    <td className="px-5 py-4 border border-gray-300 align-top">
                      <input type="text" value={businessName} onChange={(e) => setBusinessName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded text-sm transition-colors focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" placeholder="사업자명을 입력해주세요" />
                    </td>
                  </tr>
                  <tr>
                    <td className="bg-gray-50 px-5 py-4 border border-gray-300 font-semibold text-gray-700 w-48 align-top text-left">
                      대표자명<span className="text-red-600 ml-1">*</span>
                    </td>
                    <td className="px-5 py-4 border border-gray-300 align-top">
                      <input type="text" value={representativeName} onChange={(e) => setRepresentativeName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded text-sm transition-colors focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" placeholder="대표자명을 입력해주세요" />
                    </td>
                  </tr>
                  <tr>
                    <td className="bg-gray-50 px-5 py-4 border border-gray-300 font-semibold text-gray-700 w-48 align-top text-left">
                      사업자등록번호<span className="text-red-600 ml-1">*</span>
                    </td>
                    <td className="px-5 py-4 border border-gray-300 align-top">
                      <div className="flex items-center gap-2">
                        <input type="text" value={businessNumber} onChange={handleBusinessNumberChange} className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm transition-colors focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" placeholder="사업자등록번호를 입력해주세요" maxLength={12} />
                        <button type="button" className="px-4 py-2 bg-blue-500 text-white border-none rounded text-sm cursor-pointer whitespace-nowrap ml-2 hover:bg-blue-600 disabled:bg-gray-500 disabled:cursor-not-allowed" onClick={verifyBusinessNumber} disabled={isVerifying}>
                          {isVerifying ? "확인중..." : "사업자번호 확인"}
                        </button>
                      </div>
                      {verificationMessage && (
                        <div className={`mt-2 px-3 py-2 rounded text-xs font-medium ${isBusinessNumberVerified ? "bg-green-100 text-green-800 border border-green-200" : "bg-red-100 text-red-800 border border-red-200"}`}>
                          {verificationMessage}
                        </div>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td className="bg-gray-50 px-5 py-4 border border-gray-300 font-semibold text-gray-700 w-48 align-top text-left">
                      주소<span className="text-red-600 ml-1">*</span>
                    </td>
                    <td className="px-5 py-4 border border-gray-300 align-top">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <input type="text" className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm bg-gray-50 cursor-not-allowed" placeholder="도로명 주소 찾기" value={roadAddress} readOnly />
                          <button type="button" className="px-4 py-2 bg-blue-500 text-white border-none rounded text-sm cursor-pointer whitespace-nowrap hover:bg-blue-600" onClick={handleAddressSearch}>주소찾기</button>
                        </div>
                        <input type="text" value={detailAddress} onChange={(e) => setDetailAddress(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded text-sm transition-colors focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" placeholder="나머지 주소를 입력해 주세요" />
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="bg-gray-50 px-5 py-4 border border-gray-300 font-semibold text-gray-700 w-48 align-top text-left">
                      업태<span className="text-red-600 ml-1">*</span>
                    </td>
                    <td className="px-5 py-4 border border-gray-300 align-top">
                      <input type="text" value={businessCategory} onChange={(e) => setBusinessCategory(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded text-sm transition-colors focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" placeholder="업태를 입력해주세요" />
                    </td>
                  </tr>
                  <tr>
                    <td className="bg-gray-50 px-5 py-4 border border-gray-300 font-semibold text-gray-700 w-48 align-top text-left">
                      업종<span className="text-red-600 ml-1">*</span>
                    </td>
                    <td className="px-5 py-4 border border-gray-300 align-top">
                      <input type="text" value={businessType2} onChange={(e) => setBusinessType2(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded text-sm transition-colors focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" placeholder="업종을 입력해주세요" />
                    </td>
                  </tr>
                  <tr>
                    <td className="bg-gray-50 px-5 py-4 border border-gray-300 font-semibold text-gray-700 w-48 align-top text-left">
                      홈페이지 URL<span className="text-gray-500 font-normal ml-1">(선택)</span>
                    </td>
                    <td className="px-5 py-4 border border-gray-300 align-top">
                      <input type="text" value={homepage} onChange={(e) => setHomepage(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded text-sm transition-colors focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" placeholder="www.example.com" />
                      <p className="text-xs text-gray-600 leading-relaxed mt-1">홈페이지, 네이버 플레이스 또는 블로그 링크를 입력해주세요.</p>
                    </td>
                  </tr>
                </tbody>
              </table>

              <table className="w-full border-collapse border border-gray-300 mb-6 bg-white">
                <tbody>
                  <tr>
                    <td className="bg-gray-50 px-5 py-4 border border-gray-300 font-semibold text-gray-700 w-48 align-top text-left">
                      인증정보<span className="text-red-600 ml-1">*</span>
                    </td>
                    <td className="px-5 py-4 border border-gray-300 align-top">
                      <div className="p-6 border border-gray-200 rounded mb-4">
                        <div className="mb-4">
                          <span className="font-semibold text-gray-700">사업자등록증/사업자등록증명원 (택1)</span>
                        </div>
                        <div className="flex gap-2 mb-4">
                          <input type="text" className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm bg-gray-50 cursor-default focus:outline-none" placeholder="사업자등록증 또는 사업자등록증명원을 등록해 주세요." value={businessDocumentFile ? businessDocumentFile.name : existingBusinessDocument ? `[기존 파일] ${existingBusinessDocument.fileName}` : ""} readOnly />
                          <button type="button" className="px-6 py-2 bg-blue-500 text-white border-none rounded text-sm cursor-pointer text-center flex items-center justify-center hover:bg-blue-600" onClick={() => handleFileUpload("business")}>파일 첨부</button>
                        </div>
                        <div className="my-4">
                          <p className="text-sm text-gray-700 mb-2"><strong>90일 이내 발행된 사업자등록증 또는 사업자등록증명원을 첨부해 주세요.</strong></p>
                          <p className="text-xs text-gray-600 leading-relaxed"><span className="text-red-600 font-semibold">단, 주민등록번호 뒷자리는 노출되지 않도록 처리</span><br />(ex 991234 - ******* 표시 등)가 되어 있어야 합니다. (파일 형식 : JPEG, JPG, PNG, PDF, TIF / 용량 20MB 이하)</p>
                        </div>
                        <div className="flex flex-col gap-2">
                          <a href="https://hometax.go.kr/websquare/websquare.html?w2xPath=/ui/pp/index_pp.xml&menuCd=index3" target="_blank" rel="noopener noreferrer" className="block px-4 py-3 border border-gray-300 rounded bg-white cursor-pointer text-sm text-center no-underline text-gray-900 hover:bg-gray-50">사업자등록증 발급 바로가기 &gt;</a>
                          <a href="https://www.gov.kr/mw/AA020InfoCappView.do?HighCtgCD=&CappBizCD=12100000016" target="_blank" rel="noopener noreferrer" className="block px-4 py-3 border border-gray-300 rounded bg-white cursor-pointer text-sm text-center no-underline text-gray-900 hover:bg-gray-50">사업자등록증명원 발급 바로가기 &gt;</a>
                        </div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-700 mb-6">재직자 인증<span className="text-gray-500 text-base font-normal ml-2">(선택)</span></h2>
              <table className="w-full border-collapse border border-gray-300 mb-6 bg-white">
                <tbody>
                  <tr>
                    <td className="bg-gray-50 px-5 py-4 border border-gray-300 font-semibold text-gray-700 w-48 align-top text-left">인증정보</td>
                    <td className="px-5 py-4 border border-gray-300 align-top">
                      <div className="flex gap-2 mb-4">
                        <input type="text" className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm bg-gray-50 cursor-default focus:outline-none" placeholder="재직증명서를 등록해주세요.(임직원만)" value={employmentDocumentFile ? employmentDocumentFile.name : existingEmploymentDocument ? `[기존 파일] ${existingEmploymentDocument.fileName}` : ""} readOnly />
                        <button type="button" className="px-6 py-2 bg-blue-500 text-white border-none rounded text-sm cursor-pointer text-center flex items-center justify-center hover:bg-blue-600" onClick={() => handleFileUpload("employment")}>파일 첨부</button>
                      </div>
                      <div className="text-sm text-gray-600 leading-relaxed mb-4">
                        <p className="mb-1">• 대표자가 아닌 임직원인 경우, 재직 여부 확인을 위해 서류 제출이 필요합니다.</p>
                        <p>• 임직원 본인에 한해 재직증명서를 제출해 주시며, 주민등록번호 뒷자리와 주소는 반드시 가려서 제출해 주시기 바랍니다.</p>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="pt-8 border-b border-gray-200">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-700">세금계산서 담당자<span className="text-gray-500 text-base font-normal ml-2">(선택)</span></h2>
                <div className="m-0">
                  <label className="flex items-center cursor-pointer">
                    <input type="checkbox" checked={usePersonalInfo} onChange={(e) => setUsePersonalInfo(e.target.checked)} className="mr-2 transform scale-125" />
                    <span className="text-base text-blue-500">가입자 정보와 동일</span>
                  </label>
                </div>
              </div>
              <table className="w-full border-collapse border border-gray-300 mb-6 bg-white">
                <tbody>
                  <tr>
                    <td className="bg-gray-50 px-5 py-4 border border-gray-300 font-semibold text-gray-700 w-48 align-top text-left">담당자 이름</td>
                    <td className="px-5 py-4 border border-gray-300 align-top">
                      <input type="text" value={managerName} onChange={(e) => setManagerName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded text-sm transition-colors focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                    </td>
                  </tr>
                  <tr>
                    <td className="bg-gray-50 px-5 py-4 border border-gray-300 font-semibold text-gray-700 w-48 align-top text-left">담당자 휴대폰</td>
                    <td className="px-5 py-4 border border-gray-300 align-top">
                      <div className="flex items-center gap-2">
                        <input type="text" className="w-20 px-3 py-2 border border-gray-300 rounded text-sm text-center transition-colors focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" defaultValue="010" />
                        <span>-</span>
                        <input type="text" value={managerPhone.split("-")[1] || ""} onChange={(e) => setManagerPhone(`010-${e.target.value}-${managerPhone.split("-")[2] || ""}`)} className="flex-1 max-w-24 px-3 py-2 border border-gray-300 rounded text-sm text-center transition-colors focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                        <span>-</span>
                        <input type="text" value={managerPhone.split("-")[2] || ""} onChange={(e) => setManagerPhone(`010-${managerPhone.split("-")[1] || ""}-${e.target.value}`)} className="flex-1 max-w-24 px-3 py-2 border border-gray-300 rounded text-sm text-center transition-colors focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="bg-gray-50 px-5 py-4 border border-gray-300 font-semibold text-gray-700 w-48 align-top text-left">계산서 수신 이메일</td>
                    <td className="px-5 py-4 border border-gray-300 align-top">
                      <input type="email" value={managerEmail} onChange={(e) => setManagerEmail(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded text-sm transition-colors focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="py-8 bg-gray-50 border border-gray-200 rounded p-6 mb-4">
              <h2 className="text-xl font-semibold text-gray-700 mb-6">세금계산서 발급 안내</h2>
              <div className="text-sm text-gray-600 leading-relaxed">
                <p className="my-2">• 부가가치세법에 의거, 세금계산서는 매월 충전금액을 합산하여 다음달 10일 자동으로 발행됩니다.</p>
              </div>
            </div>
            <div className="py-8 text-center bg-transparent">
              <button type="submit" className="w-full max-w-96 px-8 py-4 bg-blue-500 text-white border-none rounded-lg text-lg font-semibold cursor-pointer mb-0 hover:bg-blue-600 disabled:bg-gray-500 disabled:cursor-not-allowed disabled:opacity-70" disabled={isVerifying}>
                {isVerifying ? "제출 중..." : "인증하기"}
              </button>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <Link href="/support?tab=contact" className="text-blue-500 underline text-sm hover:text-blue-600">인증 문의</Link>
              </div>
            </div>
          </form>
        </div>
      </div>

      <AlertModal isOpen={showModal} title={modalTitle} message={modalMessage} onClose={closeModal} />
      {showAddressModal && (
        <div
          className="fixed inset-0 backdrop-blur-sm flex justify-center items-center z-50"
          style={{ backgroundColor: "rgba(0,0,0,0.35)" }}
          onClick={closeAddressModal}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-white rounded-lg p-0 max-w-lg w-11/12 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 pt-6 pb-0 border-b border-gray-200">
              <h3 className="m-0 text-xl font-semibold text-gray-700 pb-4">주소 검색</h3>
            </div>
            <div className="px-6 py-6">
              <div className="mb-4">
                <label className="block font-semibold text-gray-700 mb-2">주소 검색</label>
                <div className="flex gap-2 mb-4">
                  <input type="text" value={searchAddress} onChange={(e) => setSearchAddress(e.target.value)} placeholder="도로명, 건물명, 지번을 입력하세요" className="flex-1 px-3 py-3 border border-gray-300 rounded text-base transition-colors focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                  <button type="button" className="px-6 py-3 bg-blue-500 text-white border-none rounded cursor-pointer text-sm whitespace-nowrap hover:bg-blue-600" onClick={() => {if (searchAddress.trim()) {handleAddressSelect(searchAddress.trim());}}}>검색</button>
                </div>
                <div className="max-h-48 overflow-y-auto border border-gray-200 rounded">
                  {searchAddress.trim() && (
                    <div className="border-b border-gray-100 last:border-b-0">
                      <button type="button" className="w-full p-4 bg-white border-none text-left cursor-pointer flex flex-col gap-1 hover:bg-gray-50" onClick={() => handleAddressSelect(searchAddress.trim())}>
                        <span className="text-sm text-gray-700 font-medium">{searchAddress.trim()}</span>
                        <span className="text-xs text-gray-500">도로명주소</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="px-6 pb-6 flex justify-end">
              <button type="button" className="px-6 py-2 bg-gray-500 text-white border-none rounded cursor-pointer text-sm hover:bg-gray-600" onClick={closeAddressModal}>취소</button>
            </div>
          </div>
        </div>
      )}







    </AdvertiserLoginRequiredGuard>
  );
}
