"use client";

import { useState, useEffect, useCallback } from "react";
import { AdminGuard } from "@/components/RoleGuard";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { tokenManager } from "@/lib/api";
import "./styles.css";

interface Template {
  id: number;
  event_type: string;
  name: string;
  recipient_type: string;
  message_type: string;
  subject: string | null;
  content_template: string;
  variables: Record<string, string> | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

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

export default function NotificationsPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => !prev);
  }, []);

  const closeSidebar = useCallback(() => {
    setIsSidebarOpen(false);
  }, []);

  return (
    <AdminGuard>
      <AdminHeader onToggleSidebar={toggleSidebar} />
      <AdminSidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
      <NotificationsContent />
    </AdminGuard>
  );
}

function NotificationsContent() {
  const [activeTab, setActiveTab] = useState<'templates' | 'logs'>('templates');

  // Templates state
  const [templates, setTemplates] = useState<Template[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Logs state
  const [logs, setLogs] = useState<Log[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);
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

  // Fetch Templates
  const fetchTemplates = async () => {
    try {
      setTemplatesLoading(true);
      const response = await fetch('/api/admin/sms-templates', {
        headers: {
          'Authorization': `Bearer ${tokenManager.getAccessToken()}`,
        },
      });

      if (!response.ok) throw new Error('템플릿 조회 실패');

      const data = await response.json();
      if (data.success) {
        setTemplates(data.templates);
      }
    } catch (error) {
      console.error('템플릿 조회 오류:', error);
      alert('템플릿 목록을 불러오는데 실패했습니다.');
    } finally {
      setTemplatesLoading(false);
    }
  };

  // Fetch Logs
  const fetchLogs = async (currentPage: number = page, filter: string = eventTypeFilter) => {
    try {
      setLogsLoading(true);
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
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'templates') {
      fetchTemplates();
    } else {
      fetchLogs();
    }
  }, [activeTab]);

  // Template handlers
  const handleToggle = async (templateId: number, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/sms-templates/${templateId}/toggle`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokenManager.getAccessToken()}`,
        },
        body: JSON.stringify({ is_active: !currentStatus }),
      });

      if (!response.ok) throw new Error('토글 실패');

      const data = await response.json();
      if (data.success) {
        alert(data.message);
        fetchTemplates();
      }
    } catch (error) {
      console.error('토글 오류:', error);
      alert('상태 변경에 실패했습니다.');
    }
  };

  const openEditModal = (template: Template) => {
    setEditingTemplate({ ...template });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingTemplate) return;

    try {
      const response = await fetch(`/api/admin/sms-templates/${editingTemplate.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokenManager.getAccessToken()}`,
        },
        body: JSON.stringify({
          subject: editingTemplate.subject,
          content_template: editingTemplate.content_template,
          message_type: editingTemplate.message_type,
        }),
      });

      if (!response.ok) throw new Error('수정 실패');

      const data = await response.json();
      if (data.success) {
        alert(data.message);
        setShowEditModal(false);
        setEditingTemplate(null);
        fetchTemplates();
      }
    } catch (error) {
      console.error('수정 오류:', error);
      alert('템플릿 수정에 실패했습니다.');
    }
  };

  // Log handlers
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
    <div className="admin-dashboard">
      <div className="admin-main">
        <div className="page-header">
          <h1>알림 관리</h1>
          <p>SMS 알림 템플릿 관리 및 발송 로그를 확인할 수 있습니다.</p>
        </div>

          {/* Tab Navigation */}
          <div className="tab-navigation">
            <button
              className={`tab-button ${activeTab === 'templates' ? 'active' : ''}`}
              onClick={() => setActiveTab('templates')}
            >
              템플릿 관리
            </button>
            <button
              className={`tab-button ${activeTab === 'logs' ? 'active' : ''}`}
              onClick={() => setActiveTab('logs')}
            >
              발송 로그
            </button>
          </div>

          {/* Templates Tab Content */}
          {activeTab === 'templates' && (
            <>
              {templatesLoading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <p>로딩 중...</p>
                </div>
              ) : (
                <div className="templates-grid">
                  {templates.map((template) => (
                    <div key={template.id} className="template-card">
                      <div className="template-header">
                        <div>
                          <h3>{template.name}</h3>
                          <span className="template-badge">{template.event_type}</span>
                          <span className={`template-badge ${template.message_type.toLowerCase()}`}>
                            {template.message_type}
                          </span>
                          <span className="template-badge">
                            {template.recipient_type === 'USER' ? '사용자' : '관리자'}
                          </span>
                        </div>
                        <button
                          className={`toggle-button ${template.is_active ? 'active' : ''}`}
                          onClick={() => handleToggle(template.id, template.is_active)}
                        >
                          {template.is_active ? '🟢 ON' : '🔴 OFF'}
                        </button>
                      </div>

                      {template.subject && (
                        <div className="template-subject">
                          <strong>제목:</strong> {template.subject}
                        </div>
                      )}

                      <div className="template-content">
                        <strong>내용:</strong>
                        <pre>{template.content_template}</pre>
                      </div>

                      {template.variables && (
                        <div className="template-variables">
                          <strong>사용 가능한 변수:</strong>
                          <div className="variables-list">
                            {Object.entries(template.variables).map(([key, value]) => (
                              <span key={key} className="variable-tag">
                                {`{{${key}}}`}: {value}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="template-actions">
                        <button
                          className="btn-edit"
                          onClick={() => openEditModal(template)}
                        >
                          수정
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Logs Tab Content */}
          {activeTab === 'logs' && (
            <>
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
                <div className="filter-info">
                  총 {total}건
                </div>
              </div>

              {logsLoading ? (
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

                  {/* Pagination */}
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
            </>
          )}

          {/* Edit Template Modal */}
          {showEditModal && editingTemplate && (
            <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h2>템플릿 수정</h2>
                  <button
                    className="modal-close"
                    onClick={() => setShowEditModal(false)}
                  >
                    ×
                  </button>
                </div>
                <div className="modal-body">
                  <div className="form-group">
                    <label>템플릿 이름 (수정 불가)</label>
                    <input type="text" value={editingTemplate.name} disabled />
                  </div>

                  <div className="form-group">
                    <label>메시지 타입</label>
                    <select
                      value={editingTemplate.message_type}
                      onChange={(e) =>
                        setEditingTemplate({
                          ...editingTemplate,
                          message_type: e.target.value,
                        })
                      }
                    >
                      <option value="SMS">SMS</option>
                      <option value="LMS">LMS</option>
                    </select>
                  </div>

                  {editingTemplate.message_type === 'LMS' && (
                    <div className="form-group">
                      <label>제목</label>
                      <input
                        type="text"
                        value={editingTemplate.subject || ''}
                        onChange={(e) =>
                          setEditingTemplate({
                            ...editingTemplate,
                            subject: e.target.value,
                          })
                        }
                        placeholder="LMS 제목을 입력하세요"
                      />
                    </div>
                  )}

                  <div className="form-group">
                    <label>내용</label>
                    <textarea
                      value={editingTemplate.content_template}
                      onChange={(e) =>
                        setEditingTemplate({
                          ...editingTemplate,
                          content_template: e.target.value,
                        })
                      }
                      rows={10}
                      placeholder="템플릿 내용을 입력하세요"
                    />
                  </div>

                  {editingTemplate.variables && (
                    <div className="form-group">
                      <label>사용 가능한 변수</label>
                      <div className="variables-info">
                        {Object.entries(editingTemplate.variables).map(([key, value]) => (
                          <div key={key}>
                            <code>{`{{${key}}}`}</code> - {value}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button className="btn-cancel" onClick={() => setShowEditModal(false)}>
                    취소
                  </button>
                  <button className="btn-save" onClick={handleSaveEdit}>
                    저장
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Log Detail Modal */}
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
  );
}
