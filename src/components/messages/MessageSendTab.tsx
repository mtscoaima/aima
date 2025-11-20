"use client";

import React, { useState, useEffect } from "react";
import {
  Phone,
  Users,
  HelpCircle,
  FileText,
  Upload,
  X
} from "lucide-react";
import SmsMessageContent from "./SmsMessageContent";
import KakaoMessageContent from "./KakaoMessageContent";
import NaverTalkContent from "./NaverTalkContent";
import AddressBookModal from "../modals/AddressBookModal";
import ExcelUploadModal from "../modals/ExcelUploadModal";
import TextUploadModal from "../modals/TextUploadModal";
import SendConfirmModal from "../modals/SendConfirmModal";
import { sendAlimtalkMessage, type AlimtalkData } from "./AlimtalkTab";
import { sendFriendtalkMessage, type FriendtalkData } from "./FriendtalkTab";
import { sendBrandMessage_v2, type BrandData } from "./BrandTab";
import { sendNaverTalkMessage, type NaverData } from "./NaverTalkContent";

interface Recipient {
  phone_number: string;
  name?: string;
  group_name?: string;
  variables?: Record<string, string>;
}

interface MessageData {
  subject: string;
  content: string;
  isAd: boolean;
  imageFileIds?: string[];
}

const MessageSendTab = () => {
  const [activeMessageTab, setActiveMessageTab] = useState("sms");
  const [activeKakaoTab, setActiveKakaoTab] = useState("alimtalk"); // 카카오 하위 탭 추적
  const [isAddressBookModalOpen, setIsAddressBookModalOpen] = useState(false);
  const [isExcelUploadModalOpen, setIsExcelUploadModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isTextUploadModalOpen, setIsTextUploadModalOpen] = useState(false);

  // 사용자 발신번호 및 수신번호 상태
  const [userPhoneNumber, setUserPhoneNumber] = useState<string>("");
  const [recipientInput, setRecipientInput] = useState("");
  const [recipientNameInput, setRecipientNameInput] = useState(""); // 이름 입력
  const [recipients, setRecipients] = useState<Recipient[]>([]);

  // 메시지 데이터 상태 (SMS 전용)
  const [messageData, setMessageData] = useState<MessageData>({
    subject: "",
    content: "",
    isAd: false,
    imageFileIds: []
  });

  // 카카오/네이버 탭 데이터 상태
  const [alimtalkData, setAlimtalkData] = useState<AlimtalkData | null>(null);
  const [friendtalkData, setFriendtalkData] = useState<FriendtalkData | null>(null);
  const [brandData, setBrandData] = useState<BrandData | null>(null);
  const [naverData, setNaverData] = useState<NaverData | null>(null);

  // 로딩 및 에러 상태
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isImageUploading, setIsImageUploading] = useState(false);

  // 컴포넌트 마운트 시 사용자 전화번호 조회
  useEffect(() => {
    const fetchUserPhone = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) return;

        const response = await fetch("/api/users/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) return;

        const data = await response.json();
        if (data.phoneNumber) {
          setUserPhoneNumber(data.phoneNumber);
        }
      } catch (error) {
        console.error("전화번호 조회 오류:", error);
      }
    };

    fetchUserPhone();
  }, []);

  // 전화번호 포맷팅 함수
  const formatPhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return cleaned.slice(0, 3) + '-' + cleaned.slice(3, 7) + '-' + cleaned.slice(7);
    }
    return phone;
  };

  // 탭별 테마색 정의
  const getThemeColor = (tab: string) => {
    switch (tab) {
      case "sms": return "#6a1b9a";
      case "kakao": return "#795548";
      case "naver": return "#00a732";
      default: return "#6a1b9a";
    }
  };

  // 주소록에서 전화번호로 그룹명 조회
  const fetchGroupNameByPhone = async (phoneNumber: string): Promise<string | undefined> => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return undefined;

      const response = await fetch(`/api/address-book/contacts?phone=${phoneNumber}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) return undefined;

      const data = await response.json();
      if (data.contacts && data.contacts.length > 0) {
        return data.contacts[0].group_name;
      }
      return undefined;
    } catch (error) {
      console.error("그룹명 조회 오류:", error);
      return undefined;
    }
  };

  // 주소록에서 선택한 연락처 추가
    const handleAddressBookSelect = (contacts: Recipient[]) => {
      const newRecipients = contacts.map(c => ({
        phone_number: c.phone_number,
        name: c.name,
        variables: c.group_name ? { "그룹명": c.group_name } : undefined
      }));

      const uniqueRecipients = [...recipients];
      newRecipients.forEach(newRecipient => {
        if (!uniqueRecipients.some(r => r.phone_number === newRecipient.phone_number)) {
          uniqueRecipients.push(newRecipient);
        }
      });

      setRecipients(uniqueRecipients);
    };

    // 엑셀 파일 업로드 처리
    const handleExcelUpload = async (contacts: Recipient[]) => {
      const newRecipients = await Promise.all(
        contacts.map(async (c) => {
          const groupName = await fetchGroupNameByPhone(c.phone_number);
          return {
            phone_number: c.phone_number,
            name: c.name,
            variables: groupName ? { "그룹명": groupName } : undefined
          };
        })
      );

      const uniqueRecipients = [...recipients];
      newRecipients.forEach(newRecipient => {
        if (!uniqueRecipients.some(r => r.phone_number === newRecipient.phone_number)) {
          uniqueRecipients.push(newRecipient);
        }
      });

      setRecipients(uniqueRecipients);
      alert(`${newRecipients.length}개의 연락처가 추가되었습니다.`);
    };
  
    // 텍스트 입력 처리
    const handleTextUpload = async (text: string) => {
      const lines = text.split('\n').filter(line => line.trim());
      const tempRecipients: Array<{ phone_number: string; name?: string }> = [];

      lines.forEach(line => {
        const trimmed = line.trim();
        const parts = trimmed.split(/\s+/);
        const phoneRaw = parts[0].replace(/-/g, '');
        const name = parts.length > 1 ? parts.slice(1).join(' ') : undefined;

        if (/^01[0-9]{8,9}$/.test(phoneRaw)) {
          tempRecipients.push({
            phone_number: phoneRaw,
            name: name
          });
        }
      });

      const newRecipients = await Promise.all(
        tempRecipients.map(async (c) => {
          const groupName = await fetchGroupNameByPhone(c.phone_number);
          return {
            phone_number: c.phone_number,
            name: c.name,
            variables: groupName ? { "그룹명": groupName } : undefined
          };
        })
      );

      const uniqueRecipients = [...recipients];
      newRecipients.forEach(newRecipient => {
        if (!uniqueRecipients.some(r => r.phone_number === newRecipient.phone_number)) {
          uniqueRecipients.push(newRecipient);
        }
      });

      setRecipients(uniqueRecipients);
      alert(`${newRecipients.length}개의 연락처가 추가되었습니다.`);
    };

  // 수신번호 추가
  const handleAddRecipient = async () => {
    const trimmed = recipientInput.trim();
    if (!trimmed) return;

    // 전화번호 형식 검증 (하이픈 제거)
    const phoneNumber = trimmed.replace(/-/g, "");
    if (!/^01[0-9]{8,9}$/.test(phoneNumber)) {
      setError("올바른 전화번호 형식이 아닙니다 (예: 01012345678)");
      return;
    }

    // 중복 확인
    if (recipients.some(r => r.phone_number === phoneNumber)) {
      setError("이미 추가된 번호입니다");
      return;
    }

    const name = recipientNameInput.trim();
    const groupName = await fetchGroupNameByPhone(phoneNumber);

    setRecipients([...recipients, {
      phone_number: phoneNumber,
      name: name || undefined,
      variables: groupName ? { "그룹명": groupName } : undefined
    }]);
    setRecipientInput("");
    setRecipientNameInput("");
    setError(null);
  };

  // 수신번호 제거
  const handleRemoveRecipient = (phoneNumber: string) => {
    setRecipients(recipients.filter(r => r.phone_number !== phoneNumber));
  };

  // 수신번호 전체 비우기
  const handleClearRecipients = () => {
    setRecipients([]);
  };

  // 메시지 데이터 변경 핸들러
  const handleMessageDataChange = (data: MessageData) => {
    setMessageData(data);
  };

  // 전송/예약 준비 버튼 클릭
  const handleSendPrepare = async () => {
    // 1. 수신자 체크 (공통)
    if (recipients.length === 0) {
      alert("수신번호를 추가해주세요");
      return;
    }

    // 2. 탭별 validation
    if (activeMessageTab === "sms") {
      // SMS/LMS/MMS
      if (!messageData.content.trim()) {
        alert("메시지 내용을 입력해주세요");
        return;
      }
    } else if (activeMessageTab === "kakao") {
      // 카카오 하위 탭 체크
      if (activeKakaoTab === "alimtalk") {
        if (!alimtalkData) {
          alert("알림톡 데이터를 로드하는 중입니다");
          return;
        }
        if (!alimtalkData.selectedProfile) {
          alert("발신 프로필을 선택해주세요");
          return;
        }
        if (!alimtalkData.selectedTemplate) {
          alert("템플릿을 선택해주세요");
          return;
        }
      } else if (activeKakaoTab === "friendtalk") {
        if (!friendtalkData) {
          alert("친구톡 데이터를 로드하는 중입니다");
          return;
        }
        if (!friendtalkData.selectedProfile) {
          alert("발신 프로필을 선택해주세요");
          return;
        }
        // FL/FC 타입은 message가 비어있어도 됨 (headerText, listItems, carousels로 대체)
        const isFLorFC = friendtalkData.messageType === "FL" || friendtalkData.messageType === "FC";
        if (!isFLorFC && !friendtalkData.message.trim()) {
          alert("메시지 내용을 입력해주세요");
          return;
        }
      } else if (activeKakaoTab === "brand") {
        if (!brandData) {
          alert("브랜드 메시지 데이터를 로드하는 중입니다");
          return;
        }
        if (!brandData.selectedProfile) {
          alert("발신 프로필을 선택해주세요");
          return;
        }
        if (!brandData.selectedTemplate) {
          alert("템플릿을 선택해주세요");
          return;
        }
      }
    } else if (activeMessageTab === "naver") {
      // NaverData validation
      if (!naverData || !naverData.navertalkId || !naverData.selectedTemplate) {
        alert("네이버 톡톡 계정과 템플릿을 선택해주세요");
        return;
      }
    }

    // 3. 모달 열기
    setIsConfirmModalOpen(true);
  };

  // 즉시 전송
  const handleImmediateSend = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (activeMessageTab === "sms") {
        // SMS/LMS/MMS 전송
        const token = localStorage.getItem("accessToken");
        if (!token) {
          throw new Error("로그인이 필요합니다");
        }

        const response = await fetch("/api/messages/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            recipients: recipients,
            message: messageData.content,
            subject: messageData.subject || undefined,
            sendType: "immediate",
            isAd: messageData.isAd,
            imageFileIds: messageData.imageFileIds || []
          })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "메시지 전송에 실패했습니다");
        }

        const successCount = data.results.filter((r: { success: boolean }) => r.success).length;
        const failCount = data.results.filter((r: { success: boolean }) => !r.success).length;
        alert(`메시지 전송 완료\n성공: ${successCount}건\n실패: ${failCount}건`);
        setRecipients([]);

      } else if (activeMessageTab === "kakao") {
        // 카카오 메시지 전송
        if (activeKakaoTab === "alimtalk") {
          if (!alimtalkData) throw new Error("알림톡 데이터가 없습니다");

          const result = await sendAlimtalkMessage({
            recipients: recipients,
            callbackNumber: userPhoneNumber,
            data: alimtalkData,
            scheduledAt: undefined, // 즉시 발송
          });

          alert(`알림톡 발송 완료\n성공: ${result.successCount}건\n실패: ${result.failCount}건`);
          setRecipients([]);

        } else if (activeKakaoTab === "friendtalk") {
          if (!friendtalkData) throw new Error("친구톡 데이터가 없습니다");

          const result = await sendFriendtalkMessage({
            recipients: recipients,
            callbackNumber: userPhoneNumber,
            data: friendtalkData,
            scheduledAt: undefined, // 즉시 발송
          });

          alert(`친구톡 발송 완료\n성공: ${result.successCount}건\n실패: ${result.failCount}건`);
          setRecipients([]);

        } else if (activeKakaoTab === "brand") {
          if (!brandData) throw new Error("브랜드 메시지 데이터가 없습니다");

          const result = await sendBrandMessage_v2({
            recipients: recipients,
            callbackNumber: userPhoneNumber,
            data: brandData,
            scheduledAt: undefined, // 즉시 발송
          });

          alert(`브랜드 메시지 발송 완료\n성공: ${result.successCount}건\n실패: ${result.failCount}건`);
          setRecipients([]);
        }

      } else if (activeMessageTab === "naver") {
        // 네이버 톡톡 전송
        if (!naverData) throw new Error("네이버 톡톡 데이터가 없습니다");

        const result = await sendNaverTalkMessage(naverData, recipients, undefined);

        alert(`네이버 톡톡 발송 완료\n성공: ${result.successCount}건\n실패: ${result.failCount}건`);
        setRecipients([]);
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "알 수 없는 오류";
      setError(errorMessage);
      alert(`전송 실패: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 예약 전송
  const handleScheduledSend = async (scheduledDateTime: Date) => {
    const now = new Date();
    const oneMinuteFromNow = new Date(now.getTime() + 60000);

    if (scheduledDateTime <= oneMinuteFromNow) {
      alert(`예약 발송 시간은 현재 시간 이후여야 합니다.`);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // MTS API sendDate 형식: YYYYMMDDHHmmss
      const year = scheduledDateTime.getFullYear();
      const month = String(scheduledDateTime.getMonth() + 1).padStart(2, '0');
      const day = String(scheduledDateTime.getDate()).padStart(2, '0');
      const hours = String(scheduledDateTime.getHours()).padStart(2, '0');
      const minutes = String(scheduledDateTime.getMinutes()).padStart(2, '0');
      const seconds = '00';
      const scheduledAt = `${year}${month}${day}${hours}${minutes}${seconds}`;

      if (activeMessageTab === "sms") {
        // SMS/LMS/MMS 예약
        const token = localStorage.getItem("accessToken");
        if (!token) {
          throw new Error("로그인이 필요합니다");
        }

        const response = await fetch("/api/messages/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            recipients: recipients,
            message: messageData.content,
            subject: messageData.subject || undefined,
            sendType: "scheduled",
            scheduledAt: scheduledDateTime.toISOString(),
            isAd: messageData.isAd,
            imageFileIds: messageData.imageFileIds || []
          })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "메시지 예약에 실패했습니다");
        }

        alert(`메시지 예약이 완료되었습니다.\n예약된 수신자: ${recipients.length}명`);
        setRecipients([]);

      } else if (activeMessageTab === "kakao") {
        // 카카오 메시지 예약
        if (activeKakaoTab === "alimtalk") {
          if (!alimtalkData) throw new Error("알림톡 데이터가 없습니다");

          const result = await sendAlimtalkMessage({
            recipients: recipients,
            callbackNumber: userPhoneNumber,
            data: alimtalkData,
            scheduledAt: scheduledAt, // YYYYMMDDHHmmss
          });

          alert(`알림톡 예약 완료\n예약된 수신자: ${recipients.length}명`);
          setRecipients([]);

        } else if (activeKakaoTab === "friendtalk") {
          if (!friendtalkData) throw new Error("친구톡 데이터가 없습니다");

          const result = await sendFriendtalkMessage({
            recipients: recipients,
            callbackNumber: userPhoneNumber,
            data: friendtalkData,
            scheduledAt: scheduledAt, // YYYYMMDDHHmmss
          });

          alert(`친구톡 예약 완료\n예약된 수신자: ${recipients.length}명`);
          setRecipients([]);

        } else if (activeKakaoTab === "brand") {
          if (!brandData) throw new Error("브랜드 메시지 데이터가 없습니다");

          const result = await sendBrandMessage_v2({
            recipients: recipients,
            callbackNumber: userPhoneNumber,
            data: brandData,
            scheduledAt: scheduledAt, // YYYYMMDDHHmmss
          });

          alert(`브랜드 메시지 예약 완료\n예약된 수신자: ${recipients.length}명`);
          setRecipients([]);
        }

      } else if (activeMessageTab === "naver") {
        // 네이버 톡톡 예약
        if (!naverData) throw new Error("네이버 톡톡 데이터가 없습니다");

        const result = await sendNaverTalkMessage(naverData, recipients, scheduledAt);

        alert(`네이버 톡톡 예약 완료\n예약된 수신자: ${recipients.length}명`);
        setRecipients([]);
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "알 수 없는 오류";
      setError(errorMessage);
      alert(`예약 실패: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessageContent = () => {
    switch (activeMessageTab) {
      case "sms":
        return (
          <SmsMessageContent
            messageData={messageData}
            onMessageDataChange={handleMessageDataChange}
            onUploadingChange={setIsImageUploading}
          />
        );
      case "kakao":
        return (
          <KakaoMessageContent
            recipients={recipients}
            selectedSenderNumber={userPhoneNumber}
            onAlimtalkDataChange={setAlimtalkData}
            onFriendtalkDataChange={setFriendtalkData}
            onBrandDataChange={setBrandData}
            onNaverDataChange={setNaverData}
            onKakaoTabChange={setActiveKakaoTab}
          />
        );
      case "naver":
        return (
          <NaverTalkContent
            recipients={recipients}
            selectedSenderNumber={userPhoneNumber}
            onDataChange={setNaverData}
          />
        );
      default:
        return (
          <SmsMessageContent
            messageData={messageData}
            onMessageDataChange={handleMessageDataChange}
            onUploadingChange={setIsImageUploading}
          />
        );
    }
  };

  return (
    <div className="flex h-full gap-6">
      {/* 좌측 섹션 */}
      <div className="flex flex-col space-y-6">
        {/* 메시지 발신번호 */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Phone className="w-4 h-4 text-gray-600" />
            <span className="font-medium text-gray-700">메시지 발신번호</span>
          </div>
          <div className="flex items-center gap-2">
            {userPhoneNumber ? (
              <>
                <span className="text-gray-900 text-sm font-medium">
                  {formatPhoneNumber(userPhoneNumber)}
                </span>
                <span className="text-xs text-gray-500">
                  (프로필에서 변경 가능)
                </span>
              </>
            ) : (
              <>
                <span className="text-gray-500 text-sm">
                  전화번호 미등록
                </span>
                <a
                  href="/my-site/advertiser/profile"
                  className="text-xs text-blue-500 hover:underline"
                >
                  프로필에서 등록하기 →
                </a>
              </>
            )}
          </div>
        </div>

        {/* 메시지 수신번호 */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Phone className="w-4 h-4 text-gray-600" />
            <span className="font-medium text-gray-700">메시지 수신번호</span>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="이름 (선택)"
                value={recipientNameInput}
                onChange={(e) => setRecipientNameInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleAddRecipient();
                  }
                }}
                className="w-1/3 px-3 py-2 border border-gray-300 rounded text-sm"
              />
              <input
                type="text"
                placeholder="01012345678"
                value={recipientInput}
                onChange={(e) => setRecipientInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleAddRecipient();
                  }
                }}
                className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
              />
              <HelpCircle className="w-4 h-4 text-gray-400" />
              <button
                onClick={handleAddRecipient}
                className="bg-gray-500 text-white px-3 py-2 rounded text-sm hover:bg-gray-600"
              >
                추가
              </button>
            </div>
            {error && (
              <div className="text-xs text-red-500">{error}</div>
            )}
            <div className="w-full justify-between flex gap-2">
              <button
                onClick={() => setIsAddressBookModalOpen(true)}
                className="flex items-center gap-1 w-full justify-center py-2 border border-orange-500 text-orange-500 rounded text-sm hover:bg-orange-50"
              >
                <FileText className="w-4 h-4" />
                주소록
              </button>
              <button
                onClick={() => setIsExcelUploadModalOpen(true)}
                className="flex items-center gap-1 w-full justify-center py-2 border border-green-500 text-green-500 rounded text-sm hover:bg-green-50"
              >
                <Upload className="w-4 h-4" />
                엑셀
              </button>
              <button
                onClick={() => setIsTextUploadModalOpen(true)}
                className="flex items-center gap-1 w-full justify-center py-2 border border-gray-500 text-gray-500 rounded text-sm hover:bg-gray-50"
              >
                <FileText className="w-4 h-4" />
                텍스트
              </button> 
            </div>
          </div>
        </div>

        {/* 추가한 수신번호 */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-600" />
              <span className="font-medium text-gray-700">추가한 수신번호</span>
              <span className="text-gray-500 text-sm">(총 {recipients.length}개)</span>
            </div>
            {recipients.length > 0 && (
              <button
                onClick={handleClearRecipients}
                className="text-gray-400 text-sm hover:text-gray-600"
              >
                비우기
              </button>
            )}
          </div>
          {recipients.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              수신자명단이 비어있습니다.
            </div>
          ) : (
            <div className="max-h-60 overflow-y-auto space-y-2">
              {recipients.map((recipient) => (
                <div
                  key={recipient.phone_number}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm"
                >
                  <div className="flex-1">
                    {recipient.name && (
                      <div className="font-medium text-gray-700">{recipient.name}</div>
                    )}
                    <div className={recipient.name ? 'text-gray-500 text-xs' : ''}>
                      {recipient.phone_number}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveRecipient(recipient.phone_number)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* 우측 섹션 */}
      <div className="flex-1 flex flex-col">
        {/* 상단 탭 버튼들 */}
        <div className="flex gap-2 mb-6">
          <button
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
              activeMessageTab === "sms"
                ? "border border-[#6a1b9a]"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
            style={activeMessageTab === "sms" ? { backgroundColor: "#6a1b9a20", color: "#6a1b9a" } : {}}
            onClick={() => setActiveMessageTab("sms")}
          >
            📱 문자메시지
          </button>
          <button
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
              activeMessageTab === "kakao"
                ? "border border-[#795548]"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
            style={activeMessageTab === "kakao" ? { backgroundColor: "#79554820", color: "#795548" } : {}}
            onClick={() => setActiveMessageTab("kakao")}
          >
            💬 카카오톡
          </button>
          <button
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
              activeMessageTab === "naver"
                ? "border border-[#00a732]"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
            style={activeMessageTab === "naver" ? { backgroundColor: "#00a73220", color: "#00a732" } : {}}
            onClick={() => setActiveMessageTab("naver")}
          >
            🟢 네이버 톡톡
          </button>
        </div>

        {/* 메시지 작성 영역 */}
        <div className="flex-1 flex flex-col">
          {renderMessageContent()}
        </div>

        {/* 전송/예약 준비 버튼 */}
        <div className="mt-6">
          <button
            onClick={handleSendPrepare}
            disabled={isLoading || isImageUploading}
            className="w-full text-white py-2 rounded-lg text-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            style={{ backgroundColor: getThemeColor(activeMessageTab) }}
          >
            {isImageUploading ? "이미지 업로드 중..." : isLoading ? "전송 중..." : "전송/예약 준비"}
          </button>
          <div className="text-center font-semibold mt-2 text-sm text-gray-600">
            &quot;전송 준비&quot;는 잔액이 차감되지 않습니다.
          </div>
          <div className="text-center text-sm text-gray-600">
            예상 차감 단가의 실 발송 내용을 확인하세요!
          </div>
        </div>
      </div>

      {/* 모달들 */}
      <AddressBookModal
        isOpen={isAddressBookModalOpen}
        onClose={() => setIsAddressBookModalOpen(false)}
        onSelect={handleAddressBookSelect}
        currentRecipients={recipients}
        onClearRecipients={handleClearRecipients}
      />
      <ExcelUploadModal
        isOpen={isExcelUploadModalOpen}
        onClose={() => setIsExcelUploadModalOpen(false)}
        onUpload={handleExcelUpload}
      />
      <TextUploadModal
        isOpen={isTextUploadModalOpen}
        onClose={() => setIsTextUploadModalOpen(false)}
        onConfirm={handleTextUpload}
      />

      <SendConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        recipients={recipients}
        messageData={messageData}
        onImmediateSend={handleImmediateSend}
        onScheduledSend={handleScheduledSend}
        isLoading={isLoading}
        messageType={
          activeMessageTab === "sms" ? "sms" :
          activeMessageTab === "kakao" && activeKakaoTab === "alimtalk" ? "alimtalk" :
          activeMessageTab === "kakao" && activeKakaoTab === "friendtalk" ? "friendtalk" :
          activeMessageTab === "kakao" && activeKakaoTab === "brand" ? "brand" :
          activeMessageTab === "kakao" && activeKakaoTab === "naver" ? "naver" :
          activeMessageTab === "naver" ? "naver" :
          "sms"
        }
        alimtalkData={alimtalkData}
        friendtalkData={friendtalkData}
        brandData={brandData}
        naverData={naverData}
      />
    </div>
  );
};

export default MessageSendTab;
