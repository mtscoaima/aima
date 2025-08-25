"use client";

import React, { useState } from "react";
import "./MessageSendForm.css";

const MessageSendForm: React.FC = () => {
  const [senderNumber, setSenderNumber] = useState<string>("");
  const [messageContent, setMessageContent] = useState<string>("");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [receiverNumbers, setReceiverNumbers] = useState<string[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 메시지 전송 로직
    // TODO: 실제 메시지 전송 API 호출
  };

  return (
    <div className="message-send-container">
      <div className="message-header">
        <h2>메시지 발신번호</h2>
        <div className="sender-section">
          <input
            type="text"
            placeholder="수신자명"
            value={senderNumber}
            onChange={(e) => setSenderNumber(e.target.value)}
            className="sender-input"
          />
          <button className="btn-find">찾기</button>
        </div>

        <div className="saved-receivers-section">
          <h3>
            자주 사용하는 수신번호 <span>(총 0개)</span>
          </h3>
          <button className="btn-show-hidden">비우기</button>
        </div>
      </div>

      <div className="message-content-section">
        <div className="message-tabs">
          <button className="tab-btn active">문자메시지</button>
          <button className="tab-btn disabled" disabled>
            알림톡
          </button>
          <button className="tab-btn disabled" disabled>
            친구톡
          </button>
          <button className="tab-btn disabled" disabled>
            네이버톡톡
          </button>
        </div>

        <div className="message-compose">
          <textarea
            placeholder="이곳에 문자 내용을 입력합니다
지원문구 에서 #[이름]# #[회사명]등 변수값을 입력하시면 됩니다."
            value={messageContent}
            onChange={(e) => setMessageContent(e.target.value)}
            className="message-textarea"
          />
          <div className="character-count">0 / 2,000 Bytes</div>
        </div>

        <div className="attachment-section">
          <button className="btn-attach">
            <span className="icon">📎</span>
            첨부파일
          </button>
          <button className="btn-attach">
            <span className="icon">🖼️</span>
            차단내용
          </button>
          <button className="btn-attach">
            <span className="icon">📑</span>
            문구 치환
          </button>
          <div className="attachment-info">
            <span>📄 내용에 변수가 없습니다.</span>
          </div>
        </div>
      </div>

      <div className="message-options">
        <div className="option-row">
          <label>
            <input type="checkbox" /> 광고메시지 여부
          </label>
          <div className="option-tooltip">?</div>
        </div>
        <div className="option-row">
          <button className="btn-submit" onClick={handleSubmit}>
            전송/예약 준비
          </button>
        </div>
      </div>
    </div>
  );
};

export default MessageSendForm;
