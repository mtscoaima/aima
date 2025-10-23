"use client";

import { useState, useEffect } from "react";
import { AdminGuard } from "@/components/RoleGuard";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { tokenManager } from "@/lib/api";
import "./styles.css";

interface Log {
  id: number;
  template_id: number | null;
  event_type: string;
  recipient_user_id: number | null;
  recipient_phone_number: string;
  message_type: string;
  subject: string | null;
  content: string;
  status: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export default function SmsLogsPage() {
  return (
    <AdminGuard>
      <SmsLogsContent />
    </AdminGuard>
  );
}

function SmsLogsContent() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [eventTypeFilter, setEventTypeFilter] = useState('');
  const [selectedLog, setSelectedLog] = useState<Log | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const eventTypes = [
    { value: '', label: '전체' },
    { value: 'user.signup', label: '회원가입 축하' },
    { value: 'company.registered', label: '기업 검수요청' },
    { value: 'campaign.created', label: '캠페인 검수요청' },
    { value: 'campaign.approved', label: '캠페인 검수완료' },
    { value: 'sender_number.registered', label: '발신번호 검수요청' },
  ];

  const fetchLogs = async (currentPage: number = page, filter: string = eventTypeFilter) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
      });

      if (filter) {
        params.append('event_type', filter);
      }

      const response = await fetch(`/api/admin/sms-logs?${params}`, {
        headers: {
          'Authorization': `Bearer ${tokenManager.getAccessToken()}`,
        },
      });

      if (!response.ok) throw new Error('로그 조회 실패');

      const data = await response.json();
      if (data.success) {
        setLogs(data.logs);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      }
    } catch (error) {
      console.error('로그 조회 오류:', error);
      alert('로그 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleFilterChange = (newFilter: string) => {
    setEventTypeFilter(newFilter);
    setPage(1);
    fetchLogs(1, newFilter);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchLogs(newPage, eventTypeFilter);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getEventTypeName = (eventType: string) => {
    const found = eventTypes.find((et) => et.value === eventType);
    return found ? found.label : eventType;
  };

  const openDetailModal = (log: Log) => {
    setSelectedLog(log);
    setShowDetailModal(true);
  };

  return (
    <div className="admin-container">
      <AdminSidebar />
      <div className="admin-main-content">
        <AdminHeader />
        <div className="content-wrapper">
          <div className="page-header">
            <h1>SMS 발송 로그</h1>
            <p>발송된 알림 메시지 내역을 확인할 수 있습니다. (총 {total}건)</p>
          </div>

          <div className="filter-section">
            <div className="filter-group">
              <label>이벤트 타입:</label>
              <select value={eventTypeFilter} onChange={(e) => handleFilterChange(e.target.value)}>
                {eventTypes.map((et) => (
                  <option key={et.value} value={et.value}>
                    {et.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <p>로딩 중...</p>
            </div>
          ) : (
            <>
              <div className="logs-table-container">
                <table className="logs-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>발송일시</th>
                      <th>이벤트</th>
                      <th>수신자</th>
                      <th>타입</th>
                      <th>내용 미리보기</th>
                      <th>상태</th>
                      <th>상세</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ textAlign: 'center', padding: '40px' }}>
                          발송 로그가 없습니다.
                        </td>
                      </tr>
                    ) : (
                      logs.map((log) => (
                        <tr key={log.id}>
                          <td>{log.id}</td>
                          <td>{formatDate(log.created_at)}</td>
                          <td>
                            <span className="event-badge">{getEventTypeName(log.event_type)}</span>
                          </td>
                          <td>{log.recipient_phone_number}</td>
                          <td>
                            <span className={`type-badge ${log.message_type.toLowerCase()}`}>
                              {log.message_type}
                            </span>
                          </td>
                          <td className="content-preview">
                            {log.content.substring(0, 30)}
                            {log.content.length > 30 ? '...' : ''}
                          </td>
                          <td>
                            <span className="status-badge logged">LOGGED</span>
                          </td>
                          <td>
                            <button className="btn-detail" onClick={() => openDetailModal(log)}>
                              보기
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* 페이지네이션 */}
              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1}
                    className="pagination-btn"
                  >
                    이전
                  </button>
                  <span className="pagination-info">
                    {page} / {totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page === totalPages}
                    className="pagination-btn"
                  >
                    다음
                  </button>
                </div>
              )}
            </>
          )}

          {/* 상세 모달 */}
          {showDetailModal && selectedLog && (
            <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
              <div className="modal-content detail-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h2>발송 로그 상세</h2>
                  <button className="modal-close" onClick={() => setShowDetailModal(false)}>
                    ×
                  </button>
                </div>
                <div className="modal-body">
                  <div className="detail-row">
                    <strong>ID:</strong>
                    <span>{selectedLog.id}</span>
                  </div>
                  <div className="detail-row">
                    <strong>발송일시:</strong>
                    <span>{formatDate(selectedLog.created_at)}</span>
                  </div>
                  <div className="detail-row">
                    <strong>이벤트:</strong>
                    <span>{getEventTypeName(selectedLog.event_type)}</span>
                  </div>
                  <div className="detail-row">
                    <strong>수신자 전화번호:</strong>
                    <span>{selectedLog.recipient_phone_number}</span>
                  </div>
                  <div className="detail-row">
                    <strong>메시지 타입:</strong>
                    <span>{selectedLog.message_type}</span>
                  </div>
                  {selectedLog.subject && (
                    <div className="detail-row">
                      <strong>제목:</strong>
                      <span>{selectedLog.subject}</span>
                    </div>
                  )}
                  <div className="detail-row full-width">
                    <strong>내용:</strong>
                    <pre className="log-content">{selectedLog.content}</pre>
                  </div>
                  <div className="detail-row">
                    <strong>상태:</strong>
                    <span className="status-badge logged">LOGGED</span>
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn-close" onClick={() => setShowDetailModal(false)}>
                    닫기
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
