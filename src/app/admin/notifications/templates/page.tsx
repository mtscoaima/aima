"use client";

import { useState, useEffect } from "react";
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

export default function SmsTemplatesPage() {
  return (
    <AdminGuard>
      <SmsTemplatesContent />
    </AdminGuard>
  );
}

function SmsTemplatesContent() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // 템플릿 목록 조회
  const fetchTemplates = async () => {
    try {
      setLoading(true);
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
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  // ON/OFF 토글
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

  // 수정 모달 열기
  const openEditModal = (template: Template) => {
    setEditingTemplate({ ...template });
    setShowEditModal(true);
  };

  // 템플릿 수정 저장
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

  return (
    <div className="admin-container">
      <AdminSidebar />
      <div className="admin-main-content">
        <AdminHeader />
        <div className="content-wrapper">
          <div className="page-header">
            <h1>SMS 알림 템플릿 관리</h1>
            <p>알림 메시지 템플릿을 관리하고 ON/OFF를 설정할 수 있습니다.</p>
          </div>

          {loading ? (
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

          {/* 수정 모달 */}
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
        </div>
      </div>
    </div>
  );
}
