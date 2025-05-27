"use client";

import React, { useState } from "react";

export default function MessageSendPage() {
  const [recipient, setRecipient] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!recipient || !message) {
      alert("수신자와 메시지를 모두 입력해주세요.");
      return;
    }

    setIsLoading(true);
    try {
      // 여기에 실제 메시지 전송 로직을 구현
      await new Promise((resolve) => setTimeout(resolve, 1000)); // 임시 딜레이
      alert("메시지가 성공적으로 전송되었습니다.");
      setRecipient("");
      setMessage("");
    } catch {
      alert("메시지 전송에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="message-send-page">
      <div className="page-header">
        <h1>메시지 보내기</h1>
        <p>고객에게 메시지를 전송하세요</p>
      </div>

      <div className="send-form-container">
        <div className="form-section">
          <h2>수신자 정보</h2>
          <div className="input-group">
            <label htmlFor="recipient">수신자 번호</label>
            <input
              id="recipient"
              type="tel"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="01012345678"
              className="form-input"
            />
            <small className="input-help">
              &apos;-&apos; 없이 숫자만 입력해주세요
            </small>
          </div>
        </div>

        <div className="form-section">
          <h2>메시지 내용</h2>
          <div className="input-group">
            <label htmlFor="message">메시지</label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="전송할 메시지를 입력하세요"
              className="form-textarea"
              rows={6}
              maxLength={1000}
            />
            <div className="char-count">{message.length}/1000자</div>
          </div>
        </div>

        <div className="form-actions">
          <button
            onClick={handleSend}
            disabled={isLoading || !recipient || !message}
            className="send-button"
          >
            {isLoading ? "전송 중..." : "메시지 전송"}
          </button>
        </div>
      </div>

      <style jsx>{`
        .message-send-page {
          max-width: 800px;
          margin: 0 auto;
        }

        .page-header {
          margin-bottom: 32px;
        }

        .page-header h1 {
          font-size: 28px;
          font-weight: 700;
          color: #212529;
          margin-bottom: 8px;
        }

        .page-header p {
          color: #6c757d;
          font-size: 16px;
        }

        .send-form-container {
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          padding: 24px;
        }

        .form-section {
          margin-bottom: 32px;
        }

        .form-section h2 {
          font-size: 18px;
          font-weight: 600;
          color: #212529;
          margin-bottom: 16px;
        }

        .input-group {
          margin-bottom: 20px;
        }

        .input-group label {
          display: block;
          font-weight: 500;
          color: #495057;
          margin-bottom: 8px;
        }

        .form-input,
        .form-textarea {
          width: 100%;
          padding: 12px 16px;
          border: 1px solid #ced4da;
          border-radius: 8px;
          font-size: 14px;
          transition: border-color 0.2s ease;
          box-sizing: border-box;
        }

        .form-input:focus,
        .form-textarea:focus {
          outline: none;
          border-color: #007bff;
          box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
        }

        .form-textarea {
          resize: vertical;
          min-height: 120px;
        }

        .input-help {
          display: block;
          margin-top: 4px;
          font-size: 12px;
          color: #6c757d;
        }

        .char-count {
          text-align: right;
          margin-top: 4px;
          font-size: 12px;
          color: #6c757d;
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          padding-top: 20px;
          border-top: 1px solid #e9ecef;
        }

        .send-button {
          background-color: #007bff;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }

        .send-button:hover:not(:disabled) {
          background-color: #0056b3;
        }

        .send-button:disabled {
          background-color: #6c757d;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
