"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Smartphone,
  Phone,
  HelpCircle,
  X,
  Search,
  Settings,
  ArrowLeftRight,
  RefreshCw,
} from "lucide-react";
import "./styles.css";

export default function MessageSendPage() {
  const [recipientNumbers, setRecipientNumbers] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSenderModal, setShowSenderModal] = useState(false);
  const [selectedSender, setSelectedSender] = useState("테스트 번호");
  const [searchTerm, setSearchTerm] = useState("");
  const [showMoreMenu, setShowMoreMenu] = useState("");
  const [showAliasModal, setShowAliasModal] = useState(false);
  const [editingNumber, setEditingNumber] = useState("");
  const [aliasValue, setAliasValue] = useState("");
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

  const handleSend = async () => {
    if (!selectedSender) {
      alert("발신번호를 선택해주세요.");
      return;
    }

    if (!recipientNumbers) {
      alert("수신번호를 입력해주세요.");
      return;
    }

    if (!message) {
      alert("메시지 내용을 입력해주세요.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/message/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          toNumbers: [recipientNumbers.replace(/-/g, "")], // 하이픈 제거
          message: message,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        alert(result.message);
      } else {
        const errorMessage = result.error || "알 수 없는 오류가 발생했습니다.";
        const details = result.details
          ? `\n\n상세 정보: ${result.details}`
          : "";

        alert(`메시지 전송에 실패했습니다.\n\n${errorMessage}${details}`);
      }
    } catch (error) {
      console.error("메시지 전송 오류:", error);
      alert("메시지 전송 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSenderSelect = (number: string) => {
    if (selectedSender === number) {
      setSelectedSender("");
    } else {
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
    setShowMoreMenu("");
    alert(`${number}을(를) 기본으로 설정했습니다.`);
  };

  return (
    <div className="message-send-container">
      <div className="message-content">
        {/* 단일 카드 레이아웃 */}
        <div className="single-content">
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
              />
              <div className="input-help">
                <HelpCircle className="help-icon" size={14} />
              </div>
            </div>
          </div>

          <div className="content-section">
            <div className="section-header">
              <span>내용 입력</span>
            </div>
            <div className="message-input-section">
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
                  <span className="char-count">
                    {message.length} / 2,000 bytes
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="content-section">
            <button
              className="send-button"
              onClick={handleSend}
              disabled={isLoading || !message}
            >
              {isLoading ? "전송 중..." : "전송"}
            </button>
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

