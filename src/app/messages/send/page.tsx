"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Smartphone,
  Phone,
  Users,
  Save,
  Target,
  Star,
  Camera,
  Paperclip,
  FileText,
  RotateCcw,
  Clock,
  Info,
  HelpCircle,
  FileSpreadsheet,
  X,
  Search,
  Settings,
  ArrowLeftRight,
  RefreshCw,
} from "lucide-react";
import "./styles.css";

export default function MessageSendPage() {
  const [selectedTab, setSelectedTab] = useState("문자메시지");
  const [recipientNumbers, setRecipientNumbers] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isOverseas, setIsOverseas] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSenderModal, setShowSenderModal] = useState(false);
  const [selectedSender, setSelectedSender] = useState("테스트 번호");
  const [searchTerm, setSearchTerm] = useState("");
  const [showMoreMenu, setShowMoreMenu] = useState("");
  const [showAliasModal, setShowAliasModal] = useState(false);
  const [editingNumber, setEditingNumber] = useState("");
  const [aliasValue, setAliasValue] = useState("");
  const [recipientList, setRecipientList] = useState<string[]>([]);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  // 발신번호 목록 (예시 데이터)
  const [senderNumbers, setSenderNumbers] = useState([
    { number: "010-1234-5678", status: "별칭 없음", verified: true },
    { number: "010-9876-5432", status: "별칭 없음", verified: true },
  ]);

  const filteredNumbers = senderNumbers.filter(
    (sender) => sender.number.includes(searchTerm) || searchTerm === ""
  );

  // 외부 클릭 시 더보기 메뉴 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        moreMenuRef.current &&
        !moreMenuRef.current.contains(event.target as Node)
      ) {
        setShowMoreMenu("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const tabs = [
    { id: "문자메시지", name: "문자메시지", color: "#4CAF50" },
    { id: "알림톡", name: "알림톡", color: "#FFC107" },
    { id: "친구톡", name: "친구톡", color: "#424242" },
    { id: "RCS 문자", name: "RCS 문자", color: "#2196F3" },
    { id: "네이버톡톡", name: "네이버톡톡", color: "#00C851" },
    { id: "음성메시지", name: "음성메시지", color: "#FF9800" },
    { id: "해외문자", name: "해외문자", color: "#9C27B0" },
  ];

  const handleSend = async () => {
    if (!selectedSender) {
      alert("발신번호를 선택해주세요.");
      return;
    }

    if (recipientList.length === 0 && !recipientNumbers) {
      alert("수신자를 추가해주세요.");
      return;
    }

    if (!message) {
      alert("메시지 내용을 입력해주세요.");
      return;
    }

    setIsLoading(true);
    try {
      // 수신자 목록이 있으면 목록을 사용하고, 없으면 입력된 번호 사용
      const recipients =
        recipientList.length > 0 ? recipientList : [recipientNumbers];

      // 빈 번호 제거
      const validRecipients = recipients.filter((number) => number.trim());

      if (validRecipients.length === 0) {
        alert("유효한 수신번호가 없습니다.");
        return;
      }

      const response = await fetch("/api/message/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          toNumbers: validRecipients.map((number) => number.replace(/-/g, "")), // 하이픈 제거
          subject: subject,
          message: message,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        alert(result.message);

        // 성공 시 폼 초기화 (선택사항)
        if (result.success) {
          // setRecipientNumbers("");
          // setMessage("");
          // setSubject("");
          // setRecipientList([]);
        }
      } else {
        // 서버에서 반환된 상세 오류 메시지 표시
        const errorMessage = result.error || "알 수 없는 오류가 발생했습니다.";
        const details = result.details
          ? `\n\n상세 정보: ${result.details}`
          : "";

        alert(`메시지 전송에 실패했습니다.\n\n${errorMessage}${details}`);

        // 인증 오류인 경우 추가 안내
        if (
          errorMessage.includes("인증 실패") ||
          errorMessage.includes("Authentication Failed")
        ) {
          console.error("NAVER SENS 인증 오류 - 환경 변수를 확인하세요:", {
            hasServiceId: !!process.env.NAVER_SENS_SERVICE_ID,
            hasAccessKey: !!process.env.NAVER_ACCESS_KEY_ID,
            hasSecretKey: !!process.env.NAVER_SECRET_KEY,
          });
        }
      }
    } catch (error) {
      console.error("메시지 전송 오류:", error);
      alert("메시지 전송 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // 수신번호 추가 함수
  const handleAddRecipient = () => {
    const number = recipientNumbers.trim();
    if (!number) {
      alert("수신번호를 입력해주세요.");
      return;
    }

    // 번호 형식 검증 (간단한 검증)
    const phoneRegex = /^(\+?\d{1,3})?[\s-]?\d{2,4}[\s-]?\d{3,4}[\s-]?\d{4}$/;
    if (!phoneRegex.test(number)) {
      alert("올바른 전화번호 형식을 입력해주세요.");
      return;
    }

    // 중복 확인
    if (recipientList.includes(number)) {
      alert("이미 추가된 번호입니다.");
      return;
    }

    setRecipientList((prev) => [...prev, number]);
    setRecipientNumbers(""); // 입력 필드 초기화
  };

  // 수신번호 삭제 함수
  const handleRemoveRecipient = (numberToRemove: string) => {
    setRecipientList((prev) =>
      prev.filter((number) => number !== numberToRemove)
    );
  };

  // 수신자 목록 전체 삭제
  const handleClearRecipients = () => {
    setRecipientList([]);
  };

  // Enter 키로 번호 추가
  const handleRecipientKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAddRecipient();
    }
  };

  const handleSenderSelect = (number: string) => {
    if (selectedSender === number) {
      // 이미 선택된 번호를 다시 클릭하면 선택 해제
      setSelectedSender("");
    } else {
      // 새로운 번호 선택
      setSelectedSender(number);
    }
    setShowSenderModal(false);
    setSearchTerm("");
  };

  const handleMoreClick = (number: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setShowMoreMenu(showMoreMenu === number ? "" : number);
  };

  const handleAliasEdit = (number: string) => {
    setEditingNumber(number);
    const sender = senderNumbers.find((s) => s.number === number);
    setAliasValue(sender?.status === "별칭 없음" ? "" : sender?.status || "");
    setShowAliasModal(true);
    setShowMoreMenu("");
  };

  const handleAliasSave = () => {
    setSenderNumbers((prev) =>
      prev.map((sender) =>
        sender.number === editingNumber
          ? { ...sender, status: aliasValue || "별칭 없음" }
          : sender
      )
    );
    setShowAliasModal(false);
    setEditingNumber("");
    setAliasValue("");
  };

  const handleDefaultSet = (number: string) => {
    // 기본으로 설정 로직 (여기서는 단순히 메뉴만 닫음)
    setShowMoreMenu("");
    alert(`${number}을(를) 기본으로 설정했습니다.`);
  };

  return (
    <div className="message-send-container">
      <div className="message-content">
        {/* 좌측 메인 콘텐츠 */}
        <div className="left-content">
          <div className="content-section">
            <div className="section-header">
              <Smartphone className="icon" size={16} />
              <span>메시지 발신번호</span>
            </div>
            {selectedSender ? (
              <div className="selected-sender">
                <div className="sender-info-row">
                  <div className="sender-details">
                    <div className="sender-display">
                      <Phone className="sender-icon" size={16} />
                      <span className="sender-title">메시지 발신번호</span>
                    </div>
                    <div className="sender-number">{selectedSender}</div>
                  </div>
                  <button
                    className="change-button"
                    onClick={() => setShowSenderModal(true)}
                    disabled
                    style={{ opacity: 0.5, cursor: "not-allowed" }}
                  >
                    <ArrowLeftRight size={14} />
                    변경
                  </button>
                </div>
              </div>
            ) : (
              <div className="sender-selection">
                <div className="sender-info">
                  <span className="sender-label">선택된 발신번호 없음</span>
                  <button
                    className="select-button"
                    onClick={() => setShowSenderModal(true)}
                    disabled
                    style={{ opacity: 0.5, cursor: "not-allowed" }}
                  >
                    선택
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="content-section">
            <div className="section-header">
              <Phone className="icon" size={16} />
              <span>메시지 수신번호</span>
            </div>
            <div className="recipient-input">
              <input
                type="text"
                value={recipientNumbers}
                onChange={(e) => setRecipientNumbers(e.target.value)}
                placeholder="01022224444 수신"
                className="number-input"
                onKeyDown={handleRecipientKeyPress}
              />
              <div className="input-help">
                <HelpCircle className="help-icon" size={14} />
              </div>
              <div className="input-actions">
                <button className="action-btn add" onClick={handleAddRecipient}>
                  <span>+</span>
                  추가
                </button>
                <button className="action-btn excel">
                  <FileSpreadsheet size={14} />
                  엑셀
                </button>
                <button className="action-btn text">
                  <FileText size={14} />
                  텍스트
                </button>
              </div>
            </div>
          </div>

          <div className="content-section">
            <div className="section-header">
              <Users className="icon" size={16} />
              <span>추가한 수신번호 (총 {recipientList.length}개)</span>
              <button className="hide-button" onClick={handleClearRecipients}>
                비우기
              </button>
            </div>
            <div className="recipient-list">
              {recipientList.length === 0 ? (
                <p className="empty-message">수신자명단이 비어있습니다.</p>
              ) : (
                recipientList.map((number, index) => (
                  <div key={index} className="recipient-item">
                    <span className="recipient-number">{number}</span>
                    <button
                      className="remove-btn"
                      onClick={() => handleRemoveRecipient(number)}
                    >
                      <X size={14} />
                      제거
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="content-section">
            <div className="section-header">
              <Save className="icon" size={16} />
              <span>저장</span>
            </div>
          </div>

          {/* 광고 배너 */}
          <div className="ad-banner">
            <div className="ad-content">
              <Target className="ad-icon" size={16} />
              <span>이제는 자동으로 메시지를 보내세요!</span>
            </div>
          </div>

          <div className="ad-banner blue">
            <div className="ad-content">
              <Star className="ad-icon" size={16} />
              <span>지금 출리픽 단축 URL을 활용해보세요!</span>
            </div>
            <div className="ad-footer">
              <span>예약은 전송준비에서 가능합니다.</span>
            </div>
          </div>
        </div>

        {/* 우측 메인 콘텐츠 */}
        <div className="right-content">
          {/* 상단 탭 */}
          <div className="message-tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`tab-button ${
                  selectedTab === tab.id ? "active" : ""
                }`}
                onClick={() => setSelectedTab(tab.id)}
                style={{
                  backgroundColor:
                    selectedTab === tab.id ? tab.color : "#f8f9fa",
                  color: selectedTab === tab.id ? "white" : "#666",
                }}
              >
                {tab.name}
              </button>
            ))}
          </div>

          <div className="message-form">
            {selectedTab === "알림톡" ? (
              <>
                {/* 알림톡 전용 섹션 */}
                <div className="form-group">
                  <div className="alimtalk-sections">
                    <div className="kakao-section">
                      <div className="kakao-header">
                        <span className="kakao-title">카카오 채널</span>
                        <div className="kakao-status">
                          <span className="status-text">
                            연동된 채널이 없습니다.
                          </span>
                          <button className="connect-btn">연동하기</button>
                        </div>
                      </div>
                    </div>

                    <div className="template-section">
                      <div className="template-header">
                        <span className="template-title">알림톡 템플릿</span>
                        <div className="template-status">
                          <span className="status-text">
                            먼저 카카오 채널을 선택해주세요.
                          </span>
                          <button className="select-btn-template">선택</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="사용할 템플릿을 선택하면, 이곳에 템플릿 내용이 표시됩니다. (내용수정불가)"
                    className="message-textarea template-textarea"
                    maxLength={2000}
                    readOnly
                  />
                  <div className="message-footer alimtalk-footer">
                    <span className="char-count">
                      {message.length} / 2,000 bytes
                    </span>
                  </div>
                </div>

                <div className="form-group">
                  <div className="section-header">
                    <Save className="icon" size={16} />
                    <span>문구 치환</span>
                  </div>
                  <div className="save-message">
                    <Info className="icon" size={16} />
                    <span>내용에 변수가 없습니다.</span>
                  </div>
                </div>

                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={isOverseas}
                      onChange={(e) => setIsOverseas(e.target.checked)}
                    />
                    <span>발송실패 시 문자대체발송 여부</span>
                  </label>
                </div>
              </>
            ) : selectedTab === "친구톡" ? (
              <>
                {/* 친구톡 전용 섹션 */}
                <div className="form-group">
                  <div className="kakao-section">
                    <div className="kakao-header">
                      <span className="kakao-title">카카오 채널</span>
                      <div className="kakao-status">
                        <span className="status-text">
                          연동된 채널이 없습니다.
                        </span>
                        <button className="connect-btn">연동하기</button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="이곳에 문자 내용을 입력합니다
치환문구 예시) #{이름}님 #{시간}까지 방문 예약입니다."
                    className="message-textarea"
                    maxLength={1000}
                  />
                  <div className="message-footer">
                    <div className="message-actions">
                      <button className="action-icon">
                        <Camera size={18} />
                      </button>
                      <button className="action-icon">
                        <Paperclip size={18} />
                      </button>
                      <button className="action-icon">
                        <FileText size={18} />
                      </button>
                      <button className="action-icon">
                        <RotateCcw size={18} />
                      </button>
                      <button className="action-icon">
                        <Clock size={18} />
                      </button>
                    </div>
                    <span className="char-count">
                      {message.length} / 1,000 자
                    </span>
                  </div>
                </div>

                <div className="form-group">
                  <div className="section-header">
                    <Users className="icon" size={16} />
                    <span>친구톡 버튼</span>
                  </div>
                  <div className="friend-button-section">
                    <button className="add-button-btn">
                      <span>+</span>
                      친구톡 버튼 추가
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <div className="section-header">
                    <Save className="icon" size={16} />
                    <span>문구 치환</span>
                  </div>
                  <div className="save-message">
                    <Info className="icon" size={16} />
                    <span>내용에 변수가 없습니다.</span>
                  </div>
                </div>

                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={false}
                      onChange={() => {}}
                    />
                    <span>광고메시지 여부</span>
                  </label>
                </div>

                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={isOverseas}
                      onChange={(e) => setIsOverseas(e.target.checked)}
                    />
                    <span>발송실패 시 문자대체발송 여부</span>
                  </label>
                </div>
              </>
            ) : selectedTab === "RCS 문자" ? (
              <>
                {/* RCS 문자 전용 섹션 */}
                <div className="form-group">
                  <div className="rcs-sections">
                    <div className="rcs-brand-section">
                      <div className="rcs-header">
                        <span className="rcs-title">RCS 브랜드</span>
                        <div className="rcs-status">
                          <span className="status-text">
                            RCS 브랜드를 선택하세요.
                          </span>
                          <button className="connect-btn">연동하기</button>
                        </div>
                      </div>
                    </div>

                    <div className="rcs-template-section">
                      <div className="rcs-header">
                        <span className="rcs-title">RCS 템플릿</span>
                        <div className="rcs-status">
                          <span className="status-text">
                            RCS 템플릿 없음 (내용 직접 입력)
                          </span>
                          <button className="select-btn-template">등록</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label>제목</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="제목"
                    className="subject-input"
                    maxLength={30}
                  />
                  <span className="char-count">{subject.length}/30자</span>
                </div>

                <div className="form-group">
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="이곳에 RCS 문자 내용을 입력합니다
치환문구 예시) #{이름}님 #{시간}까지 방문 예약입니다."
                    className="message-textarea"
                    maxLength={1300}
                  />
                  <div className="message-footer">
                    <div className="message-actions">
                      <button className="action-icon">
                        <Camera size={18} />
                      </button>
                      <button className="action-icon">
                        <Paperclip size={18} />
                      </button>
                      <button className="action-icon">
                        <FileText size={18} />
                      </button>
                      <button className="action-icon">
                        <RotateCcw size={18} />
                      </button>
                      <button className="action-icon">
                        <Clock size={18} />
                      </button>
                    </div>
                    <span className="char-count">
                      {message.length} / 1,300 자
                    </span>
                  </div>
                </div>

                <div className="form-group">
                  <div className="rcs-button-slide-sections">
                    <div className="rcs-button-section">
                      <div className="section-header">
                        <Users className="icon" size={16} />
                        <span>RCS 메시지 버튼</span>
                      </div>
                      <div className="rcs-button-content">
                        <button className="add-button-btn">
                          <span>+</span>
                          버튼 추가 (0 / 2)
                        </button>
                      </div>
                    </div>

                    <div className="rcs-slide-section">
                      <div className="section-header">
                        <FileText className="icon" size={16} />
                        <span>RCS 슬라이드</span>
                      </div>
                      <div className="rcs-slide-content">
                        <div className="slide-tabs">
                          <button className="slide-tab active">사용안함</button>
                          <button className="slide-tab">좁게</button>
                          <button className="slide-tab">넓게</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <div className="section-header">
                    <Save className="icon" size={16} />
                    <span>문구 치환</span>
                  </div>
                  <div className="save-message">
                    <Info className="icon" size={16} />
                    <span>내용에 변수가 없습니다.</span>
                  </div>
                </div>

                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={false}
                      onChange={() => {}}
                    />
                    <span>광고메시지 여부</span>
                  </label>
                </div>

                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={isOverseas}
                      onChange={(e) => setIsOverseas(e.target.checked)}
                    />
                    <span>발송실패 시 문자대체발송 여부</span>
                  </label>
                </div>

                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={false}
                      onChange={() => {}}
                    />
                    <span>메시지 공유가능여부</span>
                  </label>
                </div>
              </>
            ) : selectedTab === "네이버톡톡" ? (
              <>
                {/* 네이버톡톡 전용 섹션 */}
                <div className="form-group">
                  <div className="naver-info-section">
                    <div className="naver-info-header">
                      <span className="naver-info-text">
                        [네이버스마트알림 발송방법 및 수신확인 문의 : 1577-1603]
                      </span>
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <div className="naver-sections">
                    <div className="naver-select-section">
                      <div className="naver-header">
                        <span className="naver-title">네이버톡 선택</span>
                      </div>
                      <div className="naver-dropdown">
                        <select className="naver-select">
                          <option>네이버톡 선택</option>
                        </select>
                      </div>
                    </div>

                    <div className="naver-template-section">
                      <div className="naver-header">
                        <span className="naver-title">템플릿 선택</span>
                      </div>
                      <div className="naver-dropdown">
                        <select className="naver-select">
                          <option>템플릿 선택</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <div className="naver-template-content">
                    <div className="template-content-header">
                      <span className="template-content-title">
                        템플릿 내용
                      </span>
                    </div>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="사용할 템플릿을 선택하면, 이곳에 템플릿 내용이 표시됩니다. (내용수정불가)"
                      className="message-textarea template-textarea naver-textarea"
                      maxLength={2000}
                      readOnly
                    />
                  </div>
                </div>

                <div className="form-group">
                  <div className="section-header">
                    <Save className="icon" size={16} />
                    <span>문구 치환</span>
                  </div>
                  <div className="save-message">
                    <Info className="icon" size={16} />
                    <span>내용에 변수가 없습니다.</span>
                  </div>
                </div>

                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={isOverseas}
                      onChange={(e) => setIsOverseas(e.target.checked)}
                    />
                    <span>발송실패 시 문자대체발송 여부</span>
                  </label>
                </div>
              </>
            ) : selectedTab === "음성메시지" ? (
              <>
                {/* 음성메시지 전용 섹션 */}
                <div className="form-group">
                  <div className="voice-info-section">
                    <div className="voice-info-header">
                      <span className="voice-info-text">
                        저렴하신가요? 다양한 예제를 확인해보세요.
                      </span>
                      <button className="voice-info-btn">
                        <Star size={14} />
                        활용 예제 보기
                      </button>
                    </div>
                    <div className="voice-status-buttons">
                      <button className="status-btn female active">
                        <span className="status-icon">♀</span>
                        여성목소리
                      </button>
                      <button className="status-btn male">
                        <span className="status-icon">♂</span>
                        남성목소리
                      </button>
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <div className="voice-section">
                    <div className="voice-header">
                      <span className="voice-title">머리말 (선택사항)</span>
                      <span className="voice-subtitle">
                        통화 시작 시 가장 먼저 재생되는 음성입니다.
                      </span>
                    </div>
                    <textarea
                      value=""
                      onChange={() => {}}
                      placeholder="안녕하세요? 솔라피 고객센터입니다. 통화 연결을 계속하려면 아무 번호나 누르세요."
                      className="voice-textarea"
                      maxLength={135}
                    />
                    <div className="voice-footer">
                      <div className="voice-actions">
                        <button className="voice-action-btn">
                          <span>∥</span>
                          1초 멈춤
                        </button>
                        <button className="voice-action-btn">
                          <FileText size={14} />
                          날짜
                        </button>
                        <button className="voice-action-btn">
                          <Clock size={14} />
                          시간
                        </button>
                        <button className="voice-action-btn">
                          <Phone size={14} />
                          번호 읽기
                        </button>
                        <button className="voice-action-btn">
                          <ArrowLeftRight size={14} />
                          속도
                        </button>
                        <button className="voice-action-btn">
                          <Users size={14} />
                          음량
                        </button>
                        <button className="voice-action-btn">
                          <FileText size={14} />
                          높낮이
                        </button>
                        <button className="voice-action-btn">
                          <FileText size={14} />
                          화폐
                        </button>
                      </div>
                      <span className="char-count">0 / 135 자</span>
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <div className="voice-section">
                    <div className="voice-header">
                      <span className="voice-title">음성메시지 본문</span>
                      <span className="voice-subtitle">
                        음성메시지 본문을 입력하세요.
                      </span>
                    </div>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="현재 솔라피 만족도 조사를 진행하고 있습니다.
서비스 이용에 대한 만족도는 어떠신가요?

1. 매우 불만족
2. 불만족
3. 보통
4. 만족
5. 매우 만족

1번부터 5번까지의 숫자를 눌러주세요."
                      className="voice-textarea voice-main-textarea"
                      maxLength={980}
                    />
                    <div className="voice-footer">
                      <div className="voice-actions">
                        <button className="voice-action-btn">
                          <span>∥</span>
                          1초 멈춤
                        </button>
                        <button className="voice-action-btn">
                          <FileText size={14} />
                          날짜
                        </button>
                        <button className="voice-action-btn">
                          <Clock size={14} />
                          시간
                        </button>
                        <button className="voice-action-btn">
                          <Phone size={14} />
                          번호 읽기
                        </button>
                        <button className="voice-action-btn">
                          <ArrowLeftRight size={14} />
                          속도
                        </button>
                        <button className="voice-action-btn">
                          <Users size={14} />
                          음량
                        </button>
                        <button className="voice-action-btn">
                          <FileText size={14} />
                          높낮이
                        </button>
                        <button className="voice-action-btn">
                          <FileText size={14} />
                          화폐
                        </button>
                      </div>
                      <span className="char-count">
                        {message.length} / 980 Bytes
                      </span>
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <div className="voice-recipient-section">
                    <div className="voice-header">
                      <span className="voice-title">
                        수신자 응답 (선택사항)
                      </span>
                      <span className="voice-subtitle">
                        수신자가 키패드로 숫자를 입력하거나, 고객센터로 연결을
                        도울 수 있습니다.
                      </span>
                    </div>
                    <div className="recipient-options">
                      <button className="recipient-option">
                        <X size={16} />
                        응답 받지 않기
                      </button>
                      <button className="recipient-option">
                        <FileText size={16} />
                        키패드로 응답받기
                      </button>
                      <button className="recipient-option active">
                        <Phone size={16} />
                        0번 눌러 전화 연결
                      </button>
                    </div>
                    <div className="recipient-details">
                      <div className="recipient-detail-header">
                        <span className="detail-title">
                          현재 설정된 번호 : 0번
                        </span>
                      </div>
                      <div className="keypad-section">
                        <div className="keypad">
                          <button className="key">1</button>
                          <button className="key">2</button>
                          <button className="key">3</button>
                          <button className="key">4</button>
                          <button className="key">5</button>
                          <button className="key">6</button>
                          <button className="key">7</button>
                          <button className="key">8</button>
                          <button className="key">9</button>
                          <button className="key">*</button>
                          <button className="key active">0</button>
                          <button className="key">#</button>
                        </div>
                        <div className="phone-input-section">
                          <div className="phone-input-header">
                            <span>연결할 전화번호</span>
                          </div>
                          <input
                            type="text"
                            value="01042056734"
                            className="phone-input"
                            placeholder="전화번호 입력"
                          />
                          <div className="phone-notice">
                            <div className="notice-item">
                              <span className="notice-icon">●</span>
                              <span>0번 눌러 전화 연결</span>
                            </div>
                            <div className="notice-text">
                              <p>
                                - 키패드 0번 버튼을 누르면 설정한 번호로 전화할
                                수 있습니다.
                              </p>
                              <p>
                                - 고객센터 전화 연결 등으로 활용할 수 있습니다.
                              </p>
                              <p>- 전화 연결 시, 초당 통화료가 별도입니다.</p>
                              <p>- 전화번호는 숫자만 입력 가능합니다.</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <div className="section-header">
                    <Save className="icon" size={16} />
                    <span>문구 치환</span>
                  </div>
                  <div className="save-message">
                    <Info className="icon" size={16} />
                    <span>내용에 변수가 없습니다.</span>
                  </div>
                </div>
              </>
            ) : selectedTab === "해외문자" ? (
              <>
                {/* 해외문자 전용 섹션 */}
                <div className="form-group">
                  <div className="overseas-info-section">
                    <div className="overseas-info-header">
                      <h3>해외문자 발송 방법 및 유의사항</h3>
                    </div>
                    <div className="overseas-info-content">
                      <ul className="overseas-info-list">
                        <li>
                          <span>
                            수신번호에 해당 국가 코드를 다음과 같이 추가합니다.
                            (+국가코드)수신번호
                          </span>
                          <div className="country-examples">
                            <div>중국 예시) +862221111</div>
                            <div>일본 예시) +812221111</div>
                          </div>
                        </li>
                        <li>
                          현재 해외발송은 단문문자(SMS)만 발송이 가능합니다.
                        </li>
                        <li>
                          장문문자(LMS) 또는 사진문자(MMS) 등으로 접수되는 경우
                          발송이 불가합니다.
                        </li>
                      </ul>
                      <button className="overseas-guide-btn">
                        해외문자 발송 방법 상세보기
                      </button>
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <div className="country-code-section">
                    <div className="country-code-header">
                      <h3>국가 코드 및 요금 조회</h3>
                      <p className="country-code-subtitle">
                        아래 국가 코드는 단순 조회용입니다. 국가 코드는 반드시
                        수신번호에 추가해주세요.
                      </p>
                    </div>
                    <div className="country-search">
                      <select className="country-select">
                        <option>국가코드 / 국가명 검색</option>
                        <option>+86 중국</option>
                        <option>+81 일본</option>
                        <option>+1 미국</option>
                        <option>+44 영국</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="#[서비스명] Verification Code: #[인증코드]"
                    className="message-textarea overseas-textarea"
                    maxLength={90}
                  />
                  <div className="message-footer overseas-footer">
                    <div className="message-actions">
                      <button className="action-icon">
                        <Camera size={18} />
                      </button>
                      <button className="action-icon">
                        <FileText size={18} />
                      </button>
                      <button className="action-icon">
                        <Clock size={14} />
                        저장내용
                      </button>
                      <button className="action-icon">
                        <RotateCcw size={14} />
                        치환발송
                      </button>
                    </div>
                    <span className="char-count">
                      {message.length} / 90 Bytes
                    </span>
                  </div>
                </div>

                <div className="form-group">
                  <div className="section-header">
                    <Save className="icon" size={16} />
                    <span>문구 치환</span>
                  </div>
                  <div className="save-message">
                    <Info className="icon" size={16} />
                    <span>내용에 변수가 없습니다.</span>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* 기존 문자메시지 섹션 */}
                <div className="form-group">
                  <label>제목 (선택 사항)</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="제목 (선택 사항)"
                    className="subject-input"
                    maxLength={40}
                  />
                  <span className="char-count">{subject.length} / 40</span>
                </div>

                <div className="form-group">
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="이곳에 문자 내용을 입력합니다
치환문구 예시) #{이름}님 #{시간}까지 방문 예약입니다."
                    className="message-textarea"
                    maxLength={2000}
                  />
                  <div className="message-footer">
                    <div className="message-actions">
                      <button className="action-icon">
                        <Camera size={18} />
                      </button>
                      <button className="action-icon">
                        <Paperclip size={18} />
                      </button>
                      <button className="action-icon">
                        <FileText size={18} />
                      </button>
                      <button className="action-icon">
                        <RotateCcw size={18} />
                      </button>
                      <button className="action-icon">
                        <Clock size={18} />
                      </button>
                    </div>
                    <span className="char-count">
                      {message.length} / 2,000 bytes
                    </span>
                  </div>
                </div>

                <div className="form-group">
                  <div className="section-header">
                    <Save className="icon" size={16} />
                    <span>문구 치환</span>
                  </div>
                  <div className="save-message">
                    <Info className="icon" size={16} />
                    <span>내용에 변수가 없습니다.</span>
                  </div>
                </div>

                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={isOverseas}
                      onChange={(e) => setIsOverseas(e.target.checked)}
                    />
                    <span>광고메시지 여부</span>
                  </label>
                </div>
              </>
            )}

            <div className="form-actions">
              <button
                className="send-button"
                onClick={handleSend}
                disabled={isLoading || !message}
              >
                {isLoading ? "전송 중..." : "전송/예약 준비"}
              </button>

              {/* 안내 문구 */}
              <div className="send-notice">
                <p className="notice-text">
                  &ldquo;전송 준비&rdquo;는 잔액이 차감되지 않습니다.
                </p>
                <p className="notice-subtext">
                  예상 차감 단가와 실 발송 내용을 확인하세요!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 발신번호 선택 모달 */}
      {showSenderModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowSenderModal(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>발신번호 선택</h2>
              <button
                className="modal-close"
                onClick={() => setShowSenderModal(false)}
              >
                <X size={24} />
              </button>
            </div>

            <div className="modal-search">
              <div className="search-input-wrapper">
                <input
                  type="text"
                  placeholder="번호, 별칭으로 검색"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
                <Search className="search-icon" size={20} />
              </div>
            </div>

            <div className="modal-body">
              {filteredNumbers.map((sender, index) => (
                <div
                  key={index}
                  className="sender-item"
                  onClick={() => handleSenderSelect(sender.number)}
                >
                  <div className="sender-info-modal">
                    <div className="sender-number-large">{sender.number}</div>
                    <div className="sender-status">({sender.status})</div>
                  </div>
                  {selectedSender === sender.number ? (
                    <button className="deselect-btn">선택해제</button>
                  ) : (
                    <button className="select-btn">선택</button>
                  )}
                  <div
                    className="more-menu-container"
                    ref={showMoreMenu === sender.number ? moreMenuRef : null}
                  >
                    <button
                      className="more-btn"
                      onClick={(e) => handleMoreClick(sender.number, e)}
                    >
                      <span>⋮</span>
                    </button>
                    {showMoreMenu === sender.number && (
                      <div className="more-menu">
                        <button
                          className="menu-item"
                          onClick={() => handleDefaultSet(sender.number)}
                        >
                          기본으로 설정
                        </button>
                        <button
                          className="menu-item"
                          onClick={() => handleAliasEdit(sender.number)}
                        >
                          별칭 변경
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="modal-footer">
              <button className="manage-btn">
                <Settings size={16} />
                발신번호 관리
              </button>
              <button
                className="close-btn"
                onClick={() => setShowSenderModal(false)}
              >
                닫기 <span className="esc-text">ESC</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 별칭 변경 모달 */}
      {showAliasModal && (
        <div className="modal-overlay" onClick={() => setShowAliasModal(false)}>
          <div
            className="alias-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="alias-modal-header">
              <h3>[{editingNumber}] 발신번호 별칭</h3>
              <button
                className="modal-close"
                onClick={() => setShowAliasModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="alias-modal-body">
              <div className="alias-form-group">
                <label className="alias-label">발신번호 별칭</label>
                <input
                  type="text"
                  value={aliasValue}
                  onChange={(e) => setAliasValue(e.target.value)}
                  className="alias-input"
                  placeholder="별칭을 입력하세요"
                />
              </div>

              <button className="alias-save-btn" onClick={handleAliasSave}>
                별칭 입력 완료
              </button>
            </div>

            <div className="alias-modal-footer">
              <div className="alias-footer-left">
                <RefreshCw size={16} />
                <span>채팅 문의</span>
                <span className="red-dot">●</span>
              </div>
              <button
                className="alias-close-btn"
                onClick={() => setShowAliasModal(false)}
              >
                닫기 <span className="esc-text">ESC</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
