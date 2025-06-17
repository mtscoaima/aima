"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import "./styles.css";

export default function TargetMarketingPage() {
  const router = useRouter();
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleStartChat = async () => {
    if (!inputValue.trim()) return;

    setIsLoading(true);

    try {
      // 고유한 채팅 ID 생성
      const chatId = Date.now().toString();

      // 초기 메시지를 세션 스토리지에 저장
      console.log("세션 스토리지에 저장할 메시지:", inputValue);
      sessionStorage.setItem("initialMessage", inputValue);
      console.log("세션 스토리지 저장 완료");

      // 동적 라우트로 이동
      router.push(`/target-marketing/${chatId}`);
    } catch (error) {
      console.error("채팅 시작 중 오류:", error);
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleStartChat();
    }
  };

  return (
    <div className="target-marketing-landing">
      <div className="landing-container">
        {/* Header */}
        <div className="landing-header">
          <h1>AI타겟마케팅</h1>
        </div>

        {/* Main Content */}
        <div className="landing-content">
          <div className="chat-bot-icon">
            <Image
              src="/images/ChatGPT.png"
              alt="AI 챗봇"
              width={120}
              height={120}
              className="robot-image"
            />
          </div>

          <h2>어떤 광고를 만들고 싶나요?</h2>

          {/* Input Section */}
          <div className="input-section">
            <div className="chat-input-container">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={`Ex) 서울 홍대 헤어샵 오픈 행사 카드 50%할인 이벤트 홍보
여름 맞이 최대 50% 할인 이벤트 홍보
카페 시즌 음료 무료 시음 업 이벤트 안내`}
                className="chat-input-field"
                rows={3}
                disabled={isLoading}
              />
              <button
                onClick={handleStartChat}
                disabled={!inputValue.trim() || isLoading}
                className="start-chat-btn"
              >
                {isLoading ? <div className="loading-spinner-small" /> : "생성"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
