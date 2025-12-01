"use client";

import React, { useState } from "react";
import { X } from "lucide-react";
import type { AlimtalkData } from "../messages/AlimtalkTab";
import type { FriendtalkData } from "../messages/FriendtalkTab";
import type { BrandData } from "../messages/BrandTab";
import type { NaverData } from "../messages/NaverTalkContent";

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

interface SendConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipients: Recipient[];
  messageData: MessageData;
  onImmediateSend: () => Promise<void>;
  onScheduledSend: (scheduledDateTime: Date) => Promise<void>;
  isLoading: boolean;
  // 추가: 메시지 타입 및 타입별 데이터
  messageType?: "sms" | "alimtalk" | "friendtalk" | "brand" | "naver";
  alimtalkData?: AlimtalkData | null;
  friendtalkData?: FriendtalkData | null;
  brandData?: BrandData | null;
  naverData?: NaverData | null;
}

const SendConfirmModal: React.FC<SendConfirmModalProps> = ({
  isOpen,
  onClose,
  recipients,
  messageData,
  onImmediateSend,
  onScheduledSend,
  isLoading,
  messageType = "sms",
  alimtalkData,
  friendtalkData,
  brandData,
  naverData,
}) => {
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

  const handleConfirm = async () => {
    if (sendType === "immediate") {
      await onImmediateSend();
    } else {
      const [year, month, day] = selectedISODate.split('-').map(Number);
      const scheduledDateTime = new Date(year, month - 1, day, parseInt(selectedHour), parseInt(selectedMinute), 0);
      await onScheduledSend(scheduledDateTime);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">전송 확인</h3>
          <button
            onClick={onClose}
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

            {/* 메시지 내용 - 타입별 표시 */}
            <div className="flex flex-col gap-2">
              <span className="text-sm text-gray-600 font-medium">메시지 내용</span>

              {/* SMS/LMS/MMS */}
              {messageType === "sms" && (
                <div className="bg-white p-3 rounded border border-gray-200 max-h-32 overflow-y-auto">
                  {messageData.subject && (
                    <p className="text-xs font-semibold text-gray-700 mb-1">[제목] {messageData.subject}</p>
                  )}
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">{messageData.content}</p>
                </div>
              )}

              {/* 카카오 알림톡 */}
              {messageType === "alimtalk" && alimtalkData && (
                <div className="bg-white p-3 rounded border border-gray-200 space-y-2">
                  <div className="text-xs text-gray-500">
                    <span className="font-medium">발신 프로필:</span> {alimtalkData.selectedProfile || '(선택 안됨)'}
                  </div>
                  {alimtalkData.selectedTemplate && (
                    <>
                      <div className="text-xs text-gray-500">
                        <span className="font-medium">템플릿:</span> {alimtalkData.selectedTemplate.template_name}
                      </div>
                      <div className="bg-yellow-50 p-2 rounded border border-yellow-200 max-h-24 overflow-y-auto">
                        <p className="text-sm text-gray-900 whitespace-pre-wrap">
                          {alimtalkData.selectedTemplate.template_content}
                        </p>
                      </div>
                      {alimtalkData.selectedTemplate.buttons && alimtalkData.selectedTemplate.buttons.length > 0 && (
                        <div className="text-xs text-green-700 bg-green-50 px-2 py-1 rounded">
                          버튼 {alimtalkData.selectedTemplate.buttons.length}개 포함
                        </div>
                      )}
                    </>
                  )}
                  {alimtalkData.enableSmsBackup && (
                    <div className="text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded">
                      SMS 전환 발송 설정됨
                    </div>
                  )}
                </div>
              )}

              {/* 카카오 친구톡 */}
              {messageType === "friendtalk" && friendtalkData && (
                <div className="bg-white p-3 rounded border border-gray-200 space-y-2 max-h-64 overflow-y-auto">
                  <div className="text-xs text-gray-500">
                    <span className="font-medium">발신 프로필:</span> {friendtalkData.selectedProfile || '(선택 안됨)'}
                  </div>
                  <div className="text-xs text-gray-500">
                    <span className="font-medium">메시지 타입:</span>{" "}
                    {friendtalkData.messageType === "FT" && "기본형 (FT)"}
                    {friendtalkData.messageType === "FI" && "이미지형 (FI)"}
                    {friendtalkData.messageType === "FW" && "와이드형 (FW)"}
                    {friendtalkData.messageType === "FL" && "와이드 아이템 리스트형 (FL)"}
                    {friendtalkData.messageType === "FC" && "캐러셀형 (FC)"}
                  </div>
                  <div className="text-xs text-gray-500">
                    <span className="font-medium">광고:</span> {friendtalkData.adFlag === "Y" ? "광고" : "일반"}
                  </div>

                  {/* FT/FI/FW 타입: 메시지 내용 표시 */}
                  {(!friendtalkData.messageType ||
                    friendtalkData.messageType === "FT" ||
                    friendtalkData.messageType === "FI" ||
                    friendtalkData.messageType === "FW") && friendtalkData.message && (
                    <div className="bg-yellow-50 p-2 rounded border border-yellow-200 max-h-24 overflow-y-auto">
                      <p className="text-sm text-gray-900 whitespace-pre-wrap">{friendtalkData.message}</p>
                    </div>
                  )}

                  {/* FL 타입: 헤더 + 아이템 목록 */}
                  {friendtalkData.messageType === "FL" && (
                    <div className="space-y-2">
                      <div className="bg-purple-50 px-2 py-1 rounded border border-purple-200">
                        <span className="text-xs font-medium text-purple-700">📝 헤더:</span>
                        <span className="text-xs text-gray-900 ml-1">{friendtalkData.headerText || '(없음)'}</span>
                      </div>
                      <div className="bg-blue-50 px-2 py-1 rounded border border-blue-200">
                        <div className="text-xs font-medium text-blue-700 mb-1">아이템 목록 ({friendtalkData.listItems?.length || 0}개):</div>
                        {friendtalkData.listItems && friendtalkData.listItems.length > 0 ? (
                          <ul className="space-y-1">
                            {friendtalkData.listItems.map((item, idx) => (
                              <li key={idx} className="flex items-center gap-2 text-xs">
                                <span className="font-medium">#{idx + 1}</span>
                                <span className="text-gray-900">{item.title}</span>
                                {item.image && <span className="text-purple-600">📷</span>}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-xs text-gray-500">(아이템 없음)</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* FC 타입: 캐러셀 목록 */}
                  {friendtalkData.messageType === "FC" && (
                    <div className="space-y-2">
                      <div className="bg-purple-50 px-2 py-1 rounded border border-purple-200">
                        <div className="text-xs font-medium text-purple-700 mb-1">캐러셀 카드 ({friendtalkData.carousels?.length || 0}개):</div>
                        {friendtalkData.carousels && friendtalkData.carousels.length > 0 ? (
                          <ul className="space-y-2">
                            {friendtalkData.carousels.map((carousel, idx) => (
                              <li key={idx} className="border-l-2 border-purple-400 pl-2">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs font-medium">카드 {idx + 1}</span>
                                  {carousel.image && <span className="text-purple-600">📷</span>}
                                </div>
                                {carousel.header && <p className="text-xs text-gray-700 font-medium">{carousel.header}</p>}
                                {carousel.content && <p className="text-xs text-gray-700">{carousel.content}</p>}
                                {carousel.buttons && carousel.buttons.length > 0 && (
                                  <p className="text-xs text-gray-500 mt-1">버튼 {carousel.buttons.length}개</p>
                                )}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-xs text-gray-500">(캐러셀 없음)</p>
                        )}
                      </div>
                      {friendtalkData.moreLink && (
                        <div className="bg-blue-50 px-2 py-1 rounded border border-blue-200 text-xs truncate">
                          <span className="font-medium text-blue-700">➕ 더보기:</span>
                          <span className="text-gray-900 ml-1">{friendtalkData.moreLink}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 이미지 정보 (FT/FI/FW 공통) */}
                  {friendtalkData.uploadedImages && friendtalkData.uploadedImages.length > 0 && (
                    <div className="bg-purple-50 px-2 py-1 rounded border border-purple-200 text-xs">
                      <span className="text-purple-600">📷</span>
                      <span className="text-gray-700 ml-1">이미지 {friendtalkData.uploadedImages.length}개 포함</span>
                    </div>
                  )}

                  {/* 이미지 링크 (FW 전용) */}
                  {friendtalkData.messageType === "FW" && friendtalkData.imageLink && (
                    <div className="bg-blue-50 px-2 py-1 rounded border border-blue-200 text-xs truncate">
                      <span className="font-medium text-blue-700">🔗 클릭 시 이동:</span>
                      <span className="text-gray-900 ml-1">{friendtalkData.imageLink}</span>
                    </div>
                  )}

                  {/* 버튼 목록 (모든 타입 공통) */}
                  {friendtalkData.buttons && friendtalkData.buttons.length > 0 && (
                    <div className="bg-green-50 px-2 py-1 rounded border border-green-200">
                      <div className="text-xs font-medium text-green-700 mb-1">버튼 ({friendtalkData.buttons.length}개)</div>
                      <ul className="space-y-1">
                        {friendtalkData.buttons.map((btn, idx) => {
                          const typeLabel = btn.type === 'WL' ? '웹링크' :
                                           btn.type === 'AL' ? '앱링크' :
                                           btn.type === 'BK' ? '봇키워드' :
                                           btn.type === 'MD' ? '메시지전달' : btn.type;
                          return (
                            <li key={idx} className="flex items-center gap-2 text-xs">
                              <span className="font-medium">[{typeLabel}]</span>
                              <span className="text-gray-900">{btn.name}</span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}

                  {/* SMS 전환 발송 */}
                  {friendtalkData.enableSmsBackup && (
                    <div className="text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded">
                      SMS 전환 발송 설정됨
                    </div>
                  )}
                </div>
              )}

              {/* 카카오 브랜드 */}
              {messageType === "brand" && brandData && (
                <div className="bg-white p-3 rounded border border-gray-200 space-y-2 max-h-64 overflow-y-auto">
                  {/* 발신 프로필 */}
                  <div className="text-xs text-gray-500">
                    <span className="font-medium">발신 프로필:</span> {brandData.selectedProfile}
                  </div>

                  {/* 템플릿 정보 */}
                  {brandData.selectedTemplate && (
                    <>
                      <div className="text-xs text-gray-500">
                        <span className="font-medium">템플릿:</span> {brandData.selectedTemplate.template_name}
                      </div>
                      <div className="text-xs text-gray-500">
                        <span className="font-medium">메시지 타입:</span> {brandData.selectedTemplate.message_type}
                      </div>
                      <div className="text-xs text-gray-500">
                        <span className="font-medium">수신 대상:</span>{" "}
                        {brandData.targetingType === "M"
                          ? "회원"
                          : brandData.targetingType === "N"
                          ? "비회원"
                          : "개별"}
                      </div>

                      {/* 메시지 내용 */}
                      {brandData.selectedTemplate.content && (
                        <div className="bg-yellow-50 p-2 rounded border border-yellow-200">
                          <p className="text-sm text-gray-900 whitespace-pre-wrap">
                            {brandData.selectedTemplate.content}
                          </p>
                        </div>
                      )}

                      {/* 이미지 (IMAGE, WIDE 타입) */}
                      {(brandData.selectedTemplate.message_type === "IMAGE" ||
                        brandData.selectedTemplate.message_type === "WIDE") &&
                        brandData.selectedTemplate.image_url && (
                          <div className="bg-blue-50 p-2 rounded border border-blue-200">
                            <span className="text-xs font-medium">🖼️ 이미지:</span>{" "}
                            <span className="text-xs text-gray-600">
                              {brandData.selectedTemplate.image_url}
                            </span>
                            {brandData.selectedTemplate.image_link && (
                              <div className="text-xs text-gray-500 mt-1">
                                링크: {brandData.selectedTemplate.image_link}
                              </div>
                            )}
                          </div>
                        )}

                      {/* 버튼 */}
                      {brandData.selectedTemplate.buttons &&
                        brandData.selectedTemplate.buttons.length > 0 && (
                          <div className="space-y-1">
                            <span className="text-xs font-medium">버튼:</span>
                            {brandData.selectedTemplate.buttons.map((btn: { name: string; type: string; url_mobile?: string }, idx: number) => (
                              <div
                                key={idx}
                                className="bg-gray-100 px-2 py-1 rounded text-xs flex items-center gap-2"
                              >
                                <span className="font-medium">{btn.name}</span>
                                <span className="text-gray-500">
                                  [{btn.type}]
                                  {btn.url_mobile && ` → ${btn.url_mobile}`}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                      {/* SMS 백업 정보 */}
                      {brandData.enableSmsBackup && brandData.smsBackupMessage && (
                        <div className="bg-red-50 p-2 rounded border border-red-200">
                          <span className="text-xs font-medium">📱 문자대체발송:</span>
                          <p className="text-xs text-gray-700 mt-1 whitespace-pre-wrap">
                            {brandData.smsBackupMessage}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* 네이버 톡톡 */}
              {messageType === "naver" && naverData && (
                <div className="bg-white p-3 rounded border border-gray-200 space-y-2">
                  <div className="text-xs text-gray-500">
                    <span className="font-medium">네이버톡 ID:</span> {naverData.navertalkId || '(입력 안됨)'}
                  </div>
                  {naverData.selectedTemplate && (
                    <>
                      <div className="text-xs text-gray-500">
                        <span className="font-medium">템플릿:</span> {naverData.selectedTemplate.name} ({naverData.selectedTemplate.code})
                      </div>
                      <div className="text-xs text-gray-500">
                        <span className="font-medium">상품 코드:</span>{" "}
                        {naverData.productCode === 'INFORMATION' && "정보성 - 알림 (INFORMATION)"}
                        {naverData.productCode === 'BENEFIT' && "마케팅/광고 - 혜택 (BENEFIT)"}
                      </div>
                      <div className="bg-green-50 p-2 rounded border border-green-200 max-h-24 overflow-y-auto">
                        <p className="text-sm text-gray-900 whitespace-pre-wrap">
                          {naverData.templateContent}
                        </p>
                      </div>
                      {naverData.selectedTemplate.buttons && naverData.selectedTemplate.buttons.length > 0 && (
                        <div className="text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded">
                          버튼 {naverData.selectedTemplate.buttons.length}개 포함
                        </div>
                      )}
                      {naverData.templateVariables && naverData.templateVariables.length > 0 && (
                        <div className="text-xs text-purple-700 bg-purple-50 px-2 py-1 rounded">
                          템플릿 변수 {naverData.templateVariables.length}개 사용 중
                        </div>
                      )}
                    </>
                  )}
                  {naverData.smsBackup && (
                    <div className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
                      SMS 백업 설정됨 (현재 미지원)
                    </div>
                  )}
                </div>
              )}
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
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            취소
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            {sendType === "immediate" ? "즉시 전송" : "예약 발송"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SendConfirmModal;
