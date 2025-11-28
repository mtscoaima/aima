/**
 * 카카오 알림톡 템플릿 관리 API 유틸리티
 */

/**
 * 알림톡 템플릿 생성
 */
export async function createAlimtalkTemplate(templateData: {
  senderKey: string;
  templateCode: string;
  templateName: string;
  templateContent: string;
  templateMessageType?: string;
  templateEmphasizeType?: string;
  categoryCode?: string;
  buttons?: Array<{
    name: string;
    type: string;
    url_mobile?: string;
    url_pc?: string;
  }>;
  requestInspection?: boolean;
}): Promise<{ success: boolean; template?: Record<string, unknown>; error?: string }> {
  try {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      throw new Error('로그인이 필요합니다.');
    }

    const response = await fetch('/api/kakao/templates/create', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(templateData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '템플릿 생성 실패');
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('템플릿 생성 오류:', error);
    throw error;
  }
}

/**
 * 알림톡 템플릿 동기화
 */
export async function syncAlimtalkTemplates(senderKey: string): Promise<{ success: boolean; syncedCount: number; failedCount: number }> {
  try {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      throw new Error('로그인이 필요합니다.');
    }

    const response = await fetch(`/api/kakao/templates/sync?senderKey=${encodeURIComponent(senderKey)}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '템플릿 동기화 실패');
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('템플릿 동기화 오류:', error);
    throw error;
  }
}

/**
 * 알림톡 템플릿 삭제
 */
export async function deleteAlimtalkTemplate(senderKey: string, templateCode: string): Promise<{ success: boolean }> {
  try {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      throw new Error('로그인이 필요합니다.');
    }

    const response = await fetch(`/api/kakao/templates/${encodeURIComponent(templateCode)}?senderKey=${encodeURIComponent(senderKey)}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '템플릿 삭제 실패');
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('템플릿 삭제 오류:', error);
    throw error;
  }
}
