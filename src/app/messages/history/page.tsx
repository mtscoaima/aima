"use client";

import React, { useState, useEffect } from "react";

interface MessageHistory {
  id: string;
  recipient: string;
  message: string;
  status: "success" | "failed" | "pending";
  sentAt: string;
  cost: number;
}

export default function MessageHistoryPage() {
  const [messages, setMessages] = useState<MessageHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<
    "all" | "success" | "failed" | "pending"
  >("all");

  useEffect(() => {
    // 임시 데이터 로드
    const loadMessages = async () => {
      setIsLoading(true);
      try {
        // 실제 환경에서는 API 호출
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const mockData: MessageHistory[] = [
          {
            id: "1",
            recipient: "010-1234-5678",
            message: "안녕하세요! 새로운 이벤트 소식을 알려드립니다.",
            status: "success",
            sentAt: "2024-01-15 14:30:00",
            cost: 20,
          },
          {
            id: "2",
            recipient: "010-9876-5432",
            message: "할인 쿠폰이 발급되었습니다. 확인해보세요!",
            status: "success",
            sentAt: "2024-01-15 13:15:00",
            cost: 20,
          },
          {
            id: "3",
            recipient: "010-5555-1234",
            message: "배송이 완료되었습니다.",
            status: "failed",
            sentAt: "2024-01-15 12:00:00",
            cost: 0,
          },
          {
            id: "4",
            recipient: "010-7777-8888",
            message: "회원가입을 환영합니다!",
            status: "pending",
            sentAt: "2024-01-15 11:45:00",
            cost: 0,
          },
        ];

        setMessages(mockData);
      } catch (error) {
        console.error("메시지 내역 로드 실패:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMessages();
  }, []);

  const filteredMessages = messages.filter(
    (msg) => filter === "all" || msg.status === filter
  );

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      success: { text: "성공", className: "status-success" },
      failed: { text: "실패", className: "status-failed" },
      pending: { text: "대기중", className: "status-pending" },
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    return (
      <span className={`status-badge ${config.className}`}>{config.text}</span>
    );
  };

  const totalCost = messages
    .filter((msg) => msg.status === "success")
    .reduce((sum, msg) => sum + msg.cost, 0);

  return (
    <div className="message-history-page">
      <div className="page-header">
        <h1>발송 내역</h1>
        <p>메시지 발송 기록을 확인하세요</p>
      </div>

      <div className="stats-container">
        <div className="stat-card">
          <h3>총 발송</h3>
          <p className="stat-number">{messages.length}건</p>
        </div>
        <div className="stat-card">
          <h3>성공</h3>
          <p className="stat-number success">
            {messages.filter((m) => m.status === "success").length}건
          </p>
        </div>
        <div className="stat-card">
          <h3>실패</h3>
          <p className="stat-number failed">
            {messages.filter((m) => m.status === "failed").length}건
          </p>
        </div>
        <div className="stat-card">
          <h3>총 비용</h3>
          <p className="stat-number">{totalCost}원</p>
        </div>
      </div>

      <div className="history-container">
        <div className="filter-section">
          <select
            value={filter}
            onChange={(e) =>
              setFilter(
                e.target.value as "all" | "success" | "failed" | "pending"
              )
            }
            className="filter-select"
          >
            <option value="all">전체</option>
            <option value="success">성공</option>
            <option value="failed">실패</option>
            <option value="pending">대기중</option>
          </select>
        </div>

        {isLoading ? (
          <div className="loading">
            <p>로딩 중...</p>
          </div>
        ) : (
          <div className="messages-table">
            <div className="table-header">
              <div>수신자</div>
              <div>메시지</div>
              <div>상태</div>
              <div>발송시간</div>
              <div>비용</div>
            </div>

            {filteredMessages.map((message) => (
              <div key={message.id} className="table-row">
                <div className="recipient">{message.recipient}</div>
                <div className="message-content">
                  {message.message.length > 30
                    ? `${message.message.substring(0, 30)}...`
                    : message.message}
                </div>
                <div>{getStatusBadge(message.status)}</div>
                <div className="sent-time">{message.sentAt}</div>
                <div className="cost">{message.cost}원</div>
              </div>
            ))}

            {filteredMessages.length === 0 && (
              <div className="no-data">
                <p>발송 내역이 없습니다.</p>
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        .message-history-page {
          max-width: 1200px;
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

        .stats-container {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 32px;
        }

        .stat-card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          padding: 20px;
          text-align: center;
        }

        .stat-card h3 {
          font-size: 14px;
          color: #6c757d;
          margin-bottom: 8px;
          font-weight: 500;
        }

        .stat-number {
          font-size: 24px;
          font-weight: 700;
          color: #212529;
          margin: 0;
        }

        .stat-number.success {
          color: #28a745;
        }

        .stat-number.failed {
          color: #dc3545;
        }

        .history-container {
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }

        .filter-section {
          padding: 20px;
          border-bottom: 1px solid #e9ecef;
        }

        .filter-select {
          padding: 8px 12px;
          border: 1px solid #ced4da;
          border-radius: 6px;
          font-size: 14px;
          background: white;
        }

        .loading {
          padding: 40px;
          text-align: center;
          color: #6c757d;
        }

        .messages-table {
          width: 100%;
        }

        .table-header {
          display: grid;
          grid-template-columns: 1.5fr 2fr 1fr 1.5fr 1fr;
          gap: 16px;
          padding: 16px 20px;
          background-color: #f8f9fa;
          font-weight: 600;
          color: #495057;
          font-size: 14px;
          border-bottom: 1px solid #e9ecef;
        }

        .table-row {
          display: grid;
          grid-template-columns: 1.5fr 2fr 1fr 1.5fr 1fr;
          gap: 16px;
          padding: 16px 20px;
          border-bottom: 1px solid #f1f3f4;
          align-items: center;
          font-size: 14px;
        }

        .table-row:hover {
          background-color: #f8f9fa;
        }

        .recipient {
          font-weight: 500;
          color: #495057;
        }

        .message-content {
          color: #212529;
          line-height: 1.4;
        }

        .sent-time {
          color: #6c757d;
          font-size: 13px;
        }

        .cost {
          font-weight: 500;
          color: #495057;
        }

        .status-badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
        }

        .status-success {
          background-color: #d4edda;
          color: #155724;
        }

        .status-failed {
          background-color: #f8d7da;
          color: #721c24;
        }

        .status-pending {
          background-color: #fff3cd;
          color: #856404;
        }

        .no-data {
          padding: 40px;
          text-align: center;
          color: #6c757d;
        }

        @media (max-width: 768px) {
          .table-header,
          .table-row {
            grid-template-columns: 1fr;
            gap: 8px;
          }

          .table-header {
            display: none;
          }

          .table-row {
            padding: 16px;
            border: 1px solid #e9ecef;
            margin-bottom: 8px;
            border-radius: 8px;
          }
        }
      `}</style>
    </div>
  );
}
