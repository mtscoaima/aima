"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Image as ImageIcon, MessageSquare, Target, Sparkles, Download, Edit, Trash2, X, Phone } from "lucide-react";
import "./styles.css";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  imageUrl?: string;
}

interface GeneratedTemplate {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  createdAt: Date;
  status: "생성완료" | "전송준비" | "전송완료";
}

export default function TargetMarketingPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "안녕하세요! AI 타깃마케팅 도우미입니다. 어떤 마케팅 캠페인을 만들어드릴까요?",
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<GeneratedTemplate | null>(null);
  const [recipients, setRecipients] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [templates, setTemplates] = useState<GeneratedTemplate[]>([
    {
      id: "1",
      title: "카페 아메리카노 20% 할인",
      description: "2025년 카페 탐방의 오픈 프로모션을 시작합니다 3월 11일 부터 6월 12일까지 아메리카노 20% 할인 혜택을 만나보세요.",
      imageUrl: "/api/placeholder/300/200",
      createdAt: new Date(),
      status: "생성완료",
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      // OpenAI API 호출
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: inputMessage,
          previousMessages: messages,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.message,
          timestamp: new Date(),
          imageUrl: data.imageUrl,
        };

        setMessages(prev => [...prev, assistantMessage]);

        // 이미지가 생성된 경우 템플릿에 추가
        if (data.imageUrl && data.templateData) {
          const newTemplate: GeneratedTemplate = {
            id: Date.now().toString(),
            title: data.templateData.title,
            description: data.templateData.description,
            imageUrl: data.imageUrl,
            createdAt: new Date(),
            status: "생성완료",
          };
          setTemplates(prev => [newTemplate, ...prev]);
        }
      } else {
        throw new Error(data.error || "AI 응답 생성에 실패했습니다.");
      }
    } catch (error) {
      console.error("AI 채팅 오류:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "죄송합니다. 오류가 발생했습니다. 다시 시도해주세요.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTemplateAction = (templateId: string, action: "edit" | "delete" | "send") => {
    switch (action) {
      case "edit":
        // TODO: 템플릿 편집 모달 열기
        console.log("Edit template:", templateId);
        break;
      case "delete":
        setTemplates(prev => prev.filter(t => t.id !== templateId));
        break;
      case "send":
        const template = templates.find(t => t.id === templateId);
        if (template) {
          setSelectedTemplate(template);
          setShowSendModal(true);
        }
        break;
    }
  };

  const handleSendMMS = async () => {
    if (!selectedTemplate || !recipients.trim()) {
      alert("수신번호를 입력해주세요.");
      return;
    }

    setIsSending(true);
    try {
      const response = await fetch("/api/ai/send-mms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          templateId: selectedTemplate.id,
          recipients: recipients.split(",").map(num => num.trim()),
          message: selectedTemplate.description,
          imageUrl: selectedTemplate.imageUrl,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        alert("MMS가 성공적으로 전송되었습니다!");
        setShowSendModal(false);
        setRecipients("");
        setSelectedTemplate(null);
        
        // 템플릿 상태 업데이트
        setTemplates(prev => 
          prev.map(t => 
            t.id === selectedTemplate.id 
              ? { ...t, status: "전송완료" as const }
              : t
          )
        );
      } else {
        throw new Error(result.error || "MMS 전송에 실패했습니다.");
      }
    } catch (error) {
      console.error("MMS 전송 오류:", error);
      alert(error instanceof Error ? error.message : "MMS 전송 중 오류가 발생했습니다.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="target-marketing-container">
      <div className="target-marketing-header">
        <div className="header-content">
          <div className="header-icon">
            <Target size={24} />
          </div>
          <div className="header-text">
            <h1>AI 타깃마케팅</h1>
            <p>AI와 대화하며 맞춤형 마케팅 캠페인을 생성하고 MMS로 전송하세요</p>
          </div>
        </div>
      </div>

      <div className="target-marketing-content">
        {/* 좌측: AI 채팅 영역 */}
        <div className="chat-section">
          <div className="chat-header">
            <MessageSquare size={20} />
            <span>AI 마케팅 어시스턴트</span>
            <div className="chat-status">
              <div className="status-dot"></div>
              온라인
            </div>
          </div>

          <div className="chat-messages">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`message ${message.role === "user" ? "user-message" : "assistant-message"}`}
              >
                <div className="message-content">
                  <p>{message.content}</p>
                  {message.imageUrl && (
                    <div className="message-image">
                      <img src={message.imageUrl} alt="Generated content" />
                    </div>
                  )}
                </div>
                <div className="message-time">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="message assistant-message">
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input-section">
            <div className="input-wrapper">
              <textarea
                ref={textareaRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="마케팅 캠페인에 대해 설명해주세요. 예: '카페 신메뉴 홍보용 이미지를 만들어주세요'"
                className="chat-input"
                rows={3}
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="send-button"
              >
                <Send size={20} />
              </button>
            </div>
            <div className="input-help">
              <Sparkles size={14} />
              <span>AI가 이미지 생성과 마케팅 문구를 도와드립니다</span>
            </div>
          </div>
        </div>

        {/* 우측: 생성 결과 영역 */}
        <div className="results-section">
          <div className="results-header">
            <div className="results-title">
              <ImageIcon size={20} />
              <span>생성 결과</span>
            </div>
            <div className="results-count">
              총 {templates.length}개
            </div>
          </div>

          <div className="templates-grid">
            {templates.map((template) => (
              <div key={template.id} className="template-card">
                {template.imageUrl && (
                  <div className="template-image">
                    <img src={template.imageUrl} alt={template.title} />
                    <div className="image-overlay">
                      <button
                        onClick={() => handleTemplateAction(template.id, "edit")}
                        className="overlay-button"
                        title="편집"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleTemplateAction(template.id, "delete")}
                        className="overlay-button delete"
                        title="삭제"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                )}
                
                <div className="template-content">
                  <div className="template-header">
                    <h3 className="template-title">{template.title}</h3>
                    <span className={`template-status status-${template.status}`}>
                      {template.status}
                    </span>
                  </div>
                  
                  <p className="template-description">{template.description}</p>
                  
                  <div className="template-meta">
                    <span className="template-date">
                      {template.createdAt.toLocaleDateString()}
                    </span>
                    <div className="template-actions">
                      <button
                        onClick={() => handleTemplateAction(template.id, "send")}
                        className="action-button primary"
                      >
                        <Send size={14} />
                        MMS 전송
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {templates.length === 0 && (
              <div className="empty-state">
                <ImageIcon size={48} />
                <h3>아직 생성된 템플릿이 없습니다</h3>
                <p>AI와 대화하여 마케팅 캠페인을 만들어보세요</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MMS 전송 모달 */}
      {showSendModal && selectedTemplate && (
        <div className="modal-overlay">
          <div className="modal-content send-modal">
            <div className="modal-header">
              <h2>MMS 전송</h2>
              <button
                onClick={() => {
                  setShowSendModal(false);
                  setRecipients("");
                  setSelectedTemplate(null);
                }}
                className="modal-close"
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div className="template-preview">
                <h3>전송할 템플릿</h3>
                <div className="preview-card">
                  {selectedTemplate.imageUrl && (
                    <div className="preview-image">
                      <img src={selectedTemplate.imageUrl} alt={selectedTemplate.title} />
                    </div>
                  )}
                  <div className="preview-content">
                    <h4>{selectedTemplate.title}</h4>
                    <p>{selectedTemplate.description}</p>
                  </div>
                </div>
              </div>

              <div className="recipient-section">
                <label htmlFor="recipients">
                  <Phone size={16} />
                  수신번호
                </label>
                <textarea
                  id="recipients"
                  value={recipients}
                  onChange={(e) => setRecipients(e.target.value)}
                  placeholder="수신번호를 입력하세요. 여러 번호는 쉼표(,)로 구분해주세요.&#10;예: 010-1234-5678, 010-9876-5432"
                  className="recipients-input"
                  rows={3}
                />
                <div className="input-help">
                  여러 번호를 입력할 때는 쉼표(,)로 구분해주세요.
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                onClick={() => {
                  setShowSendModal(false);
                  setRecipients("");
                  setSelectedTemplate(null);
                }}
                className="cancel-button"
                disabled={isSending}
              >
                취소
              </button>
              <button
                onClick={handleSendMMS}
                className="send-button primary"
                disabled={!recipients.trim() || isSending}
              >
                {isSending ? (
                  <>
                    <div className="loading-spinner"></div>
                    전송 중...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    MMS 전송
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 