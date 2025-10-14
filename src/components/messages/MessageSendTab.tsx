"use client";

import React, { useState } from "react";
import {
  Phone,
  Users,
  HelpCircle,
  ChevronDown,
  FileText,
  Upload,
  Plus,
  Edit,
  Download,
  X
} from "lucide-react";
import SmsMessageContent from "./SmsMessageContent";
import KakaoMessageContent from "./KakaoMessageContent";
import RcsMessageContent from "./RcsMessageContent";
import NaverTalkContent from "./NaverTalkContent";
import SenderNumberSelectModal from "../modals/SenderNumberSelectModal";
import SenderNumberManageModal from "../modals/SenderNumberManageModal";
import SaveContentModal from "../modals/SaveContentModal";
import LoadContentModal from "../modals/LoadContentModal";
import AddressBookModal from "../modals/AddressBookModal";
import ExcelUploadModal from "../modals/ExcelUploadModal";
import TextUploadModal from "../modals/TextUploadModal";

interface Recipient {
  phone_number: string;
  name?: string;
  variables?: Record<string, string>;
}

interface MessageData {
  subject: string;
  content: string;
  isAd: boolean;
}

interface Contact {
  phone_number: string;
  name: string;
}

const MessageSendTab = () => {
  const [activeMessageTab, setActiveMessageTab] = useState("sms");
  const [isSelectModalOpen, setIsSelectModalOpen] = useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [isAddressBookModalOpen, setIsAddressBookModalOpen] = useState(false);
  const [isExcelUploadModalOpen, setIsExcelUploadModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isTextUploadModalOpen, setIsTextUploadModalOpen] = useState(false);
  const [isSaveDropdownOpen, setIsSaveDropdownOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isLoadModalOpen, setIsLoadModalOpen] = useState(false);

  // 발신번호 및 수신번호 상태
  const [selectedSenderNumber, setSelectedSenderNumber] = useState<string>("");
  const [recipientInput, setRecipientInput] = useState("");
  const [recipients, setRecipients] = useState<Recipient[]>([]);

  // 메시지 데이터 상태
  const [messageData, setMessageData] = useState<MessageData>({
    subject: "",
    content: "",
    isAd: false
  });

  // 로딩 및 에러 상태
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 예약 발송 상태
  const [sendType, setSendType] = useState<"immediate" | "scheduled">("immediate");

  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const day = String(tomorrow.getDate()).padStart(2, '0');
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    const dayName = dayNames[tomorrow.getDay()];
    return `${year}.${month}.${day} (${dayName})`;
  };

  const getTomorrowISODate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const [selectedDate, setSelectedDate] = useState(getTomorrowDate());
  const [selectedISODate, setSelectedISODate] = useState(getTomorrowISODate());
  const [selectedHour, setSelectedHour] = useState("00");
  const [selectedMinute, setSelectedMinute] = useState("00");
  const [showDateCalendar, setShowDateCalendar] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // 탭별 테마색 정의
  const getThemeColor = (tab: string) => {
    switch (tab) {
      case "sms": return "#6a1b9a";
      case "kakao": return "#795548";
      case "rcs": return "#2c398a";
      case "naver": return "#00a732";
      default: return "#6a1b9a";
    }
  };

  // 모달 핸들러
  const handleSelectModalOpen = () => {
    alert("발신번호 선택 기능은 개발 중입니다.\n현재는 테스트 발신번호로 전송됩니다.");
  };
  const handleSelectModalClose = () => setIsSelectModalOpen(false);
  const handleManageModalOpen = () => {
    setIsSelectModalOpen(false);
    setIsManageModalOpen(true);
  };
  const handleManageModalClose = () => setIsManageModalOpen(false);

  // 캘린더 관련 함수들
  const handleDateClick = () => {
    setShowDateCalendar(!showDateCalendar);
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const handleDateSelect = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDateObj = new Date(date);
    selectedDateObj.setHours(0, 0, 0, 0);

    if (selectedDateObj < today) {
      return;
    }

    const days = ['일', '월', '화', '수', '목', '금', '토'];
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const isoDate = `${year}-${month}-${day}`;
    const displayDate = `${year}.${month}.${day} (${days[date.getDay()]})`;

    setSelectedDate(displayDate);
    setSelectedISODate(isoDate);
    setShowDateCalendar(false);
  };

  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const current = new Date(startDate);

    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return days;
  };

    // 주소록에서 선택한 연락처 추가
    const handleAddressBookSelect = (contacts: Contact[]) => {
      const newRecipients = contacts.map(c => ({
        phone_number: c.phone_number,
        name: c.name
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
    const handleExcelUpload = async (file: File) => {
      alert(`엑셀 파일 업로드 기능은 개발 중입니다.\n파일명: ${file.name}`);
    };
  
    // 텍스트 입력 처리
    const handleTextUpload = (text: string) => {
      const lines = text.split('\n').filter(line => line.trim());
      const newRecipients: Recipient[] = [];
  
      lines.forEach(line => {
        const trimmed = line.trim();
        const parts = trimmed.split(/\s+/);
        const phoneRaw = parts[0].replace(/-/g, '');
        const name = parts.length > 1 ? parts.slice(1).join(' ') : undefined;
  
        if (/^01[0-9]{8,9}$/.test(phoneRaw)) {
          newRecipients.push({
            phone_number: phoneRaw,
            name: name
          });
        }
      });
  
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
  const handleAddRecipient = () => {
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

    setRecipients([...recipients, { phone_number: phoneNumber }]);
    setRecipientInput("");
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
    if (recipients.length === 0) {
      alert("수신번호를 추가해주세요");
      return;
    }

    if (!messageData.content.trim()) {
      alert("메시지 내용을 입력해주세요");
      return;
    }

    // 모달 열기
    setIsConfirmModalOpen(true);
  };

  // 즉시 전송
  const handleImmediateSend = async () => {
    setIsLoading(true);
    setError(null);

    try {
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
          from_number: selectedSenderNumber,
          recipients: recipients,
          message: messageData.content,
          subject: messageData.subject || undefined,
          sendType: "immediate",
          isAd: messageData.isAd
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "메시지 전송에 실패했습니다");
      }

      const successCount = data.results.filter((r: { success: boolean }) => r.success).length;
      const failCount = data.results.filter((r: { success: boolean }) => !r.success).length;
      alert(`메시지 전송 완료
성공: ${successCount}건
실패: ${failCount}건`);
      // 전송 후 수신번호 목록 비우기 (선택사항)
      setRecipients([]);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "알 수 없는 오류";
      setError(errorMessage);
      alert(`전송 실패: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 예약 전송
  const handleScheduledSend = async () => {
    const [year, month, day] = selectedISODate.split('-').map(Number);
    const scheduledDateTime = new Date(year, month - 1, day, parseInt(selectedHour), parseInt(selectedMinute), 0);
    const now = new Date();

    const oneMinuteFromNow = new Date(now.getTime() + 60000);
    if (scheduledDateTime <= oneMinuteFromNow) {
      alert(`예약 발송 시간은 현재 시간(${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}) 이후여야 합니다.\n선택된 시간: ${selectedDate} ${selectedHour}:${selectedMinute}`);
      return;
    }

    if (!confirm(`${selectedDate} ${selectedHour}:${selectedMinute}에 메시지를 예약하시겠습니까?`)) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
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
          from_number: selectedSenderNumber,
          recipients: recipients,
          message: messageData.content,
          subject: messageData.subject || undefined,
          sendType: "scheduled",
          scheduledAt: scheduledDateTime.toISOString(),
          isAd: messageData.isAd
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "메시지 예약에 실패했습니다");
      }

      alert(`메시지 예약이 완료되었습니다.\n\n발송 예정: ${selectedDate} ${selectedHour}:${selectedMinute}\n예약된 수신자: ${recipients.length}명`);
      setRecipients([]);

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
          />
        );
      case "kakao":
        return <KakaoMessageContent />;
      case "rcs":
        return <RcsMessageContent />;
      case "naver":
        return <NaverTalkContent />;
      default:
        return (
          <SmsMessageContent
            messageData={messageData}
            onMessageDataChange={handleMessageDataChange}
          />
        );
    }
  };

  return (
    <div className="flex h-full gap-6">
      {/* 좌측 섹션 */}
      <div className="w-90 flex flex-col space-y-6">
        {/* 메시지 발신번호 */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Phone className="w-4 h-4 text-gray-600" />
            <span className="font-medium text-gray-700">메시지 발신번호</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500 text-sm">
              {selectedSenderNumber || "선택된 발신번호 없음"}
            </span>
            <button
              className="text-white px-4 py-2 rounded text-sm hover:opacity-90"
              style={{ backgroundColor: getThemeColor(activeMessageTab) }}
              onClick={handleSelectModalOpen}
            >
              선택
            </button>
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
              {recipients.map((recipient, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm"
                >
                  <span>{recipient.phone_number}</span>
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

        {/* 저장 섹션 */}
        <div className="bg-white border border-gray-200 rounded-lg">
          <button
            className="w-full p-4 flex items-center justify-between hover:bg-gray-50"
            onClick={() => setIsSaveDropdownOpen(!isSaveDropdownOpen)}
          >
            <span className="text-red-500 font-medium">저장</span>
            <ChevronDown
              className={`w-4 h-4 text-gray-400 transition-transform ${
                isSaveDropdownOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {isSaveDropdownOpen && (
            <div className="p-3">
              <div className="flex gap-2">
                <button
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-green-500 text-green-500 rounded text-sm hover:bg-green-50"
                  onClick={() => setIsSaveModalOpen(true)}
                >
                  <Plus className="w-4 h-4" />
                  새로 저장
                </button>
                <button
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 text-gray-400 rounded text-sm cursor-not-allowed"
                  disabled
                >
                  <Edit className="w-4 h-4" />
                  덮어 쓰기
                </button>
                <button
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-blue-500 text-blue-500 rounded text-sm hover:bg-blue-50"
                  onClick={() => setIsLoadModalOpen(true)}
                >
                  <Download className="w-4 h-4" />
                  불러오기
                </button>
              </div>
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
              activeMessageTab === "rcs"
                ? "border border-[#2c398a]"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
            style={activeMessageTab === "rcs" ? { backgroundColor: "#2c398a20", color: "#2c398a" } : {}}
            onClick={() => setActiveMessageTab("rcs")}
          >
            🔵 RCS 문자
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
            disabled={isLoading}
            className="w-full text-white py-2 rounded-lg text-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            style={{ backgroundColor: getThemeColor(activeMessageTab) }}
          >
            {isLoading ? "전송 중..." : "전송/예약 준비"}
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
      <SenderNumberSelectModal
        isOpen={isSelectModalOpen}
        onClose={handleSelectModalClose}
        onManageClick={handleManageModalOpen}
        onSelect={(phoneNumber) => setSelectedSenderNumber(phoneNumber)}
      />
      <SenderNumberManageModal
        isOpen={isManageModalOpen}
        onClose={handleManageModalClose}
      />
      <SaveContentModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
      />
      <LoadContentModal
        isOpen={isLoadModalOpen}
        onClose={() => setIsLoadModalOpen(false)}
      />
       <AddressBookModal
        isOpen={isAddressBookModalOpen}
        onClose={() => setIsAddressBookModalOpen(false)}
        onSelect={handleAddressBookSelect}
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

      {/* 전송 확인 모달 */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            {/* 헤더 */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">전송 확인</h3>
              <button
                onClick={() => setIsConfirmModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* 본문 */}
            <div className="p-6 space-y-6">
              {/* 전송 정보 */}
              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">발신번호</span>
                  <span className="text-sm font-medium text-gray-900">테스트 발신번호</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">수신자 수</span>
                  <span className="text-sm font-medium text-gray-900">{recipients.length}명</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-gray-600">메시지 내용</span>
                  <p className="text-sm text-gray-900 bg-white p-2 rounded border border-gray-200 max-h-20 overflow-y-auto">
                    {messageData.content}
                  </p>
                </div>
              </div>

              {/* 보내기 방식 선택 */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-700">보내기 방식</h4>

                {/* 즉시 발송 */}
                <label className="flex items-center cursor-pointer p-3 border border-gray-300 rounded-lg hover:bg-gray-50">
                  <div className="relative">
                    <input
                      type="radio"
                      name="sendTypeModal"
                      value="immediate"
                      checked={sendType === "immediate"}
                      onChange={(e) => setSendType(e.target.value as "immediate")}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 border-2 rounded-full ${
                      sendType === "immediate"
                        ? "border-blue-500 bg-blue-500"
                        : "border-gray-300"
                    }`}>
                      {sendType === "immediate" && (
                        <div className="w-2 h-2 bg-white rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
                      )}
                    </div>
                  </div>
                  <span className="ml-3 text-gray-900">즉시 발송</span>
                </label>

                {/* 예약 발송 */}
                <label className="flex items-center cursor-pointer p-3 border border-gray-300 rounded-lg hover:bg-gray-50">
                  <div className="relative">
                    <input
                      type="radio"
                      name="sendTypeModal"
                      value="scheduled"
                      checked={sendType === "scheduled"}
                      onChange={(e) => setSendType(e.target.value as "scheduled")}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 border-2 rounded-full ${
                      sendType === "scheduled"
                        ? "border-blue-500 bg-blue-500"
                        : "border-gray-300"
                    }`}>
                      {sendType === "scheduled" && (
                        <div className="w-2 h-2 bg-white rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
                      )}
                    </div>
                  </div>
                  <span className="ml-3 text-gray-900">예약 발송</span>
                </label>

                {/* 예약 발송 시간 선택 */}
                {sendType === "scheduled" && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <div className="space-y-4">
                      {/* 날짜 선택 */}
                      <div className="relative">
                        <label className="block text-sm font-medium text-gray-700 mb-2">날짜</label>
                        <button
                          onClick={handleDateClick}
                          className="w-full flex items-center justify-between p-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <span className="text-gray-900 font-medium">{selectedDate}</span>
                          <svg
                            className={`w-4 h-4 text-gray-600 transition-transform ${showDateCalendar ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>

                        {/* 캘린더 드롭다운 */}
                        {showDateCalendar && (
                          <div className="absolute z-10 w-full mt-2 bg-white rounded-lg border border-gray-200 shadow-lg overflow-hidden">
                            {/* 캘린더 헤더 */}
                            <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200">
                              <button onClick={handlePrevMonth} className="p-1 hover:bg-gray-200 rounded-lg">
                                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                              </button>
                              <h3 className="text-lg font-semibold text-gray-900">
                                {currentMonth.getFullYear()}.{(currentMonth.getMonth() + 1).toString().padStart(2, '0')}
                              </h3>
                              <button onClick={handleNextMonth} className="p-1 hover:bg-gray-200 rounded-lg">
                                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </button>
                            </div>

                            {/* 캘린더 본문 */}
                            <div className="p-4">
                              {/* 요일 */}
                              <div className="grid grid-cols-7 mb-2">
                                {['일', '월', '화', '수', '목', '금', '토'].map((day, index) => (
                                  <div key={day} className={`p-2 text-center text-sm font-medium ${
                                    index === 0 ? 'text-red-500' :
                                    index === 6 ? 'text-blue-500' :
                                    'text-gray-700'
                                  }`}>
                                    {day}
                                  </div>
                                ))}
                              </div>

                              {/* 날짜 그리드 */}
                              <div className="grid grid-cols-7 gap-1">
                                {generateCalendarDays().map((day, index) => {
                                  const today = new Date();
                                  const isToday = day.toDateString() === today.toDateString();
                                  const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
                                  const isPastDate = day < today && !isToday;
                                  const dayOfWeek = day.getDay();
                                  const isSelected = selectedISODate && day.toISOString().split('T')[0] === selectedISODate;

                                  return (
                                    <button
                                      key={index}
                                      onClick={() => !isPastDate && handleDateSelect(day)}
                                      disabled={isPastDate}
                                      className={`p-2 text-sm rounded-lg transition-colors ${
                                        isPastDate ? 'text-gray-300 cursor-not-allowed' :
                                        !isCurrentMonth ? 'text-gray-400 hover:bg-gray-100' :
                                        isSelected ? 'bg-blue-500 text-white' :
                                        isToday ? 'bg-green-100 text-green-800 hover:bg-green-200' :
                                        dayOfWeek === 0 ? 'text-red-500 hover:bg-gray-100' :
                                        dayOfWeek === 6 ? 'text-blue-500 hover:bg-gray-100' :
                                        'text-gray-900 hover:bg-gray-100'
                                      }`}
                                    >
                                      {day.getDate()}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 시간 선택 */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">시간</label>
                        <div className="flex space-x-2">
                          <select
                            value={selectedHour}
                            onChange={(e) => setSelectedHour(e.target.value)}
                            className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          >
                            {Array.from({ length: 24 }, (_, i) => (
                              <option key={i} value={i.toString().padStart(2, '0')}>
                                {i.toString().padStart(2, '0')}시
                              </option>
                            ))}
                          </select>
                          <select
                            value={selectedMinute}
                            onChange={(e) => setSelectedMinute(e.target.value)}
                            className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          >
                            {Array.from({ length: 60 }, (_, i) => (
                              <option key={i} value={i.toString().padStart(2, '0')}>
                                {i.toString().padStart(2, '0')}분
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 푸터 */}
            <div className="flex gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setIsConfirmModalOpen(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={async () => {
                  setIsConfirmModalOpen(false);
                  if (sendType === "immediate") {
                    await handleImmediateSend();
                  } else {
                    await handleScheduledSend();
                  }
                }}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
              >
                {sendType === "immediate" ? "즉시 전송" : "예약 발송"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageSendTab;
