/**
 * 카카오 알림톡/친구톡 API 유틸리티
 */

// 알림톡 발신 프로필 타입
export interface SenderProfile {
  sender_key: string;
  channel_name: string;
  status: string;
}

// 알림톡 템플릿 타입
export interface AlimtalkTemplate {
  template_code: string;
  template_name: string;
  template_content: string;
  status: string;
  buttons?: Array<{
    name: string;
    type: string;
    url_mobile?: string;
    url_pc?: string;
  }>;
}

// 알림톡 발송 요청 타입
export interface AlimtalkSendRequest {
  senderKey: string;
  templateCode: string;
  recipients: string[];
  message: string;
  callbackNumber: string;
  buttons?: Array<{
    name: string;
    type: string;
    url_mobile?: string;
    url_pc?: string;
  }>;
  tranType?: 'SMS' | 'LMS' | 'MMS';
  tranMessage?: string;
  scheduledAt?: string;
}

/**
 * 발신 프로필 목록 조회
 */
export async function fetchSenderProfiles(): Promise<SenderProfile[]> {
  try {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      throw new Error('로그인이 필요합니다.');
    }

    const response = await fetch('/api/kakao/profiles', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '발신 프로필 조회 실패');
    }

    const result = await response.json();

    // MTS API 응답 구조에 맞게 파싱
    if (result.success && result.data && result.data.list) {
      return result.data.list;
    }

    return [];
  } catch (error) {
    console.error('발신 프로필 조회 오류:', error);
    throw error;
  }
}

/**
 * 알림톡 템플릿 목록 조회
 */
export async function fetchAlimtalkTemplates(senderKey: string): Promise<AlimtalkTemplate[]> {
  try {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      throw new Error('로그인이 필요합니다.');
    }

    const response = await fetch(`/api/kakao/templates?senderKey=${encodeURIComponent(senderKey)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '템플릿 조회 실패');
    }

    const result = await response.json();

    // MTS API 응답 구조에 맞게 파싱
    if (result.success && result.data && result.data.list) {
      return result.data.list;
    }

    return [];
  } catch (error) {
    console.error('템플릿 조회 오류:', error);
    throw error;
  }
}

/**
 * 알림톡 발송
 */
export async function sendAlimtalk(request: AlimtalkSendRequest) {
  try {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      throw new Error('로그인이 필요합니다.');
    }

    const response = await fetch('/api/messages/kakao/alimtalk/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '알림톡 발송 실패');
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('알림톡 발송 오류:', error);
    throw error;
  }
}
