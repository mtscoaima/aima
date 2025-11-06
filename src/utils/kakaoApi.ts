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
  status: string;  // R: 대기, A: 정상, S: 중지
  inspection_status?: string;  // REG: 등록됨, REQ: 검수중, APR: 승인됨, REJ: 반려됨
  buttons?: Array<{
    name: string;
    type: string;
    url_mobile?: string;
    url_pc?: string;
  }>;
}

// 수신자 타입
export interface Recipient {
  phone_number: string;
  name?: string;
  group_name?: string;
  variables?: Record<string, string>;
  replacedMessage?: string; // 변수가 치환된 메시지 (알림톡/친구톡용)
}

// 알림톡 발송 요청 타입
export interface AlimtalkSendRequest {
  senderKey: string;
  templateCode: string;
  recipients: Recipient[];
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

// 친구톡 발송 요청 타입
export interface FriendtalkSendRequest {
  senderKey: string;
  recipients: Recipient[];
  message: string;
  callbackNumber: string;
  messageType: 'FT' | 'FI' | 'FW' | 'FL' | 'FC';
  adFlag: 'Y' | 'N';
  imageUrls?: string[];
  imageLink?: string;  // 이미지 클릭 시 이동할 URL
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

// 브랜드 템플릿 타입
export interface BrandTemplate {
  template_code: string;
  template_name: string;
  content: string;
  message_type: 'TEXT' | 'IMAGE' | 'WIDE' | 'WIDE_ITEM_LIST' | 'CAROUSEL_FEED' | 'COMMERCE' | 'CAROUSEL_COMMERCE' | 'PREMIUM_VIDEO';
  status: string;
  buttons?: Array<{
    type: string;
    name: string;
    url_mobile?: string;
    url_pc?: string;
  }>;
}

// 브랜드 메시지 발송 요청 타입
export interface BrandMessageSendRequest {
  senderKey: string;
  templateCode: string;
  recipients: Recipient[];
  message: string;
  callbackNumber: string;
  messageType: 'TEXT' | 'IMAGE' | 'WIDE' | 'WIDE_ITEM_LIST' | 'CAROUSEL_FEED' | 'PREMIUM_VIDEO';
  targeting?: 'M' | 'N' | 'I'; // M: 수신동의, N: 수신동의+채널친구, I: 전체+채널친구
  attachment?: {
    button?: Array<{
      type: 'WL' | 'AL' | 'BK' | 'MD' | 'AC';
      url_mobile?: string;
      url_pc?: string;
    }>;
    image?: {
      img_url: string;
      img_link?: string;
    };
    coupon?: {
      description?: string;
      url_pc?: string;
      url_mobile?: string;
    };
    item?: {
      list: Array<{
        img_url: string;
        url_mobile?: string;
      }>;
    };
  };
  tranType?: 'N' | 'S' | 'L' | 'M';
  tranMessage?: string;
  subject?: string;
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

    // DB 조회 응답 구조에 맞게 파싱 (변경됨: MTS API → Supabase DB)
    if (result.success && result.profiles) {
      return result.profiles;
    }

