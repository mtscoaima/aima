"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import RoleGuard from "@/components/RoleGuard";

interface Reservation {
  id: number;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  space_id: number;
  start_datetime: string;
  end_datetime: string;
  status: string;
  guest_count?: number;
  total_amount?: number;
  deposit_amount?: number;
  special_requirements?: string;
  spaces?: {
    id: number;
    name: string;
    icon_text: string;
    icon_color: string;
  };
}

interface MessageTemplate {
  id: number;
  name: string;
  category: string;
  content: string;
  user_id: number;
  is_public: boolean;
  created_at: string;
}

interface Space {
  id: number;
  name: string;
  host_contact_number?: {
    number: string;
  };
}

export default function MessageSendPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sendType, setSendType] = useState("immediate"); // "immediate" or "scheduled"
  const [message, setMessage] = useState("");

  // 기본값: 내일 날짜
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

  // 날짜 저장: displayDate는 화면 표시용, isoDate는 실제 ISO 형식
  const getTomorrowISODate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0]; // YYYY-MM-DD
  };

  const [selectedDate, setSelectedDate] = useState(getTomorrowDate());
  const [selectedISODate, setSelectedISODate] = useState(getTomorrowISODate());
  const [selectedHour, setSelectedHour] = useState("00");
  const [selectedMinute, setSelectedMinute] = useState("00");
  const [showDateCalendar, setShowDateCalendar] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // 예약 선택 관련 상태
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [reservationsLoading, setReservationsLoading] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // 발신자 정보 모달 상태
  const [isSenderInfoModalOpen, setIsSenderInfoModalOpen] = useState(false);
  const [senderInfo, setSenderInfo] = useState<{
    space_name: string;
    sending_number: string;
    reply_contact_number?: string;
    reply_contact_name?: string;
  } | null>(null);

  // 현재 선택된 예약의 호스트 연락처
  const [hostContactNumber, setHostContactNumber] = useState<string>("[비공개]");

  // 로그인한 사용자의 전화번호
  const [userPhoneNumber, setUserPhoneNumber] = useState<string>("");

  // 템플릿 선택 모달 상태
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);

  // 자동 문구 넣기 모달 상태
  const [isVariableModalOpen, setIsVariableModalOpen] = useState(false);
  const [textareaRef, setTextareaRef] = useState<HTMLTextAreaElement | null>(null);

  // 미리보기 모달 상태
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  // 템플릿 추가 모달 상태
  const [isCreateTemplateModalOpen, setIsCreateTemplateModalOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateCategory, setNewTemplateCategory] = useState("예약 확정 안내");

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

  // URL 파라미터로 예약 자동 선택
  useEffect(() => {
    const reservationIdFromUrl = searchParams.get('reservationId');
    if (reservationIdFromUrl) {
      fetchAndSelectReservation(parseInt(reservationIdFromUrl));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // 특정 예약 조회 및 선택
  const fetchAndSelectReservation = async (reservationId: number) => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`/api/reservations/bookings/${reservationId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const reservation = data.reservation;

        // 예약 선택
        await handleSelectReservation(reservation);
      }
    } catch (error) {
      console.error("Error fetching reservation:", error);
    }
  };

  // 전화번호 포맷팅 함수
  const formatPhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return cleaned.slice(0, 3) + '-' + cleaned.slice(3, 7) + '-' + cleaned.slice(7);
    }
    return phone;
  };

  // 전화번호 유효성 검사 함수 (숫자만 10-11자리)
  const isValidPhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= 10 && cleaned.length <= 11;
  };

  // 바이트 수 계산 함수 (한글 3바이트, 영문/숫자 1바이트)
  const calculateBytes = (text: string) => {
    let bytes = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charAt(i);
      if (escape(char).length > 4) {
        // 한글 및 특수문자
        bytes += 3;
      } else {
        // 영문, 숫자
        bytes += 1;
      }
    }
    return bytes;
  };

  // 예약 목록 조회
  const fetchReservations = async () => {
    try {
      setReservationsLoading(true);
      const token = localStorage.getItem("accessToken");
      const response = await fetch("/api/reservations/bookings?status=confirmed", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setReservations(data.reservations || []);
      }
    } catch (error) {
      console.error("Error fetching reservations:", error);
    } finally {
      setReservationsLoading(false);
    }
  };

  // 예약 선택 모달 열기
  const handleOpenReservationModal = () => {
    fetchReservations();
    setSearchQuery("");
    setCurrentPage(1);
    setIsReservationModalOpen(true);
  };

  // 예약 선택 완료
  const handleSelectReservation = async (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setIsReservationModalOpen(false);

    // 예약 시작 시간을 기본 예약 발송 시간으로 설정
    if (reservation.start_datetime) {
      const reservationDate = new Date(reservation.start_datetime);
      const year = reservationDate.getFullYear();
      const month = String(reservationDate.getMonth() + 1).padStart(2, '0');
      const day = String(reservationDate.getDate()).padStart(2, '0');
      const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
      const dayName = dayNames[reservationDate.getDay()];

      setSelectedDate(`${year}.${month}.${day} (${dayName})`);
      setSelectedISODate(reservationDate.toISOString().split('T')[0]); // YYYY-MM-DD
      setSelectedHour(String(reservationDate.getHours()).padStart(2, '0'));
      setSelectedMinute(String(reservationDate.getMinutes()).padStart(2, '0'));
    }

    // 호스트 연락처 정보 가져오기
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`/api/reservations/spaces/${reservation.space_id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const space = data.space;

        // 호스트 연락처 정보 조회
        if (space.host_contact_number_id) {
          const contactResponse = await fetch(`/api/reservations/spaces`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (contactResponse.ok) {
            const contactData = await contactResponse.json();
            const spaceWithContact = contactData.spaces?.find((s: Space) => s.id === space.id);
            setHostContactNumber(spaceWithContact?.host_contact_number?.number || "[비공개]");
          }
        } else {
          setHostContactNumber("[비공개]");
        }
      }
    } catch (error) {
      console.error("Error fetching host contact:", error);
      setHostContactNumber("[비공개]");
    }
  };

  // 검색 및 페이지네이션 필터링
  const getFilteredReservations = () => {
    let filtered = reservations;

    // 검색 필터
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.customer_name?.toLowerCase().includes(query) ||
          r.customer_phone?.toLowerCase().includes(query) ||
          r.spaces?.name?.toLowerCase().includes(query)
      );
    }

    return filtered;
  };

  // 페이지네이션 적용
  const getPaginatedReservations = () => {
    const filtered = getFilteredReservations();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filtered.slice(startIndex, endIndex);
  };

  // 전체 페이지 수 계산
  const getTotalPages = () => {
    const filtered = getFilteredReservations();
    return Math.ceil(filtered.length / itemsPerPage);
  };

  // 예약 리스트 페이지로 이동
  const handleGoToReservationList = () => {
    setIsReservationModalOpen(false);
    router.push("/messages/reservations/list");
  };

  // 템플릿 목록 조회
  const fetchTemplates = async () => {
    try {
      setTemplatesLoading(true);
      const token = localStorage.getItem("accessToken");
      const response = await fetch("/api/reservations/message-templates", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error("Error fetching templates:", error);
    } finally {
      setTemplatesLoading(false);
    }
  };

  // 템플릿 선택 모달 열기
  const handleOpenTemplateModal = () => {
    fetchTemplates();
    setIsTemplateModalOpen(true);
  };

  // 템플릿 선택
  const handleSelectTemplate = (template: MessageTemplate) => {
    setMessage(template.content);
    setIsTemplateModalOpen(false);
  };

  // 자동 문구 넣기 모달 열기
  const handleOpenVariableModal = () => {
    if (!selectedReservation) {
      alert("먼저 받는 사람을 선택해주세요.");
      return;
    }
    setIsVariableModalOpen(true);
  };

  // 변수 삽입
  const handleInsertVariable = (variable: string) => {
    if (!textareaRef) return;

    const cursorPosition = textareaRef.selectionStart;
    const textBeforeCursor = message.substring(0, cursorPosition);
    const textAfterCursor = message.substring(cursorPosition);

    const newMessage = textBeforeCursor + variable + textAfterCursor;
    setMessage(newMessage);

    // 커서 위치를 삽입된 변수 뒤로 이동
    setTimeout(() => {
      if (textareaRef) {
        textareaRef.selectionStart = cursorPosition + variable.length;
        textareaRef.selectionEnd = cursorPosition + variable.length;
        textareaRef.focus();
      }
    }, 0);

    setIsVariableModalOpen(false);
  };

  // 발신자 정보 보기
  const handleShowSenderInfo = async () => {
    if (!selectedReservation) {
      alert("먼저 받는 사람을 선택해주세요.");
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`/api/reservations/spaces/${selectedReservation.space_id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const space = data.space;

        // 호스트 연락처 정보 조회
        if (space.host_contact_number_id) {
          const contactResponse = await fetch(`/api/reservations/spaces`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (contactResponse.ok) {
            const contactData = await contactResponse.json();
            const spaceWithContact = contactData.spaces?.find((s: Space) => s.id === space.id);

            setSenderInfo({
              space_name: space.name,
              sending_number: "[비공개]", // 보내는 번호는 시스템 기본으로 고정
              reply_contact_number: spaceWithContact?.host_contact_number?.number || "[비공개]",
              reply_contact_name: "[비공개]",
            });
          }
        } else {
          setSenderInfo({
            space_name: space.name,
            sending_number: "[비공개]",
            reply_contact_number: "[비공개]",
            reply_contact_name: "시스템 기본",
          });
        }

        setIsSenderInfoModalOpen(true);
      }
    } catch (error) {
      console.error("Error fetching sender info:", error);
      alert("발신자 정보를 불러오는데 실패했습니다.");
    }
  };

  // 날짜 포맷팅 함수
  const formatDateTime = (datetime: string) => {
    const date = new Date(datetime);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}.${month}.${day} ${hours}:${minutes}`;
  };

  // 날짜만 포맷팅 (YYYY-MM-DD)
  const formatDate = (datetime: string) => {
    const date = new Date(datetime);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // 시간만 포맷팅 (HH:mm)
  const formatTime = (datetime: string) => {
    const date = new Date(datetime);
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  // 숫자 포맷팅 (콤마 추가)
  const formatNumber = (num?: number) => {
    if (num === undefined || num === null) return '0';
    return num.toLocaleString('ko-KR');
  };

  // 변수를 실제 값으로 치환하는 함수
  const replaceVariables = (text: string, reservation: Reservation) => {
    // 전화번호 변수: 호스트 연락처가 유효한 전화번호가 아니면 로그인한 사용자 전화번호로 폴백
    const phoneForVariable = isValidPhoneNumber(hostContactNumber)
      ? hostContactNumber
      : (userPhoneNumber || "[비공개]");

    return text
      .replace(/\{\{고객명\}\}/g, reservation.customer_name)
      .replace(/\{\{전화번호\}\}/g, phoneForVariable)
      .replace(/\{\{공간명\}\}/g, reservation.spaces?.name || "-")
      .replace(/\{\{예약날짜\}\}/g, formatDate(reservation.start_datetime))
      .replace(/\{\{체크인시간\}\}/g, formatTime(reservation.start_datetime))
      .replace(/\{\{체크아웃시간\}\}/g, formatTime(reservation.end_datetime))
      .replace(/\{\{인원수\}\}/g, reservation.guest_count ? String(reservation.guest_count) : '')
      .replace(/\{\{총금액\}\}/g, formatNumber(reservation.total_amount))
      .replace(/\{\{입금액\}\}/g, formatNumber(reservation.deposit_amount))
      .replace(/\{\{잔금\}\}/g, formatNumber((reservation.total_amount || 0) - (reservation.deposit_amount || 0)))
      .replace(/\{\{특이사항\}\}/g, reservation.special_requirements || '');
  };

  const handlePreview = () => {
    if (!selectedReservation) {
      alert("먼저 받는 사람을 선택해주세요.");
      return;
    }
    if (!message.trim()) {
      alert("메시지 내용을 입력해주세요.");
      return;
    }
    setIsPreviewModalOpen(true);
  };

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
    // 오늘 이전 날짜는 선택 불가
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      return;
    }

    const days = ['일', '월', '화', '수', '목', '금', '토'];
    // 로컬 타임존 기준으로 ISO 날짜 생성 (UTC 변환 문제 방지)
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const isoDate = `${year}-${month}-${day}`; // YYYY-MM-DD
    const displayDate = `${year}.${month}.${day} (${days[date.getDay()]})`;

    setSelectedDate(displayDate);
    setSelectedISODate(isoDate);
    setShowDateCalendar(false);
  };

  // 캘린더 날짜 생성
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

  const handleSend = async () => {
    if (!selectedReservation) {
      alert("먼저 받는 사람을 선택해주세요.");
      return;
    }
    if (!message.trim()) {
      alert("메시지 내용을 입력해주세요.");
      return;
    }

    if (!confirm("메시지를 발송하시겠습니까?")) {
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("/api/reservations/send-message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          reservationId: selectedReservation.id,
          message: message,
          sendType: "immediate",
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert(`메시지가 발송되었습니다.\n\n타입: ${data.messageType}\n사용 크레딧: ${data.creditUsed}원`);
        // 메시지 내용 초기화
        setMessage("");
        setSelectedReservation(null);
      } else {
        alert(data.error || "메시지 발송에 실패했습니다.");
      }
    } catch (error) {
      console.error("메시지 발송 오류:", error);
      alert("메시지 발송 중 오류가 발생했습니다.");
    }
  };

  const handleScheduledSend = async () => {
    if (!selectedReservation) {
      alert("먼저 받는 사람을 선택해주세요.");
      return;
    }
    if (!message.trim()) {
      alert("메시지 내용을 입력해주세요.");
      return;
    }

    // 로컬 타임존으로 날짜/시간 생성
    const [year, month, day] = selectedISODate.split('-').map(Number);
    const scheduledDateTime = new Date(year, month - 1, day, parseInt(selectedHour), parseInt(selectedMinute), 0);
    const now = new Date();

    // 과거 시간 체크 (1분 여유를 둠)
    const oneMinuteFromNow = new Date(now.getTime() + 60000);
    if (scheduledDateTime <= oneMinuteFromNow) {
      alert(`예약 발송 시간은 현재 시간(${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}) 이후여야 합니다.\n선택된 시간: ${selectedDate} ${selectedHour}:${selectedMinute}`);
      return;
    }

    if (!confirm(`${selectedDate} ${selectedHour}:${selectedMinute}에 메시지를 예약하시겠습니까?`)) {
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("/api/reservations/send-message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          reservationId: selectedReservation.id,
          message: message,
          sendType: "scheduled",
          scheduledAt: scheduledDateTime.toISOString(),
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert(`메시지 예약이 완료되었습니다.\n\n발송 예정: ${selectedDate} ${selectedHour}:${selectedMinute}`);
        setMessage("");
        setSelectedReservation(null);
      } else {
        alert(data.error || "메시지 예약에 실패했습니다.");
      }
    } catch (error) {
      console.error("메시지 예약 오류:", error);
      alert("메시지 예약 중 오류가 발생했습니다.");
    }
  };

  // 템플릿 추가 모달 열기
  const handleOpenCreateTemplateModal = () => {
    if (!message.trim()) {
      alert("먼저 메시지 내용을 입력해주세요.");
      return;
    }
    setNewTemplateName("");
    setNewTemplateCategory("예약 확정 안내");
    setIsCreateTemplateModalOpen(true);
  };

  // 템플릿 저장
  const handleSaveAsTemplate = async () => {
    if (!newTemplateName.trim()) {
      alert("템플릿 이름을 입력해주세요.");
      return;
    }
    if (!message.trim()) {
      alert("메시지 내용이 비어있습니다.");
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("/api/reservations/message-templates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newTemplateName,
          category: newTemplateCategory,
          content: message,
        }),
      });

      if (response.ok) {
        alert("템플릿이 저장되었습니다.");
        setIsCreateTemplateModalOpen(false);
        setNewTemplateName("");
        setNewTemplateCategory("예약 확정 안내");
      } else {
        const data = await response.json();
        alert(data.error || "템플릿 저장에 실패했습니다.");
      }
    } catch (error) {
      console.error("템플릿 저장 오류:", error);
      alert("템플릿 저장 중 오류가 발생했습니다.");
    }
  };

  return (
    <RoleGuard allowedRoles={["USER"]}>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* 헤더 */}
          <div className="mb-8">
            <h1 className="text-xl font-bold text-gray-900">
              메시지 보내기
            </h1>
          </div>

          <div className="space-y-6">
            {/* 받는 사람 */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-gray-900 font-medium">
                  받는 사람<span className="text-red-500">*</span>
                </label>
                <button
                  onClick={handleOpenReservationModal}
                  className="text-blue-500 text-sm flex items-center hover:text-blue-600 cursor-pointer"
                >
                  예약 리스트에서 선택하기
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              {selectedReservation && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{selectedReservation.customer_name}</p>
                      <p className="text-sm text-gray-600">{selectedReservation.customer_phone}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {selectedReservation.spaces?.name} · {formatDateTime(selectedReservation.start_datetime)}
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedReservation(null)}
                      className="text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 발신자 정보 */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-gray-900 font-medium">발신자 정보</label>
                <button
                  onClick={handleShowSenderInfo}
                  className="text-blue-500 text-sm flex items-center hover:text-blue-600 cursor-pointer"
                >
                  내용 보기
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              {selectedReservation && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">
                    공간: {selectedReservation.spaces?.name || "-"}
                  </p>
                  <p className="text-xs text-gray-500">
                    • 발신번호: {userPhoneNumber ? formatPhoneNumber(userPhoneNumber) : "전화번호 미등록"} (프로필에서 변경 가능)
                  </p>
                  <p className="text-xs text-gray-500">
                    • 회신 연락처: 공간별로 설정된 호스트 연락처
                  </p>
                </div>
              )}
            </div>

            {/* 메시지 입력 */}
            <div>
              <textarea
                ref={(el) => setTextareaRef(el)}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="내용을 입력하세요."
                className="w-full h-64 p-4 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="flex justify-between items-center mt-2 text-sm text-gray-500">
                <div className="space-y-1">
                  <p>* 이모지는 발송 과정에서 깨질 수 있습니다.</p>
                  <div className="flex items-center">
                    <span>* 사용 가능한 주요 특수문자</span>
                    <button className="ml-1 text-gray-400 hover:text-gray-600 cursor-pointer">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                  </div>
                </div>
                <span className="text-blue-500">{calculateBytes(message)}/2000 바이트</span>
              </div>
            </div>

            {/* 링크 버튼들 */}
            <div className="flex space-x-4">
              <button
                onClick={handleOpenVariableModal}
                className="text-blue-500 text-sm font-medium cursor-pointer hover:text-blue-600"
              >
                + 자동 문구 넣기
              </button>
              <button
                onClick={handleOpenTemplateModal}
                className="text-blue-500 text-sm font-medium hover:text-blue-600 cursor-pointer"
              >
                내 템플릿에서 불러오기
              </button>
              <button
                onClick={handleOpenCreateTemplateModal}
                className="text-green-600 text-sm font-medium hover:text-green-700 cursor-pointer"
              >
                📝 템플릿에 추가
              </button>
            </div>

            {/* 보내기 방식 */}
            <div>
              <h3 className="text-gray-900 font-medium mb-4">보내기 방식</h3>
              <div className="space-y-3">
                {/* 즉시 발송 */}
                <label className="flex items-center cursor-pointer">
                  <div className="relative">
                    <input
                      type="radio"
                      name="sendType"
                      value="immediate"
                      checked={sendType === "immediate"}
                      onChange={(e) => setSendType(e.target.value)}
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
                <label className="flex items-center cursor-pointer">
                  <div className="relative">
                    <input
                      type="radio"
                      name="sendType"
                      value="scheduled"
                      checked={sendType === "scheduled"}
                      onChange={(e) => setSendType(e.target.value)}
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
              </div>

              {/* 예약 발송 시간 선택 */}
              {sendType === "scheduled" && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="space-y-4">
                    {/* 날짜 - 캘린더 형식 */}
                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-700 mb-2">날짜</label>

                      {/* 날짜 선택 버튼 */}
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

                      {/* 드롭다운 캘린더 */}
                      {showDateCalendar && (
                        <div className="absolute z-10 w-full mt-2 bg-white rounded-lg border border-gray-200 shadow-lg overflow-hidden">
                          {/* 캘린더 네비게이션 */}
                          <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200">
                            <button
                              onClick={handlePrevMonth}
                              className="p-1 hover:bg-gray-200 rounded-lg"
                            >
                              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                              </svg>
                            </button>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {currentMonth.getFullYear()}.{(currentMonth.getMonth() + 1).toString().padStart(2, '0')}
                            </h3>
                            <button
                              onClick={handleNextMonth}
                              className="p-1 hover:bg-gray-200 rounded-lg"
                            >
                              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
                          </div>

                          {/* 캘린더 */}
                          <div className="p-4">
                            {/* 요일 헤더 */}
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

                            {/* 캘린더 그리드 */}
                            <div className="grid grid-cols-7 gap-1">
                              {generateCalendarDays().map((day, index) => {
                                const today = new Date();
                                const isToday = day.toDateString() === today.toDateString();
                                const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
                                const isPastDate = day < today && !isToday;
                                const dayOfWeek = day.getDay();

                                // 선택된 날짜 확인
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

                    {/* 시간 */}
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

            {/* 버튼들 */}
            <div className="flex space-x-3 pt-4">
              <button
                onClick={handlePreview}
                className="flex-1 py-3 px-4 border-2 border-blue-500 text-blue-500 rounded-lg font-medium hover:bg-blue-50 transition-colors duration-200 cursor-pointer"
              >
                미리보기
              </button>
              <button
                onClick={sendType === "immediate" ? handleSend : handleScheduledSend}
                className="flex-1 py-3 px-4 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors duration-200 cursor-pointer"
              >
                {sendType === "immediate" ? "보내기" : "보내기 예약"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 예약 선택 모달 */}
      {isReservationModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">예약 선택</h3>
              <button
                onClick={() => setIsReservationModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* 검색 및 상세보기 버튼 */}
            <div className="mb-4 space-y-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="고객명, 전화번호, 공간명으로 검색..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <svg
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <button
                onClick={handleGoToReservationList}
                className="w-full py-2 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium cursor-pointer"
              >
                예약 리스트 상세보기
              </button>
            </div>

            {/* 예약 목록 */}
            <div className="flex-1 overflow-y-auto">
              {reservationsLoading ? (
                <div className="text-center py-8 text-gray-500">로딩 중...</div>
              ) : getFilteredReservations().length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {searchQuery ? "검색 결과가 없습니다." : "확정된 예약이 없습니다."}
                </div>
              ) : (
                <div className="space-y-2">
                  {getPaginatedReservations().map((reservation) => (
                    <button
                      key={reservation.id}
                      onClick={() => handleSelectReservation(reservation)}
                      className="w-full p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left transition-colors cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">
                              {reservation.customer_name}
                            </span>
                            <span className="text-sm text-gray-600">
                              {reservation.customer_phone}
                            </span>
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            <span className="font-medium">{reservation.spaces?.name}</span>
                            <span className="mx-2">·</span>
                            <span>{formatDateTime(reservation.start_datetime)}</span>
                            <span className="mx-1">~</span>
                            <span>{formatDateTime(reservation.end_datetime)}</span>
                          </div>
                        </div>
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 페이지네이션 */}
            {!reservationsLoading && getFilteredReservations().length > 0 && (
              <div className="mt-4 flex items-center justify-between border-t pt-4">
                <div className="text-sm text-gray-600">
                  전체 {getFilteredReservations().length}건 중 {((currentPage - 1) * itemsPerPage) + 1}-
                  {Math.min(currentPage * itemsPerPage, getFilteredReservations().length)}건
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    이전
                  </button>
                  <span className="text-sm text-gray-600">
                    {currentPage} / {getTotalPages()}
                  </span>
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(getTotalPages(), prev + 1))}
                    disabled={currentPage === getTotalPages()}
                    className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    다음
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 발신자 정보 모달 */}
      {isSenderInfoModalOpen && senderInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">발신자 정보</h3>
              <button
                onClick={() => setIsSenderInfoModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  📌 발신번호는 로그인한 사용자의 전화번호로 발송되며, 회신 연락처는 공간별로 설정할 수 있습니다.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">공간</label>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-gray-900">{senderInfo.space_name}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">보내는 번호 (발신번호)</label>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-gray-900 font-medium">{userPhoneNumber ? formatPhoneNumber(userPhoneNumber) : "전화번호 미등록"}</p>
                    <p className="text-sm text-gray-500 mt-1">프로필에서 변경 가능</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">회신 연락처 (호스트 연락처)</label>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-gray-900 font-medium">{senderInfo.reply_contact_number || "[비공개]"}</p>
                    <p className="text-sm text-gray-500 mt-1">{senderInfo.reply_contact_name || "시스템 기본"}</p>
                  </div>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <p className="text-xs text-gray-600">
                    💡 회신 연락처를 변경하려면 &quot;예약 관리 &gt; 메시지 &gt; 발신자 정보 설정&quot;에서 공간별 호스트 연락처를 설정해주세요.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsSenderInfoModalOpen(false)}
                className="w-full py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors cursor-pointer"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 템플릿 선택 모달 */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">템플릿 선택</h3>
              <button
                onClick={() => setIsTemplateModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* 템플릿 목록 */}
            <div className="flex-1 overflow-y-auto">
              {templatesLoading ? (
                <div className="text-center py-8 text-gray-500">로딩 중...</div>
              ) : templates.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  저장된 템플릿이 없습니다.
                </div>
              ) : (
                <div className="space-y-3">
                  {templates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => handleSelectTemplate(template)}
                      className="w-full p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left transition-colors cursor-pointer"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 mb-1">
                            {template.name}
                          </h4>
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {template.content}
                          </p>
                          {template.category && (
                            <span className="inline-block mt-2 px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded">
                              {template.category}
                            </span>
                          )}
                        </div>
                        <svg className="w-5 h-5 text-gray-400 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 자동 문구 넣기 모달 */}
      {isVariableModalOpen && selectedReservation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">자동 문구 선택</h3>
              <button
                onClick={() => setIsVariableModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-gray-600 mb-4">
                커서 위치에 예약 정보가 자동으로 삽입됩니다.
              </p>

              <button
                onClick={() => handleInsertVariable(`{{고객명}}`)}
                className="w-full p-3 border border-gray-200 rounded-lg hover:bg-gray-50 text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">고객명</p>
                    <p className="text-sm text-gray-500 mt-1">예시: {selectedReservation.customer_name}</p>
                  </div>
                  <span className="text-blue-500 text-sm font-mono">{"{{고객명}}"}</span>
                </div>
              </button>

              <button
                onClick={() => handleInsertVariable(`{{전화번호}}`)}
                className="w-full p-3 border border-gray-200 rounded-lg hover:bg-gray-50 text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">전화번호 (호스트 연락처)</p>
                    <p className="text-sm text-gray-500 mt-1">예시: {hostContactNumber}</p>
                  </div>
                  <span className="text-blue-500 text-sm font-mono">{"{{전화번호}}"}</span>
                </div>
              </button>

              <button
                onClick={() => handleInsertVariable(`{{공간명}}`)}
                className="w-full p-3 border border-gray-200 rounded-lg hover:bg-gray-50 text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">공간명</p>
                    <p className="text-sm text-gray-500 mt-1">예시: {selectedReservation.spaces?.name || "-"}</p>
                  </div>
                  <span className="text-blue-500 text-sm font-mono">{"{{공간명}}"}</span>
                </div>
              </button>

              <button
                onClick={() => handleInsertVariable(`{{예약날짜}}`)}
                className="w-full p-3 border border-gray-200 rounded-lg hover:bg-gray-50 text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">예약날짜</p>
                    <p className="text-sm text-gray-500 mt-1">예시: {formatDate(selectedReservation.start_datetime)}</p>
                  </div>
                  <span className="text-blue-500 text-sm font-mono">{"{{예약날짜}}"}</span>
                </div>
              </button>

              <button
                onClick={() => handleInsertVariable(`{{체크인시간}}`)}
                className="w-full p-3 border border-gray-200 rounded-lg hover:bg-gray-50 text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">체크인시간</p>
                    <p className="text-sm text-gray-500 mt-1">예시: {formatTime(selectedReservation.start_datetime)}</p>
                  </div>
                  <span className="text-blue-500 text-sm font-mono">{"{{체크인시간}}"}</span>
                </div>
              </button>

              <button
                onClick={() => handleInsertVariable(`{{체크아웃시간}}`)}
                className="w-full p-3 border border-gray-200 rounded-lg hover:bg-gray-50 text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">체크아웃시간</p>
                    <p className="text-sm text-gray-500 mt-1">예시: {formatTime(selectedReservation.end_datetime)}</p>
                  </div>
                  <span className="text-blue-500 text-sm font-mono">{"{{체크아웃시간}}"}</span>
                </div>
              </button>

              <button
                onClick={() => handleInsertVariable(`{{인원수}}`)}
                className="w-full p-3 border border-gray-200 rounded-lg hover:bg-gray-50 text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">인원수</p>
                    <p className="text-sm text-gray-500 mt-1">예시: {selectedReservation.guest_count || '-'}</p>
                  </div>
                  <span className="text-blue-500 text-sm font-mono">{"{{인원수}}"}</span>
                </div>
              </button>

              <button
                onClick={() => handleInsertVariable(`{{총금액}}`)}
                className="w-full p-3 border border-gray-200 rounded-lg hover:bg-gray-50 text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">총금액</p>
                    <p className="text-sm text-gray-500 mt-1">예시: {formatNumber(selectedReservation.total_amount)}원</p>
                  </div>
                  <span className="text-blue-500 text-sm font-mono">{"{{총금액}}"}</span>
                </div>
              </button>

              <button
                onClick={() => handleInsertVariable(`{{입금액}}`)}
                className="w-full p-3 border border-gray-200 rounded-lg hover:bg-gray-50 text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">입금액</p>
                    <p className="text-sm text-gray-500 mt-1">예시: {formatNumber(selectedReservation.deposit_amount)}원</p>
                  </div>
                  <span className="text-blue-500 text-sm font-mono">{"{{입금액}}"}</span>
                </div>
              </button>

              <button
                onClick={() => handleInsertVariable(`{{잔금}}`)}
                className="w-full p-3 border border-gray-200 rounded-lg hover:bg-gray-50 text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">잔금</p>
                    <p className="text-sm text-gray-500 mt-1">예시: {formatNumber((selectedReservation.total_amount || 0) - (selectedReservation.deposit_amount || 0))}원</p>
                  </div>
                  <span className="text-blue-500 text-sm font-mono">{"{{잔금}}"}</span>
                </div>
              </button>

              <button
                onClick={() => handleInsertVariable(`{{특이사항}}`)}
                className="w-full p-3 border border-gray-200 rounded-lg hover:bg-gray-50 text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">특이사항</p>
                    <p className="text-sm text-gray-500 mt-1">예시: {selectedReservation.special_requirements || '-'}</p>
                  </div>
                  <span className="text-blue-500 text-sm font-mono">{"{{특이사항}}"}</span>
                </div>
              </button>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
                <p className="text-xs text-blue-800">
                  💡 변수는 실제 메시지 발송 시 고객별 정보로 자동 변환됩니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 미리보기 모달 */}
      {isPreviewModalOpen && selectedReservation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">메시지 미리보기</h3>
              <button
                onClick={() => setIsPreviewModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* 수신자 정보 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">수신자 정보</h4>
                <div className="space-y-1 text-sm">
                  <p className="text-gray-900">
                    <span className="font-medium">이름:</span> {selectedReservation.customer_name}
                  </p>
                  <p className="text-gray-900">
                    <span className="font-medium">전화번호:</span> {selectedReservation.customer_phone}
                  </p>
                  <p className="text-gray-900">
                    <span className="font-medium">공간:</span> {selectedReservation.spaces?.name || "-"}
                  </p>
                </div>
              </div>

              {/* 발신자 정보 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">발신자 정보</h4>
                <div className="space-y-1 text-sm">
                  <p className="text-gray-900">
                    <span className="font-medium">발신번호:</span> {userPhoneNumber ? formatPhoneNumber(userPhoneNumber) : "전화번호 미등록"}
                  </p>
                  <p className="text-gray-600 text-xs mt-1">
                    로그인한 사용자 전화번호
                  </p>
                </div>
              </div>

              {/* 메시지 내용 */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-2">메시지 내용</h4>
                <div className="bg-white rounded-lg p-3 border border-blue-200">
                  <p className="text-gray-900 whitespace-pre-wrap break-words">
                    {replaceVariables(message, selectedReservation)}
                  </p>
                </div>
                <p className="text-xs text-blue-700 mt-2">
                  {calculateBytes(replaceVariables(message, selectedReservation))} / 2000 바이트
                </p>
              </div>

              {/* 발송 방식 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">발송 방식</h4>
                <p className="text-sm text-gray-900">
                  {sendType === "immediate" ? (
                    "즉시 발송"
                  ) : (
                    `예약 발송: ${selectedDate} ${selectedHour}:${selectedMinute}`
                  )}
                </p>
              </div>

              {/* 안내 메시지 */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-xs text-yellow-800">
                  ⚠️ 위 내용으로 메시지가 발송됩니다. 내용을 확인해주세요.
                </p>
              </div>

              {/* 버튼 */}
              <div className="flex space-x-3">
                <button
                  onClick={() => setIsPreviewModalOpen(false)}
                  className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  수정하기
                </button>
                <button
                  onClick={() => {
                    setIsPreviewModalOpen(false);
                    if (sendType === "immediate") {
                      handleSend();
                    } else {
                      handleScheduledSend();
                    }
                  }}
                  className="flex-1 py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors cursor-pointer"
                >
                  {sendType === "immediate" ? "발송하기" : "예약하기"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 템플릿 추가 모달 */}
      {isCreateTemplateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">템플릿에 추가</h3>
              <button
                onClick={() => setIsCreateTemplateModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* 템플릿 이름 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  템플릿 이름 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  placeholder="예: 예약 확정 안내"
                  maxLength={100}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">{newTemplateName.length}/100자</p>
              </div>

              {/* 카테고리 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  카테고리 <span className="text-red-500">*</span>
                </label>
                <select
                  value={newTemplateCategory}
                  onChange={(e) => setNewTemplateCategory(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="예약 확정 안내">예약 확정 안내</option>
                  <option value="체크인 안내">체크인 안내</option>
                  <option value="체크아웃 안내">체크아웃 안내</option>
                  <option value="예약 변경 안내">예약 변경 안내</option>
                  <option value="예약 취소 안내">예약 취소 안내</option>
                  <option value="기타">기타</option>
                </select>
              </div>

              {/* 템플릿 내용 (읽기 전용 미리보기) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  템플릿 내용
                </label>
                <div className="w-full p-3 border border-gray-200 rounded-lg bg-gray-50 min-h-[200px] whitespace-pre-wrap">
                  {message}
                </div>
                <p className="text-xs text-gray-500 mt-1">{calculateBytes(message)}/2000 바이트</p>
              </div>

              {/* 안내 메시지 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-800">
                  💡 현재 입력된 메시지 내용이 템플릿으로 저장됩니다. 변수(&#123;&#123;고객명&#125;&#125; 등)도 함께 저장됩니다.
                </p>
              </div>

              {/* 버튼 */}
              <div className="flex space-x-3">
                <button
                  onClick={() => setIsCreateTemplateModalOpen(false)}
                  className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  취소
                </button>
                <button
                  onClick={handleSaveAsTemplate}
                  className="flex-1 py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors cursor-pointer"
                >
                  저장하기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </RoleGuard>
  );
}