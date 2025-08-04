"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AdvertiserLoginRequiredGuard } from "@/components/RoleGuard";
import { useAuth } from "@/contexts/AuthContext";
import { tokenManager, getUserInfo, UserInfoResponse } from "@/lib/api";

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
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>{title}</h3>
        </div>
        <div className="modal-body">
          <p>{message}</p>
        </div>
        <div className="modal-footer">
          <button
            type="button"
            className="modal-confirm-button"
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

  // 기존 데이터 로드 완료 여부
  const [isInitialized, setIsInitialized] = useState(false);

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
            setBusinessType(companyInfo.businessType || "individual");
            setBusinessName(companyInfo.companyName || "");
            setRepresentativeName(companyInfo.ceoName || "");
            setBusinessNumber(companyInfo.businessNumber || "");
            // businessCategory, businessType2는 기본값 그대로 사용

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
        showAlertModal("사업자 정보 확인", detailMessage);
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

    // 6. 인증정보 (사업자등록증/증명원) 파일 첨부
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

              <table className="info-table">
                <tbody>
                  <tr>
                    <td className="label-cell required">
                      기업유형<span className="required-mark">*</span>
                    </td>
                    <td className="input-cell">
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
                    </td>
                  </tr>
                  <tr>
                    <td className="label-cell required">
                      사업자명<span className="required-mark">*</span>
                    </td>
                    <td className="input-cell">
                      <input
                        type="text"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        className="table-input"
                        placeholder="사업자명을 입력해주세요"
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="label-cell required">
                      대표자명<span className="required-mark">*</span>
                    </td>
                    <td className="input-cell">
                      <input
                        type="text"
                        value={representativeName}
                        onChange={(e) => setRepresentativeName(e.target.value)}
                        className="table-input"
                        placeholder="대표자명을 입력해주세요"
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="label-cell required">
                      사업자등록번호<span className="required-mark">*</span>
                    </td>
                    <td className="input-cell">
                      <div className="input-with-button">
                        <input
                          type="text"
                          value={businessNumber}
                          onChange={handleBusinessNumberChange}
                          className="table-input"
                          placeholder="사업자등록번호를 입력해주세요"
                          maxLength={12}
                        />
                        <button
                          type="button"
                          className="verify-button"
                          onClick={verifyBusinessNumber}
                          disabled={isVerifying}
                        >
                          {isVerifying ? "확인중..." : "사업자번호 확인"}
                        </button>
                      </div>
                      {verificationMessage && (
                        <div
                          className={`verification-message ${
                            isBusinessNumberVerified ? "success" : "error"
                          }`}
                        >
                          {verificationMessage}
                        </div>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td className="label-cell required">
                      주소<span className="required-mark">*</span>
                    </td>
                    <td className="input-cell">
                      <div className="address-group">
                        <div className="address-search">
                          <input
                            type="text"
                            className="table-input address-input-main"
                            placeholder="도로명 주소 찾기"
                            value={roadAddress}
                            readOnly
                          />
                          <button
                            type="button"
                            className="address-button"
                            onClick={handleAddressSearch}
                          >
                            주소찾기
                          </button>
                        </div>
                        <input
                          type="text"
                          value={detailAddress}
                          onChange={(e) => setDetailAddress(e.target.value)}
                          className="table-input address-input"
                          placeholder="나머지 주소를 입력해 주세요"
                        />
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="label-cell">
                      업태<span className="optional-mark">(선택)</span>
                    </td>
                    <td className="input-cell">
                      <input
                        type="text"
                        value={businessCategory}
                        onChange={(e) => setBusinessCategory(e.target.value)}
                        className="table-input"
                        placeholder="선택"
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="label-cell">
                      업종<span className="optional-mark">(선택)</span>
                    </td>
                    <td className="input-cell">
                      <input
                        type="text"
                        value={businessType2}
                        onChange={(e) => setBusinessType2(e.target.value)}
                        className="table-input"
                        placeholder="선택"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>

              <table className="info-table">
                <tbody>
                  <tr>
                    <td className="label-cell required">
                      인증정보<span className="required-mark">*</span>
                    </td>
                    <td className="input-cell">
                      <div className="upload-section">
                        <div className="upload-title-section">
                          <span className="upload-title">
                            사업자등록증/사업자등록증명원 (택1)
                          </span>
                        </div>
                        <div className="file-input-group">
                          <input
                            type="text"
                            className="table-input file-display-input"
                            placeholder="사업자등록증 또는 사업자등록증명원을 등록해 주세요."
                            value={
                              businessDocumentFile
                                ? businessDocumentFile.name
                                : existingBusinessDocument
                                ? `[기존 파일] ${existingBusinessDocument.fileName}`
                                : ""
                            }
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
                              90일 이내 발행된 사업자등록증 또는
                              사업자등록증명원을 첨부해 주세요.
                            </strong>
                          </p>
                          <p className="file-info">
                            <span className="highlight-red">
                              단, 주민등록번호 뒷자리는 노출되지 않도록 처리
                            </span>
                            <br />
                            (ex 991234 - ******* 표시 등)가 되어 있어야 합니다.
                            (파일 형식 : JPEG, JPG, PNG, PDF, TIF / 용량 20MB
                            이하)
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
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 재직자 인증 섹션 */}
            <div className="form-section">
              <h2 className="section-title optional">
                재직자 인증<span className="optional-mark">(선택)</span>
              </h2>

              <table className="info-table">
                <tbody>
                  <tr>
                    <td className="label-cell">인증정보</td>
                    <td className="input-cell">
                      <div className="file-input-group">
                        <input
                          type="text"
                          className="table-input file-display-input"
                          placeholder="재직증명서를 등록해주세요.(임직원만)"
                          value={
                            employmentDocumentFile
                              ? employmentDocumentFile.name
                              : existingEmploymentDocument
                              ? `[기존 파일] ${existingEmploymentDocument.fileName}`
                              : ""
                          }
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
                          • 해당 사업체 근무 여부를 확인합니다. 임직원만
                          제출해주세요.
                        </p>
                        <p>
                          • 본인의 재직증명서를 제출해주시고, 주민번호 뒷자리와
                          주소는 가려서 제출해주세요.
                        </p>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 세금계산서 담당자 섹션 */}
            <div className="form-section">
              <div className="section-header">
                <h2 className="section-title optional">
                  세금계산서 담당자<span className="optional-mark">(선택)</span>
                </h2>
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

              <table className="info-table">
                <tbody>
                  <tr>
                    <td className="label-cell">담당자 이름</td>
                    <td className="input-cell">
                      <input
                        type="text"
                        value={managerName}
                        onChange={(e) => setManagerName(e.target.value)}
                        className="table-input"
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="label-cell">담당자 휴대폰</td>
                    <td className="input-cell">
                      <div className="phone-group">
                        <input
                          type="text"
                          className="table-input phone-input"
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
                          className="table-input phone-input"
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
                          className="table-input phone-input"
                        />
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="label-cell">계산서 수신 이메일</td>
                    <td className="input-cell">
                      <input
                        type="email"
                        value={managerEmail}
                        onChange={(e) => setManagerEmail(e.target.value)}
                        className="table-input"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
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
              <button
                type="submit"
                className="submit-button"
                disabled={isVerifying}
              >
                {isVerifying ? "제출 중..." : "인증하기"}
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

      {/* 알림 모달 */}
      <AlertModal
        isOpen={showModal}
        title={modalTitle}
        message={modalMessage}
        onClose={closeModal}
      />

      {/* 주소 검색 모달 */}
      {showAddressModal && (
        <div className="modal-overlay">
          <div className="modal-content address-modal">
            <div className="modal-header">
              <h3>주소 검색</h3>
            </div>
            <div className="modal-body">
              <div className="address-search-section">
                <label className="form-label">주소 검색</label>
                <div className="search-input-group">
                  <input
                    type="text"
                    value={searchAddress}
                    onChange={(e) => setSearchAddress(e.target.value)}
                    placeholder="도로명, 건물명, 지번을 입력하세요"
                    className="form-input"
                  />
                  <button
                    type="button"
                    className="search-button"
                    onClick={() => {
                      // 간단한 검색 결과 예시
                      if (searchAddress.trim()) {
                        handleAddressSelect(searchAddress.trim());
                      }
                    }}
                  >
                    검색
                  </button>
                </div>
                <div className="search-results">
                  {searchAddress.trim() && (
                    <div className="search-result-item">
                      <button
                        type="button"
                        className="result-button"
                        onClick={() =>
                          handleAddressSelect(searchAddress.trim())
                        }
                      >
                        <span className="result-address">
                          {searchAddress.trim()}
                        </span>
                        <span className="result-type">도로명주소</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="modal-cancel-button"
                onClick={closeAddressModal}
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

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

        /* 테이블 스타일 */
        .info-table {
          width: 100%;
          border-collapse: collapse;
          border: 1px solid #e5e8ec;
          margin-bottom: 1.5rem;
          background: white;
        }

        .label-cell {
          background: #f8f9fa;
          padding: 15px 20px;
          border: 1px solid #e5e8ec;
          font-weight: 600;
          color: #333;
          width: 200px;
          vertical-align: top;
          text-align: left;
        }

        .input-cell {
          padding: 15px 20px;
          border: 1px solid #e5e8ec;
          vertical-align: top;
        }

        .required-mark {
          color: #dc3545;
          margin-left: 2px;
        }

        .optional-mark {
          color: #6c757d;
          font-weight: normal;
          margin-left: 5px;
        }

        .table-input {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
          transition: border-color 0.15s ease-in-out;
        }

        .table-input:focus {
          outline: none;
          border-color: #1681ff;
          box-shadow: 0 0 0 2px rgba(22, 129, 255, 0.1);
        }

        .verification-message {
          margin-top: 8px;
          padding: 8px 12px;
          border-radius: 4px;
          font-size: 13px;
          font-weight: 500;
        }

        .verification-message.success {
          background: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }

        .verification-message.error {
          background: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }

        /* 라디오 버튼 그룹 스타일 */
        .radio-group {
          display: flex;
          gap: 20px;
          align-items: center;
        }

        .radio-option {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
        }

        .radio-option input[type="radio"] {
          margin: 0;
          accent-color: #1681ff;
        }

        .radio-text {
          font-size: 14px;
          color: #333;
        }

        /* 전화번호 입력 그룹 */
        .phone-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .phone-input {
          width: 80px !important;
          text-align: center;
        }

        /* 버튼 스타일 조정 */
        .verify-button,
        .address-button,
        .upload-button {
          padding: 10px 16px;
          background: #1681ff;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 14px;
          cursor: pointer;
          white-space: nowrap;
          margin-left: 8px;
        }

        .verify-button:hover,
        .address-button:hover,
        .upload-button:hover {
          background: #1366cc;
        }

        .verify-button:disabled {
          background: #6c757d;
          cursor: not-allowed;
        }

        /* 입력 그룹 */
        .input-with-button {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .input-with-button .table-input {
          flex: 1;
        }

        .address-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .address-search {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .address-search .table-input {
          flex: 1;
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
          background-color: #1681ff;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.9rem;
          white-space: nowrap;
          transition: background-color 0.2s;
        }

        .verify-button:hover:not(:disabled) {
          background-color: #1366cc;
        }

        .verify-button:disabled {
          background-color: #6c757d;
          cursor: not-allowed;
        }

        .business-status {
          margin-top: 0.5rem;
          padding: 0.5rem;
          border-radius: 4px;
          font-size: 0.9rem;
        }

        .business-status.success {
          background-color: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }

        .business-status.error {
          background-color: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }

        /* 모달 스타일 */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 10000;
        }

        .modal-content {
          background: white;
          border-radius: 8px;
          padding: 0;
          max-width: 400px;
          width: 90%;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .modal-header {
          padding: 1.5rem 1.5rem 0 1.5rem;
          border-bottom: 1px solid #e9ecef;
        }

        .modal-header h3 {
          margin: 0;
          font-size: 1.2rem;
          font-weight: 600;
          color: #333;
          padding-bottom: 1rem;
        }

        .modal-body {
          padding: 1.5rem;
        }

        .modal-body p {
          margin: 0;
          line-height: 1.5;
          color: #333;
          white-space: pre-line;
        }

        .modal-footer {
          padding: 0 1.5rem 1.5rem 1.5rem;
          display: flex;
          justify-content: flex-end;
        }

        .modal-confirm-button {
          padding: 0.5rem 1.5rem;
          background-color: #1681ff;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.9rem;
        }

        .modal-confirm-button:hover {
          background-color: #1366cc;
        }

        /* 주소 검색 모달 스타일 */
        .address-modal {
          max-width: 500px;
          width: 95%;
        }

        .address-search-section {
          margin-bottom: 1rem;
        }

        .search-input-group {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .search-input-group .form-input {
          flex: 1;
        }

        .search-button {
          padding: 0.75rem 1.5rem;
          background-color: #1681ff;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.9rem;
          white-space: nowrap;
        }

        .search-button:hover {
          background-color: #1366cc;
        }

        .search-results {
          max-height: 200px;
          overflow-y: auto;
          border: 1px solid #e9ecef;
          border-radius: 4px;
        }

        .search-result-item {
          border-bottom: 1px solid #f8f9fa;
        }

        .search-result-item:last-child {
          border-bottom: none;
        }

        .result-button {
          width: 100%;
          padding: 1rem;
          background: white;
          border: none;
          text-align: left;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .result-button:hover {
          background-color: #f8f9fa;
        }

        .result-address {
          font-size: 0.95rem;
          color: #333;
          font-weight: 500;
        }

        .result-type {
          font-size: 0.8rem;
          color: #6c757d;
        }

        .modal-cancel-button {
          padding: 0.5rem 1.5rem;
          background-color: #6c757d;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.9rem;
        }

        .modal-cancel-button:hover {
          background-color: #5a6268;
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

        .submit-button:hover:not(:disabled) {
          background-color: #1366cc;
        }

        .submit-button:disabled {
          background-color: #6c757d;
          cursor: not-allowed;
          opacity: 0.7;
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

          .modal-content {
            width: 95%;
            margin: 0 1rem;
          }

          /* 모바일에서 테이블 반응형 */
          .info-table {
            font-size: 14px;
          }

          .label-cell {
            width: 120px;
            padding: 12px 15px;
            font-size: 13px;
          }

          .input-cell {
            padding: 12px 15px;
          }

          .table-input {
            padding: 8px 10px;
            font-size: 14px;
          }

          .input-with-button {
            flex-direction: column;
            gap: 8px;
            align-items: stretch;
          }

          .input-with-button .table-input {
            margin-bottom: 8px;
          }

          .verify-button,
          .address-button,
          .upload-button {
            margin-left: 0;
            width: 100%;
            justify-self: stretch;
          }

          .phone-group {
            flex-wrap: wrap;
            gap: 4px;
          }

          .phone-input {
            width: 70px !important;
          }
        }
      `}</style>
    </AdvertiserLoginRequiredGuard>
  );
}