    return [];
  } catch (error) {
    console.error('발신 프로필 조회 오류:', error);
    throw error;
  }
}

/**
 * 알림톡 템플릿 목록 조회
 * @param senderKey 발신 프로필 키
 * @param forceSync 강제 동기화 여부 (true: 동기화 완료 대기, false: 백그라운드 동기화)
 */
export async function fetchAlimtalkTemplates(senderKey: string, forceSync = false): Promise<AlimtalkTemplate[]> {
  try {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      throw new Error('로그인이 필요합니다.');
    }

    const syncParam = forceSync ? '&sync=true' : '';
    const response = await fetch(`/api/kakao/templates?senderKey=${encodeURIComponent(senderKey)}${syncParam}`, {
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
    throw error;
  }
}

/**
 * 친구톡 V2 발송
 */
export async function sendFriendtalk(request: FriendtalkSendRequest) {
  try {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      throw new Error('로그인이 필요합니다.');
    }

    const response = await fetch('/api/messages/kakao/friendtalk/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '친구톡 발송 실패');
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('친구톡 발송 오류:', error);
    throw error;
  }
}

/**
 * 브랜드 메시지 발송
 */
/**
 * 브랜드 템플릿 목록 조회
 * @param senderKey 발신 프로필 키
 * @param forceSync 강제 동기화 여부
 */
export async function fetchBrandTemplates(senderKey: string, forceSync = false): Promise<BrandTemplate[]> {
  try {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      throw new Error('로그인이 필요합니다.');
    }

    // sync 파라미터 추가
    const syncParam = forceSync ? '&sync=true' : '';
    const response = await fetch(`/api/messages/kakao/brand/templates?senderKey=${encodeURIComponent(senderKey)}${syncParam}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '브랜드 템플릿 조회 실패');
    }

    const result = await response.json();

    // DB에서 조회한 템플릿 데이터를 BrandTemplate 형식으로 변환
    if (result.success && result.templates) {
      return result.templates.map((template: {
        template_code: string;
        template_name: string;
        content: string;
        chat_bubble_type: string;
        status: string;
        buttons: unknown;
      }) => ({
        template_code: template.template_code,
        template_name: template.template_name,
        content: template.content,
        message_type: template.chat_bubble_type,
        status: template.status,
        buttons: template.buttons,
      }));
    }

    return [];
  } catch (error) {
    console.error('브랜드 템플릿 조회 오류:', error);
    throw error;
  }
}

/**
 * 브랜드 템플릿 동기화 (MTS API로 최신 검수 상태 확인)
 */
export async function syncBrandTemplates(senderKey: string): Promise<{
  success: boolean;
  syncedCount?: number;
  failedCount?: number;
  message?: string;
}> {
  try {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      throw new Error('로그인이 필요합니다.');
    }

    const response = await fetch('/api/messages/kakao/brand/templates/sync', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ senderKey }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '브랜드 템플릿 동기화 실패');
    }

    return await response.json();
  } catch (error) {
    console.error('브랜드 템플릿 동기화 오류:', error);
    throw error;
  }
}

/**
 * 브랜드 메시지 발송
 */
export async function sendBrandMessage(request: BrandMessageSendRequest) {
  try {
    const token = localStorage.getItem('accessToken');
    console.log('[브랜드 메시지 클라이언트] accessToken:', token ? '존재함' : '없음');

    if (!token) {
      throw new Error('로그인이 필요합니다.');
    }

    console.log('[브랜드 메시지 클라이언트] 발송 요청:', {
      senderKey: request.senderKey,
      templateCode: request.templateCode,
      recipientsCount: request.recipients?.length,
      targeting: request.targeting
    });

    const response = await fetch('/api/messages/kakao/brand/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    console.log('[브랜드 메시지 클라이언트] 응답 상태:', response.status, response.statusText);

    if (!response.ok) {
      const error = await response.json();
      console.error('[브랜드 메시지 클라이언트] 에러 응답:', error);
      throw new Error(error.error || '브랜드 메시지 발송 실패');
    }

    const result = await response.json();
    console.log('[브랜드 메시지 클라이언트] 발송 성공:', result);
    return result;
  } catch (error) {
    console.error('브랜드 메시지 발송 오류:', error);
    throw error;
  }
}

/**
 * 브랜드 메시지 발송 결과 조회
 */
export async function fetchBrandMessageResult(
  senderKey: string,
  sendDate: string,
  page?: number,
  count?: number
): Promise<{
  success: boolean;
  code: string;
  receivedAt: string;
  data: Array<{
    result_code: string;
    result_date: string;
    real_send_date: string;
    sender_key: string;
    send_date: string;
    phone_number: string;
    template_code: string;
    message_type: string;
    [key: string]: unknown;
  }>;
  count: number;
}> {
  try {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      throw new Error('로그인이 필요합니다.');
    }

    const params = new URLSearchParams({
      senderKey,
      sendDate,
    });

    if (page !== undefined) {
      params.append('page', page.toString());
    }

    if (count !== undefined) {
      params.append('count', count.toString());
    }

    const response = await fetch(`/api/messages/kakao/brand/result?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '발송 결과 조회 실패');
    }

    return await response.json();
  } catch (error) {
    console.error('브랜드 메시지 결과 조회 오류:', error);
    throw error;
  }
}
