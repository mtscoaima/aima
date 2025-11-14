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
  // FW/FL/FC 타입 전용 필드
  headerText?: string;  // FL용 헤더
  listItems?: Array<{   // FL용 아이템 리스트
    title: string;
    image?: {
      fileId: string;
      fileName: string;
      fileSize: number;
      preview: string;
    };
  }>;
  carousels?: Array<{   // FC용 캐러셀
    content: string;
    image?: {
      fileId: string;
      fileName: string;
      fileSize: number;
      preview: string;
    };
    buttons: Array<{
      name: string;
      type: string;
      url_mobile?: string;
      url_pc?: string;
    }>;
  }>;
  moreLink?: string;    // FC용 더보기 링크
}

// 브랜드 템플릿 타입
export interface BrandTemplate {
  template_code: string;
  template_name: string;
  content: string;
  message_type: 'TEXT' | 'IMAGE' | 'WIDE' | 'WIDE_ITEM_LIST' | 'CAROUSEL_FEED' | 'COMMERCE' | 'CAROUSEL_COMMERCE' | 'PREMIUM_VIDEO';
  status: string;
  image_url?: string;      // 이미지 URL (IMAGE, WIDE 타입)
  image_link?: string;     // 이미지 클릭 시 이동 URL (선택)
  buttons?: Array<{
    type: string;
    name: string;
    url_mobile?: string;
    url_pc?: string;
  }>;
  // PREMIUM_VIDEO 타입 필드
  video_url?: string;      // 동영상 URL
  thumbnail_url?: string;  // 썸네일 이미지 URL
  // COMMERCE 타입 필드
  commerce_title?: string; // 상품명
  regular_price?: number;  // 정가
  discount_price?: number; // 할인가
  discount_rate?: number;  // 할인율 (%)
  discount_fixed?: number; // 할인 금액 (원)
  // WIDE_ITEM_LIST 타입 필드
  items?: Array<{
    img_url: string;       // 아이템 썸네일 이미지 URL
    url_mobile: string;    // 아이템 클릭 시 이동 URL
    title?: string;        // 아이템 제목 (선택)
  }>;
  // CAROUSEL_COMMERCE, CAROUSEL_FEED 타입 필드
  carousel_cards?: Array<{
    img_url?: string;          // 카드 이미지 URL
    commerce_title?: string;   // 상품명 (CAROUSEL_COMMERCE)
    regular_price?: number;    // 정가 (CAROUSEL_COMMERCE)
    discount_price?: number;   // 할인가 (CAROUSEL_COMMERCE)
    discount_rate?: number;    // 할인율 (CAROUSEL_COMMERCE)
    discount_fixed?: number;   // 할인 금액 (CAROUSEL_COMMERCE)
    url_mobile?: string;       // 카드 클릭 시 이동 URL
    title?: string;            // 카드 제목 (CAROUSEL_FEED)
    description?: string;      // 카드 설명 (CAROUSEL_FEED)
  }>;
}

// 브랜드 메시지 발송 요청 타입
export interface BrandMessageSendRequest {
  senderKey: string;
  templateCode: string;
  recipients: Recipient[];
  message: string;
  callbackNumber: string;
  messageType: 'TEXT' | 'IMAGE' | 'WIDE' | 'WIDE_ITEM_LIST' | 'CAROUSEL_FEED' | 'PREMIUM_VIDEO' | 'COMMERCE' | 'CAROUSEL_COMMERCE';
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
    video?: {
      videoUrl: string;
      thumbnailUrl: string;
    };
    commerce?: {
      title: string;
      regularPrice: number;
      discountPrice?: number;
      discountRate?: number;
      discountFixed?: number;
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
        image_url?: string;
        image_link?: string;
        buttons: unknown;
        video_url?: string;
        thumbnail_url?: string;
        commerce_title?: string;
        regular_price?: number;
        discount_price?: number;
        discount_rate?: number;
        discount_fixed?: number;
        items?: Array<{ img_url: string; url_mobile: string; title?: string }>;
        carousel_cards?: Array<{
          img_url?: string;
          commerce_title?: string;
          regular_price?: number;
          discount_price?: number;
          discount_rate?: number;
          discount_fixed?: number;
          url_mobile?: string;
          title?: string;
          description?: string;
        }>;
      }) => ({
        template_code: template.template_code,
        template_name: template.template_name,
        content: template.content,
        message_type: template.chat_bubble_type,
        status: template.status,
        image_url: template.image_url,
        image_link: template.image_link,
        buttons: template.buttons,
        video_url: template.video_url,
        thumbnail_url: template.thumbnail_url,
        commerce_title: template.commerce_title,
        regular_price: template.regular_price,
        discount_price: template.discount_price,
        discount_rate: template.discount_rate,
        discount_fixed: template.discount_fixed,
        items: template.items,
        carousel_cards: template.carousel_cards,
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
    if (!token) {
      throw new Error('로그인이 필요합니다.');
    }

    const response = await fetch('/api/messages/kakao/brand/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('[브랜드 메시지 클라이언트] 에러 응답:', error);
      throw new Error(error.error || '브랜드 메시지 발송 실패');
    }

    const result = await response.json();
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
