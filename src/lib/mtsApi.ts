/**
 * MTS API 클라이언트 라이브러리
 *
 * MTS API를 통한 메시지 발송 기능을 제공합니다.
 * - SMS/LMS/MMS 발송
 * - 카카오 알림톡/친구톡 V2 발송
 * - 네이버 톡톡 발송 (브랜드 메시지)
 * - 이미지 업로드
 * - 템플릿 관리
 */

import { createClient } from '@supabase/supabase-js';

// MTS API 설정
const MTS_AUTH_CODE = process.env.MTS_AUTH_CODE;
const MTS_API_URL = process.env.MTS_API_URL || 'https://api.mtsco.co.kr';
const MTS_TEMPLATE_API_URL = process.env.MTS_TEMPLATE_API_URL || 'https://talks.mtsco.co.kr';

// Supabase 설정
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// 날짜 형식 변환 (yyyy-MM-dd HH:mm → YYYYMMDDHHmmss)
export function convertToMtsDateFormat(dateString: string): string {
  return dateString.replace(/[-:\s]/g, '');
}

// MTS API 응답 타입
export interface MtsApiResult {
  messageId?: string; // msgId의 alias (호환성)
  success: boolean;
  msgId?: string;
  error?: string;
  errorCode?: string;
  responseData?: Record<string, unknown>;
}

// 에러 코드 매핑
const MTS_ERROR_MESSAGES: Record<string, string> = {
  // 성공
  '0000': '성공 (SMS/LMS/MMS)',
  '1000': '성공 (알림톡/친구톡)',

  // 인증 및 프로필 관련 (1xxx)
  '1001': 'Request Body가 Json 형식이 아님',
  '1002': '허브 파트너 키가 유효하지 않음',
  '1003': '발신 프로필 키가 유효하지 않음',
  '1006': '삭제된 발신프로필 (MTS 담당자 문의 필요)',
  '1007': '차단 상태의 발신프로필 (MTS 담당자 문의 필요)',
  '1021': '차단 상태의 카카오톡 채널',
  '1022': '닫힘 상태의 카카오톡 채널',
  '1023': '삭제된 카카오톡 채널',
  '1025': '채널 제재 상태로 인한 메시지 전송 실패',
  '1028': '타게팅 옵션(M/N)을 사용할 수 없습니다. 필수 조건: 비즈니스 인증, 5만+ 친구수, 수신동의 파일, 알림톡 발송이력. 테스트는 타게팅 I(채널친구만)를 사용하세요.',
  '1030': '파라미터 오류 (InvalidParameterException)',

  // 메시지 전송 오류 (3xxx)
  '3005': '메시지를 발송했으나 수신확인 안됨 (성공 불확실)',
  '3006': '내부 시스템 오류로 메시지 전송 실패',
  '3008': '전화번호 오류',
  '3010': 'Json 파싱 오류',
  '3011': '메시지가 존재하지 않음',
  '3012': '메시지 일련번호가 중복됨',
  '3013': '메시지가 비어 있음',
  '3014': '메시지 길이 제한 오류',
  '3015': '템플릿을 찾을 수 없음',
  '3016': '메시지 내용이 템플릿과 일치하지 않음',
  '3018': '메시지를 전송할 수 없음',
  '3019': '톡 유저가 아님',
  '3020': '알림톡 수신 차단',
  '3021': '카카오톡 최소 버전 미지원',
  '3022': '메시지 발송 가능한 시간이 아님 (친구톡/마케팅: 08~20시)',
  '3024': '메시지에 포함된 이미지를 전송할 수 없음',
  '3027': '메시지 버튼/바로연결이 템플릿과 일치하지 않음',

  // 카카오 서버 오류 (8xxx)
  '8001': '카카오 서버로 전송 중 오류 발생',
  '8004': '카카오 서버로 전송했으나 응답 없음',

  // MTS 시스템 오류 (ERxx)
  'ER00': 'JSON 파싱 중 에러 발생',
  'ER01': '인증코드 내용이 없거나 유효하지 않음',
  'ER02': '발신프로필키 내용이 없음',
  'ER03': '수신자번호 내용이 없음',
  'ER15': '메시지 크기 초과 (SMS: 90바이트, LMS: 2000바이트)',
  'ER17': '허용되지 않은 발신번호 (MTS에 등록되지 않은 번호)',

  // SMS/MMS 이통사 오류 (1xxx, 2xxx, 4xxx, 6xxx, 8xxx)
  '1013': '결번',
  '1026': '음영지역',
  '2003': '주소를 MMS Relay/Server가 찾을 수 없음',
  '2007': '메시지가 규격에 맞지 않음 / 번호 이동된 가입자',
  '2103': '미지원 단말',
  '4000': '요구된 서비스가 실행될 수 없음',
  '4007': '클라이언트가 permission이 없는 경우 / 전송 실패',
  '4008': '이통사 일시적인 트래픽 초과로 인한 실패',
  '6014': '수신자가 착신거절 신청자',
  '8880': 'MMS 이미지 발송 시 발송할 수 없는 이미지 파일',

  // 일반 오류
  '9999': '시스템 오류 (패킷 오류)',
};

// 에러 메시지 가져오기
function getErrorMessage(code: string): string {
  return MTS_ERROR_MESSAGES[code] || `알 수 없는 오류 (코드: ${code})`;
}

/**
 * SMS/LMS/MMS 발송 (자동으로 SMS/LMS/MMS 판단)
 * @param toNumber 수신번호 (하이픈 없이)
 * @param message 메시지 내용
 * @param callbackNumber 발신번호 (하이픈 없이)
 * @param subject 제목 (LMS/MMS용, 선택)
 * @param sendDate 예약 발송 시간 (YYYYMMDDHHmmss 형식, 선택)
 * @param imageUrl 이미지 URL (MMS용, 선택) - /img/upload_image API로 업로드한 URL
 */
export async function sendMtsSMS(
  toNumber: string,
  message: string,
  callbackNumber: string,
  subject?: string,
  sendDate?: string,
  imageUrl?: string
): Promise<MtsApiResult> {
  try {
    // 환경 변수 확인
    if (!MTS_AUTH_CODE) {
      return {
        success: false,
        error: 'MTS_AUTH_CODE가 설정되지 않았습니다.',
        errorCode: 'CONFIG_ERROR',
      };
    }

    // 전화번호에서 하이픈 제거
    const cleanToNumber = toNumber.replace(/-/g, '');
    const cleanCallbackNumber = callbackNumber.replace(/-/g, '');

    // 메시지 바이트 계산 (한글 = 3바이트, 영문/숫자 = 1바이트)
    const messageBytes = Buffer.byteLength(message, 'utf-8');

    // 메시지 타입 결정
    let messageType = 'SMS';
    if (imageUrl) {
      messageType = 'MMS'; // 이미지가 있으면 MMS
    } else if (messageBytes > 90) {
      messageType = 'LMS'; // 90바이트 초과면 LMS
    }

    // 요청 본문
    const requestBody: Record<string, string | { image: { img_url: string }[] }> = {
      auth_code: MTS_AUTH_CODE,
      callback_number: cleanCallbackNumber,
      phone_number: cleanToNumber,
      message: message,
    };

    // LMS/MMS인 경우 subject 추가
    if (messageType === 'LMS' || messageType === 'MMS') {
      requestBody.subject = subject || (messageType === 'MMS' ? 'MMS' : 'LMS');
    }

    // MMS인 경우 attachment 추가
    if (imageUrl) {
      requestBody.attachment = {
        image: [{
          img_url: imageUrl
        }]
      };
    }

    // 예약 발송 시간이 있으면 추가
    if (sendDate) {
      requestBody.send_date = sendDate;
    }

    // API 엔드포인트 결정
    // SMS (90바이트 이하, 이미지 없음) -> /sndng/sms/sendMessage
    // LMS/MMS (90바이트 초과 또는 이미지 포함) -> /sndng/mms/sendMessage
    const endpoint = messageType === 'SMS'
      ? `${MTS_API_URL}/sndng/sms/sendMessage`
      : `${MTS_API_URL}/sndng/mms/sendMessage`;

    // API 호출
    console.log('========================================');
    console.log('[MTS SMS/LMS/MMS API 호출 시작]');
    console.log('시간:', new Date().toISOString());
    console.log('메시지 타입:', messageType);
    console.log('메시지 크기:', messageBytes, '바이트');
    console.log('이미지 포함:', imageUrl ? 'Yes' : 'No');
    console.log('API URL:', endpoint);
    console.log('요청 데이터 (마스킹):', JSON.stringify({
      auth_code: '*** (보안)',
      callback_number: cleanCallbackNumber.substring(0, 3) + '****' + cleanCallbackNumber.substring(7),
      phone_number: cleanToNumber.substring(0, 3) + '****' + cleanToNumber.substring(7),
      message: message.length > 50 ? message.substring(0, 50) + '...' : message,
      subject: requestBody.subject || '(없음)',
      send_date: sendDate || '(즉시발송)',
      attachment: imageUrl ? { image: [{ img_url: imageUrl }] } : '(없음)'
    }, null, 2));
    console.log('실제 전송 requestBody:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify(requestBody),
    });

    const result = await response.json();

    console.log('[MTS SMS API 응답 수신]');
    console.log('HTTP 상태:', response.status, response.statusText);
    console.log('응답 데이터:', JSON.stringify(result, null, 2));
    console.log('========================================\n');

    // 성공 확인 (0000: SMS/LMS 성공)
    if (result.code === '0000') {
      return {
        success: true,
        msgId: result.msg_id,
        messageId: result.msg_id, // alias for compatibility
        responseData: result,
      };
    }

    // 실패 시 에러 메시지 반환
    return {
      success: false,
      error: getErrorMessage(result.code) || result.message || 'SMS 발송 실패',
      errorCode: result.code,
      responseData: result,
    };
  } catch (error) {
    console.error('MTS API 호출 오류 (SMS):', error);

    if (error instanceof TypeError) {
      return {
        success: false,
        error: '네트워크 오류: MTS API에 연결할 수 없습니다.',
        errorCode: 'NETWORK_ERROR',
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
      errorCode: 'UNKNOWN_ERROR',
    };
  }
}

/**
 * MMS 발송 (이미지 포함)
 * @param toNumber 수신번호 (하이픈 없이)
 * @param message 메시지 내용
 * @param subject 제목
 * @param imageUrls 이미지 URL 배열 (MTS 업로드 후 받은 경로)
 * @param callbackNumber 발신번호 (하이픈 없이)
 * @param sendDate 예약 발송 시간 (YYYYMMDDHHmmss 형식, 선택)
 */
export async function sendMtsMMS(
  toNumber: string,
  message: string,
  subject: string,
  imageUrls: string[],
  callbackNumber: string,
  sendDate?: string
): Promise<MtsApiResult> {
  try {
    // 환경 변수 확인
    if (!MTS_AUTH_CODE) {
      return {
        success: false,
        error: 'MTS_AUTH_CODE가 설정되지 않았습니다.',
        errorCode: 'CONFIG_ERROR',
      };
    }

    // 전화번호에서 하이픈 제거
    const cleanToNumber = toNumber.replace(/-/g, '');
    const cleanCallbackNumber = callbackNumber.replace(/-/g, '');

    // 요청 본문
    const requestBody: Record<string, unknown> = {
      auth_code: MTS_AUTH_CODE,
      callback_number: cleanCallbackNumber,
      phone_number: cleanToNumber,
      subject: subject,
      message: message,
      attachment: {
        image: imageUrls.map(url => ({ img_url: url })),
      },
    };

    // 예약 발송 시간이 있으면 추가
    if (sendDate) {
      requestBody.send_date = sendDate;
    }

    // API 호출
    const response = await fetch(`${MTS_API_URL}/sndng/mms/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify(requestBody),
    });

    const result = await response.json();


    // 성공 확인
    if (result.code === '0000') {
      return {
        success: true,
        msgId: result.msg_id,
        messageId: result.msg_id, // alias for compatibility
        responseData: result,
      };
    }

    // 실패 시 에러 메시지 반환
    return {
      success: false,
      error: getErrorMessage(result.code) || result.message || 'MMS 발송 실패',
      errorCode: result.code,
      responseData: result,
    };
  } catch (error) {
    console.error('MTS API 호출 오류 (MMS):', error);

    if (error instanceof TypeError) {
      return {
        success: false,
        error: '네트워크 오류: MTS API에 연결할 수 없습니다.',
        errorCode: 'NETWORK_ERROR',
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
      errorCode: 'UNKNOWN_ERROR',
    };
  }
}

/**
 * 이미지 업로드
 * @param imageBuffer 이미지 파일 Buffer
 * @param fileName 파일명
 * @param mimeType MIME 타입 (기본: image/jpeg)
 */
export async function uploadMtsImage(
  imageBuffer: Buffer,
  fileName: string,
  mimeType: string = 'image/jpeg'
): Promise<MtsApiResult> {
  try {
    // 환경 변수 확인
    if (!MTS_AUTH_CODE) {
      return {
        success: false,
        error: 'MTS_AUTH_CODE가 설정되지 않았습니다.',
        errorCode: 'CONFIG_ERROR',
      };
    }

    const formData = new FormData();
    formData.append('auth_code', MTS_AUTH_CODE);

    // Buffer를 Uint8Array로 변환 후 Blob 생성 (Node.js 환경)
    const uint8Array = new Uint8Array(imageBuffer.buffer, imageBuffer.byteOffset, imageBuffer.byteLength);
    const blob = new Blob([uint8Array as unknown as BlobPart], { type: mimeType });
    formData.append('image', blob, fileName);

    // API 호출
    const response = await fetch(`${MTS_API_URL}/img/upload_image`, {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    // 성공 확인
    if (result.code === '0000') {
      return {
        success: true,
        msgId: result.images, // 주의: 응답 필드명은 'images' (복수형)
        responseData: result,
      };
    }

    // 실패 시 에러 메시지 반환
    return {
      success: false,
      error: getErrorMessage(result.code) || result.message || '이미지 업로드 실패',
      errorCode: result.code,
      responseData: result,
    };
  } catch (error) {
    console.error('MTS API 호출 오류 (이미지 업로드):', error);

    if (error instanceof TypeError) {
      return {
        success: false,
        error: '네트워크 오류: MTS API에 연결할 수 없습니다.',
        errorCode: 'NETWORK_ERROR',
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
      errorCode: 'UNKNOWN_ERROR',
    };
  }
}

/**
 * 카카오 알림톡 발송
 * @param senderKey 발신 프로필 키
 * @param templateCode 템플릿 코드
 * @param toNumber 수신번호 (하이픈 없이)
 * @param message 템플릿 내용
 * @param callbackNumber 발신번호 (하이픈 없이)
 * @param buttons 버튼 정보 (선택)
 * @param tranType 전환 전송 타입 (SMS/LMS/MMS, 선택)
 * @param tranMessage 전환 발송 시 메시지 (선택)
 * @param sendDate 예약 발송 시간 (YYYYMMDDHHmmss 형식, 선택)
 */
export async function sendMtsAlimtalk(
  senderKey: string,
  templateCode: string,
  toNumber: string,
  message: string,
  callbackNumber: string,
  buttons?: Array<{ name: string; type: string; url_mobile?: string; url_pc?: string }>,
  tranType?: 'SMS' | 'LMS' | 'MMS',
  tranMessage?: string,
  sendDate?: string
): Promise<MtsApiResult> {
  try {
    // 환경 변수 확인
    if (!MTS_AUTH_CODE) {
      return {
        success: false,
        error: 'MTS_AUTH_CODE가 설정되지 않았습니다.',
        errorCode: 'CONFIG_ERROR',
      };
    }

    // 전화번호에서 하이픈 제거
    const cleanToNumber = toNumber.replace(/-/g, '');
    const cleanCallbackNumber = callbackNumber.replace(/-/g, '');

    // 요청 본문
    const requestBody: Record<string, unknown> = {
      auth_code: MTS_AUTH_CODE,
      sender_key: senderKey,
      template_code: templateCode,
      phone_number: cleanToNumber,
      message: message,
      callback_number: cleanCallbackNumber,
    };

    // 버튼 추가
    if (buttons && buttons.length > 0) {
      requestBody.attachment = {
        button: buttons,
      };
    }

    // 전환 전송 설정 추가
    if (tranType && tranMessage) {
      requestBody.tran_type = tranType;
      requestBody.tran_callback = cleanCallbackNumber;
      requestBody.tran_message = tranMessage;
    }

    // 예약 발송 시간이 있으면 추가
    if (sendDate) {
      requestBody.send_date = sendDate;
    }

    // API 호출
    console.log('========================================');
    console.log('[MTS 카카오 알림톡 API 호출 시작]');
    console.log('시간:', new Date().toISOString());
    console.log('API URL:', `${MTS_API_URL}/sndng/atk/sendMessage`);
    console.log('요청 데이터:', JSON.stringify({
      auth_code: '*** (보안)',
      sender_key: senderKey,
      template_code: templateCode,
      phone_number: cleanToNumber.substring(0, 3) + '****' + cleanToNumber.substring(7),
      message: message.length > 50 ? message.substring(0, 50) + '...' : message,
      callback_number: cleanCallbackNumber.substring(0, 3) + '****' + cleanCallbackNumber.substring(7),
      버튼: buttons ? `${buttons.length}개` : '없음',
      전환발송설정: tranType ? `있음 (${tranType})` : '없음',
      예약발송: sendDate || '(즉시발송)'
    }, null, 2));

    const response = await fetch(`${MTS_API_URL}/sndng/atk/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify(requestBody),
    });

    const result = await response.json();

    console.log('[MTS 카카오 알림톡 API 응답 수신]');
    console.log('HTTP 상태:', response.status, response.statusText);
    console.log('응답 데이터:', JSON.stringify(result, null, 2));
    console.log('========================================\n');

    // 성공 확인 (0000 또는 1000: 알림톡 성공)
    if (result.code === '0000' || result.code === '1000' || result.code === '200') {
      return {
        success: true,
        msgId: result.msg_id,
        messageId: result.msg_id, // alias for compatibility
        responseData: result,
      };
    }

    // 실패 시 에러 메시지 반환
    return {
      success: false,
      error: getErrorMessage(result.code) || result.message || '알림톡 발송 실패',
      errorCode: result.code,
      responseData: result,
    };
  } catch (error) {
    if (error instanceof TypeError) {
      return {
        success: false,
        error: '네트워크 오류: MTS API에 연결할 수 없습니다.',
        errorCode: 'NETWORK_ERROR',
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
      errorCode: 'UNKNOWN_ERROR',
    };
  }
}

/**
 * 카카오 친구톡 V2 발송
 * @param senderKey 발신 프로필 키
 * @param toNumber 수신번호 (하이픈 없이)
 * @param message 친구톡 메시지 내용
 * @param callbackNumber 발신번호 (하이픈 없이)
 * @param messageType 메시지 타입 (FT: 텍스트형, FI: 이미지형, FW: 와이드 이미지형, FL: 와이드 리스트형, FC: 캐러셀형)
 * @param adFlag 광고 여부 (Y: 광고성, N: 일반)
 * @param imageUrls 이미지 URL 배열 (선택)
 * @param buttons 버튼 정보 (선택)
 * @param tranType 전환 전송 타입 (SMS/LMS/MMS, 선택)
 * @param tranMessage 전환 발송 시 메시지 (선택)
 * @param sendDate 예약 발송 시간 (YYYYMMDDHHmmss 형식, 선택)
 */
export async function sendMtsFriendtalk(
  senderKey: string,
  toNumber: string,
  message: string,
  callbackNumber: string,
  messageType?: 'FT' | 'FI' | 'FW' | 'FL' | 'FC',
  adFlag: 'Y' | 'N' = 'N',
  imageUrls?: string[],
  imageLink?: string,
  buttons?: Array<{ name: string; type: string; url_mobile?: string; url_pc?: string }>,
  tranType?: 'SMS' | 'LMS' | 'MMS',
  tranMessage?: string,
  sendDate?: string
): Promise<MtsApiResult> {
  try {
    if (!MTS_AUTH_CODE) {
      return {
        success: false,
        error: 'MTS_AUTH_CODE가 설정되지 않았습니다.',
        errorCode: 'CONFIG_ERROR',
      };
    }

    // 전화번호에서 하이픈 제거
    const cleanToNumber = toNumber.replace(/-/g, '');
    const cleanCallbackNumber = callbackNumber.replace(/-/g, '');

    // 메시지 타입 자동 감지
    let finalMessageType = messageType;
    if (!finalMessageType) {
      if (imageUrls && imageUrls.length > 0) {
        finalMessageType = 'FI';
        console.log('[친구톡] 메시지 타입 자동 감지: FI (이미지형)');
      } else {
        finalMessageType = 'FT';
        console.log('[친구톡] 메시지 타입 자동 감지: FT (텍스트형)');
      }
    } else {
      console.log(`[친구톡] 메시지 타입 수동 지정: ${finalMessageType}`);
    }

    // 요청 본문
    const requestBody: Record<string, unknown> = {
      auth_code: MTS_AUTH_CODE,
      sender_key: senderKey,
      phone_number: cleanToNumber,
      message: message,
      messageType: finalMessageType,
      ad_flag: adFlag,
      callback_number: cleanCallbackNumber,
    };

    // 첨부 파일 (이미지, 버튼) 추가
    if (imageUrls || buttons) {
      const attachment: Record<string, unknown> = {};

      if (imageUrls && imageUrls.length > 0) {
        // FI/FW/FL/FC 타입은 단일 이미지 객체 사용 (배열 아님)
        // MTS API 규격: attachment.image = { img_url: "...", img_link: "..." }
        attachment.image = {
          img_url: imageUrls[0], // 첫 번째 이미지만 사용
          ...(imageLink ? { img_link: imageLink } : {})
        };
      }

      if (buttons && buttons.length > 0) {
        attachment.button = buttons;
      }

      requestBody.attachment = attachment;
    }

    // 전환 전송 설정 추가
    if (tranType && tranMessage) {
      requestBody.tran_type = tranType;
      requestBody.tran_callback = cleanCallbackNumber;
      requestBody.tran_message = tranMessage;
    }

    // 예약 발송 시간이 있으면 추가
    if (sendDate) {
      requestBody.send_date = sendDate;
    }

    // API 호출 (V2 엔드포인트 사용)
    const apiUrl = `${MTS_API_URL}/v2/sndng/ftk/sendMessage`;

    console.log('========================================');
    console.log('[MTS 카카오 친구톡 API 호출 시작]');
    console.log('시간:', new Date().toISOString());
    console.log('API URL:', apiUrl);
    console.log('요청 데이터 (요약):', JSON.stringify({
      auth_code: '*** (보안)',
      sender_key: senderKey,
      phone_number: cleanToNumber.substring(0, 3) + '****' + cleanToNumber.substring(7),
      message: message.length > 50 ? message.substring(0, 50) + '...' : message,
      messageType: messageType,
      ad_flag: adFlag,
      callback_number: cleanCallbackNumber.substring(0, 3) + '****' + cleanCallbackNumber.substring(7),
      이미지: imageUrls ? `${imageUrls.length}개` : '없음',
      버튼: buttons ? `${buttons.length}개` : '없음',
      전환발송설정: tranType ? `있음 (${tranType})` : '없음',
      예약발송: sendDate || '(즉시발송)'
    }, null, 2));
    console.log('실제 전송 requestBody:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify(requestBody),
    });

    const result = await response.json();

    console.log('[MTS 카카오 친구톡 API 응답 수신]');
    console.log('HTTP 상태:', response.status, response.statusText);
    console.log('응답 데이터:', JSON.stringify(result, null, 2));
    console.log('========================================\n');

    // 성공 확인 (0000 또는 1000: 친구톡 성공)
    // MTS API는 친구톡에 대해 0000 또는 1000을 반환할 수 있음
    if (result.code === '0000' || result.code === '1000') {
      return {
        success: true,
        msgId: result.msg_id,
        messageId: result.msg_id, // alias for compatibility
        responseData: result,
      };
    }

    // 실패 시 에러 메시지 반환
    const errorMsg = getErrorMessage(result.code) || result.message || '친구톡 발송 실패';

    return {
      success: false,
      error: errorMsg,
      errorCode: result.code,
      responseData: result,
    };
  } catch (error) {
    console.error('[mtsApi.sendMtsFriendtalk] 오류:', error);

    if (error instanceof TypeError) {
      return {
        success: false,
        error: '네트워크 오류: MTS API에 연결할 수 없습니다.',
        errorCode: 'NETWORK_ERROR',
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
      errorCode: 'UNKNOWN_ERROR',
    };
  }
}

/**
 * 카카오 알림톡 템플릿 목록 조회
 * @param senderKey 발신 프로필 키
 * @param page 페이지 번호 (기본: 1)
 * @param count 페이지당 개수 (기본: 100)
 */
export async function getMtsAlimtalkTemplates(
  senderKey: string,
  page: number = 1,
  count: number = 100
): Promise<MtsApiResult> {
  try {
    // 환경 변수 확인
    if (!MTS_AUTH_CODE) {
      return {
        success: false,
        error: 'MTS_AUTH_CODE가 설정되지 않았습니다.',
        errorCode: 'CONFIG_ERROR',
      };
    }

    // 요청 본문
    const requestBody = {
      auth_code: MTS_AUTH_CODE,
      sender_key: senderKey,
      page: page,
      count: count,
    };

    // API 호출
    const response = await fetch(`${MTS_TEMPLATE_API_URL}/kakaoTalk/atk/getTemplateList`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify(requestBody),
    });

    const result = await response.json();

    // 성공 확인
    if (result.code === '0000' || result.code === '1000') {
      return {
        success: true,
        responseData: result,
      };
    }

    // 실패 시 에러 메시지 반환
    return {
      success: false,
      error: getErrorMessage(result.code) || result.message || '템플릿 목록 조회 실패',
      errorCode: result.code,
      responseData: result,
    };
  } catch (error) {
    console.error('MTS API 호출 오류 (템플릿 목록 조회):', error);

    if (error instanceof TypeError) {
      return {
        success: false,
        error: '네트워크 오류: MTS API에 연결할 수 없습니다.',
        errorCode: 'NETWORK_ERROR',
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
      errorCode: 'UNKNOWN_ERROR',
    };
  }
}

/**
 * 카카오 알림톡 템플릿 상세 조회
 * @param senderKey 발신 프로필 키
 * @param templateCode 템플릿 코드
 * @param senderKeyType 발신프로필 타입 (S: 기본, G: 그룹, 기본값: S)
 */
export async function getMtsAlimtalkTemplate(
  senderKey: string,
  templateCode: string,
  senderKeyType: 'S' | 'G' = 'S'
): Promise<MtsApiResult> {
  try {
    // FormData 생성
    const formData = new FormData();
    formData.append('senderKey', senderKey);
    formData.append('templateCode', templateCode);
    formData.append('senderKeyType', senderKeyType);

    // API 호출
    const response = await fetch(`${MTS_TEMPLATE_API_URL}/mts/api/state/template`, {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();


    // 성공 확인
    if (result.code === '0000' || result.code === '1000' || result.code === '200') {
      return {
        success: true,
        responseData: result,
      };
    }

    // 실패 시 에러 메시지 반환
    return {
      success: false,
      error: getErrorMessage(result.code) || result.message || '템플릿 조회 실패',
      errorCode: result.code,
      responseData: result,
    };
  } catch (error) {
    console.error('MTS API 호출 오류 (템플릿 조회):', error);

    if (error instanceof TypeError) {
      return {
        success: false,
        error: '네트워크 오류: MTS API에 연결할 수 없습니다.',
        errorCode: 'NETWORK_ERROR',
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
      errorCode: 'UNKNOWN_ERROR',
    };
  }
}


/**
 * 카카오 발신 프로필 목록 조회
 * @param page 페이지 번호 (기본: 1)
 * @param count 페이지당 개수 (기본: 100)
 */
// [DEPRECATED] MTS API does not provide this endpoint
// Use database query instead: GET /api/kakao/profiles
export async function getMtsSenderProfiles(
  page: number = 1,
  count: number = 100
): Promise<MtsApiResult> {
  try {
    // 환경 변수 확인
    if (!MTS_AUTH_CODE) {
      return {
        success: false,
        error: 'MTS_AUTH_CODE가 설정되지 않았습니다.',
        errorCode: 'CONFIG_ERROR',
      };
    }

    // 요청 본문
    const requestBody = {
      auth_code: MTS_AUTH_CODE,
      page: page,
      count: count,
    };

    // API 호출
    const response = await fetch(`${MTS_TEMPLATE_API_URL}/mts/api/sender/list`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify(requestBody),
    });

    const result = await response.json();

    // 성공 확인
    if (result.code === '0000' || result.code === '1000') {
      return {
        success: true,
        responseData: result,
      };
    }

    // 실패 시 에러 메시지 반환
    return {
      success: false,
      error: getErrorMessage(result.code) || result.message || '발신 프로필 조회 실패',
      errorCode: result.code,
      responseData: result,
    };
  } catch (error) {
    console.error('MTS API 호출 오류 (발신 프로필 조회):', error);

    if (error instanceof TypeError) {
      return {
        success: false,
        error: '네트워크 오류: MTS API에 연결할 수 없습니다.',
        errorCode: 'NETWORK_ERROR',
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
      errorCode: 'UNKNOWN_ERROR',
    };
  }
}

/**
 * 네이버 톡톡 템플릿 목록 조회
 * @param navertalkId 네이버 톡톡 ID
 * @param page 페이지 번호 (기본: 1)
 * @param count 페이지당 개수 (기본: 100)
 */
export async function getNaverTalkTemplates(
  partnerKey: string,
  page: number = 1,
  count: number = 100
): Promise<MtsApiResult> {
  try {
    // 환경 변수 확인
    if (!MTS_AUTH_CODE) {
      return {
        success: false,
        error: 'MTS_AUTH_CODE가 설정되지 않았습니다.',
        errorCode: 'CONFIG_ERROR',
      };
    }

    // 요청 본문
    const requestBody = {
      auth_code: MTS_AUTH_CODE,
      partner_key: partnerKey,
      page: page,
      count: count,
    };

    // API 호출
    const response = await fetch(`${MTS_TEMPLATE_API_URL}/naverTalk/nti/getTemplateList`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify(requestBody),
    });

    const result = await response.json();

    // 성공 확인
    if (result.code === '0000' || result.code === '1000') {
      return {
        success: true,
        responseData: result,
      };
    }

    // 실패 시 에러 메시지 반환
    return {
      success: false,
      error: getErrorMessage(result.code) || result.message || '네이버 톡톡 템플릿 목록 조회 실패',
      errorCode: result.code,
      responseData: result,
    };
  } catch (error) {
    console.error('MTS API 호출 오류 (네이버 톡톡 템플릿 목록 조회):', error);

    if (error instanceof TypeError) {
      return {
        success: false,
        error: '네트워크 오류: MTS API에 연결할 수 없습니다.',
        errorCode: 'NETWORK_ERROR',
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
      errorCode: 'UNKNOWN_ERROR',
    };
  }
}

/**
 * 네이버 톡톡 스마트알림 발송
 * @param navertalkId 네이버 톡톡 ID
 * @param templateCode 템플릿 코드
 * @param toNumber 수신번호 (하이픈 없이)
 * @param text 템플릿 내용 (변수 치환 완료된 텍스트)
 * @param productCode 상품 코드 (INFORMATION: 정보성-알림, BENEFIT: 마케팅/광고-혜택, CARDINFO: 정보성-카드알림)
 * @param buttons 버튼 정보 (선택, 최대 5개)
 * @param imageHashId 이미지 해시 ID (선택)
 * @param sendDate 예약 발송 시간 (YYYYMMDDHHmmss 형식, 선택)
 */
export async function sendNaverTalk(
  partnerKey: string,
  templateCode: string,
  toNumber: string,
  text: string,
  productCode: 'INFORMATION' | 'BENEFIT' | 'CARDINFO',
  buttons?: Array<{ type: 'WEB_LINK' | 'APP_LINK'; name: string; url?: string; mobileUrl?: string }>,
  imageHashId?: string,
  sendDate?: string
): Promise<MtsApiResult> {
  try {
    // 환경 변수 확인
    if (!MTS_AUTH_CODE) {
      return {
        success: false,
        error: 'MTS_AUTH_CODE가 설정되지 않았습니다.',
        errorCode: 'CONFIG_ERROR',
      };
    }

    // 전화번호에서 하이픈 제거
    const cleanToNumber = toNumber.replace(/-/g, '');

    // 요청 본문
    const requestBody: Record<string, unknown> = {
      auth_code: MTS_AUTH_CODE,
      partner_key: partnerKey,
      code: templateCode,
      phone_number: cleanToNumber,
      text: text,
      productCode: productCode,
    };

    // 버튼 추가
    if (buttons && buttons.length > 0) {
      requestBody.buttons = buttons;
    }

    // 이미지 해시 ID 추가
    if (imageHashId) {
      requestBody.sampleImageHashId = imageHashId;
    }

    // 예약 발송 시간이 있으면 추가
    if (sendDate) {
      requestBody.send_date = sendDate;
    }

    // API 호출
    const response = await fetch(`${MTS_API_URL}/sndng/nti/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify(requestBody),
    });

    const result = await response.json();

    // 성공 확인 (1000: 네이버 톡톡 성공)
    if (result.code === '1000') {
      return {
        success: true,
        msgId: result.msg_id,
        messageId: result.msg_id, // alias for compatibility
        responseData: result,
      };
    }

    // 실패 시 에러 메시지 반환
    return {
      success: false,
      error: getErrorMessage(result.code) || result.message || '네이버 톡톡 발송 실패',
      errorCode: result.code,
      responseData: result,
    };
  } catch (error) {
    console.error('MTS API 호출 오류 (네이버 톡톡):', error);

    if (error instanceof TypeError) {
      return {
        success: false,
        error: '네트워크 오류: MTS API에 연결할 수 없습니다.',
        errorCode: 'NETWORK_ERROR',
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
      errorCode: 'UNKNOWN_ERROR',
    };
  }
}

/**
 * 카카오 브랜드 메시지 발송 (기본형: 전문방식)
 *
 * @param senderKey 발신 프로필 키
 * @param templateCode 템플릿 코드
 * @param toNumber 수신자 전화번호
 * @param message 메시지 내용
 * @param callbackNumber 발신 전화번호
 * @param messageType 브랜드 메시지 타입 (TEXT, IMAGE, WIDE, WIDE_ITEM_LIST, CAROUSEL_FEED, PREMIUM_VIDEO)
 * @param targeting 타겟팅 타입 (M: 수신동의, N: 수신동의+채널친구, I: 전체+채널친구) - **필수 파라미터**
 * @param attachment 첨부 내용 (버튼, 이미지, 쿠폰 등)
 * @param tranType 전환전송 타입 (N: 전환안함, S: SMS, L: LMS, M: MMS)
 * @param tranMessage 전환전송 메시지
 * @param subject LMS 전송 시 제목
 * @param sendDate 예약 발송 시간 (YYYYMMDDHHmmss)
 * @returns MtsApiResult
 */
export async function sendKakaoBrand(
  senderKey: string,
  templateCode: string,
  toNumber: string,
  message: string,
  callbackNumber: string,
  messageType: 'TEXT' | 'IMAGE' | 'WIDE' | 'WIDE_ITEM_LIST' | 'CAROUSEL_FEED' | 'PREMIUM_VIDEO' = 'TEXT',
  targeting: 'M' | 'N' | 'I' = 'I', // 기본값 'I': 채널친구만. M/N은 5만+ 친구수 등 조건 필요
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
  },
  tranType: 'N' | 'S' | 'L' | 'M' = 'N',
  tranMessage?: string,
  subject?: string,
  sendDate?: string
): Promise<MtsApiResult> {
  try {
    // 환경 변수 확인
    if (!MTS_AUTH_CODE) {
      return {
        success: false,
        error: 'MTS_AUTH_CODE가 설정되지 않았습니다.',
        errorCode: 'CONFIG_ERROR',
      };
    }

    // 전화번호에서 하이픈 제거
    const cleanToNumber = toNumber.replace(/-/g, '');
    const cleanCallbackNumber = callbackNumber.replace(/-/g, '');

    // IMAGE 타입 특별 검증
    if (messageType === 'IMAGE' || messageType === 'WIDE') {
      console.log('[브랜드 메시지 IMAGE 검증] 시작');

      // 1. message 필드 검증 (IMAGE는 최대 400자)
      if (!message || message.trim().length === 0) {
        console.error('❌ IMAGE 타입은 message 필드가 필수입니다 (최소 1자)');
        return {
          success: false,
          error: 'IMAGE 타입은 message 필드가 필수입니다',
          errorCode: 'INVALID_IMAGE_MESSAGE'
        };
      }
      if (message.length > 400) {
        console.error(`❌ IMAGE 타입 message는 최대 400자입니다 (현재: ${message.length}자)`);
        return {
          success: false,
          error: `IMAGE 타입 message는 최대 400자입니다 (현재: ${message.length}자)`,
          errorCode: 'MESSAGE_TOO_LONG'
        };
      }

      // 2. image URL 검증
      if (attachment?.image) {
        if (!attachment.image.img_url) {
          console.error('❌ IMAGE 타입은 attachment.image.img_url이 필수입니다');
          return {
            success: false,
            error: 'IMAGE 타입은 이미지 URL이 필수입니다',
            errorCode: 'MISSING_IMAGE_URL'
          };
        }

        // Kakao 이미지 서버 URL 검증
        if (!attachment.image.img_url.startsWith('https://mud-kage.kakao.com/')) {
          console.warn('⚠️ 이미지 URL이 Kakao 서버가 아닙니다:', attachment.image.img_url);
        }

        console.log('[브랜드 메시지 IMAGE 검증] ✅ 이미지 URL:', attachment.image.img_url);

        // img_link 검증 (선택 사항)
        if (attachment.image.img_link) {
          console.log('[브랜드 메시지 IMAGE 검증] img_link 포함:', attachment.image.img_link);
        } else {
          console.log('[브랜드 메시지 IMAGE 검증] img_link 없음 (선택사항)');
        }
      } else {
        console.error('❌ IMAGE 타입은 attachment.image가 필수입니다');
        return {
          success: false,
          error: 'IMAGE 타입은 이미지가 필수입니다',
          errorCode: 'MISSING_IMAGE'
        };
      }

      console.log('[브랜드 메시지 IMAGE 검증] ✅ 모든 검증 통과');
    }

    // 요청 본문 (전문 방식: 평평한 구조)
    const requestBody: Record<string, unknown> = {
      auth_code: MTS_AUTH_CODE,
      sender_key: senderKey,
      send_mode: '3', // 3: 즉시발송 (전문 방식)
      template_code: templateCode,
      phone_number: cleanToNumber,
      callback_number: cleanCallbackNumber,
      message: message,
      message_type: messageType,
      targeting: targeting, // 필수 파라미터 (M: 수신동의, N: 수신동의+채널친구, I: 전체+채널친구)
      tran_type: tranType,
      country_code: '82',
    };

    // 첨부 내용 추가 - 실제 내용이 있을 때만
    console.log('[브랜드 메시지] Attachment 검증:', {
      attachmentProvided: !!attachment,
      hasButton: attachment?.button ? attachment.button.length > 0 : false,
      hasImage: !!attachment?.image,
      hasCoupon: !!attachment?.coupon,
      hasItem: !!attachment?.item,
      willAddToRequest: !!(attachment && (
        (attachment.button && attachment.button.length > 0) ||
        attachment.image ||
        attachment.coupon ||
        attachment.item
      ))
    });

    if (attachment && (
      (attachment.button && attachment.button.length > 0) ||
      attachment.image ||
      attachment.coupon ||
      attachment.item
    )) {
      requestBody.attachment = attachment;
      console.log('[브랜드 메시지] ✅ Attachment 추가됨:', attachment);
    } else {
      console.log('[브랜드 메시지] ⚠️ Attachment 제외됨 (빈 내용)');
    }

    // 전환 전송 메시지 추가
    if (tranMessage && tranType !== 'N') {
      requestBody.tran_message = tranMessage;
    }

    // LMS 제목 추가
    if (subject && (tranType === 'L' || tranType === 'M')) {
      requestBody.subject = subject;
    }

    // send_date는 전문방식에서 필수 필드
    // sendDate 파라미터가 없으면 현재 시간 + 1분을 YYYYMMDDHHmmss 형식으로
    if (sendDate) {
      requestBody.send_date = sendDate;
    } else {
      const now = new Date();
      const kstNow = new Date(now.getTime() + (9 * 60 * 60 * 1000) + (1 * 60 * 1000)); // KST + 1분
      const yyyy = kstNow.getUTCFullYear();
      const mm = String(kstNow.getUTCMonth() + 1).padStart(2, '0');
      const dd = String(kstNow.getUTCDate()).padStart(2, '0');
      const hh = String(kstNow.getUTCHours()).padStart(2, '0');
      const min = String(kstNow.getUTCMinutes()).padStart(2, '0');
      const ss = String(kstNow.getUTCSeconds()).padStart(2, '0');
      requestBody.send_date = `${yyyy}${mm}${dd}${hh}${min}${ss}`;
      console.log('[브랜드 메시지] send_date 자동 생성 (필수 필드):', requestBody.send_date);
    }

    // 현재 시간 확인 (브랜드 메시지는 08:00-20:00만 발송 가능)
    const now = new Date();
    const kstTime = new Date(now.getTime() + (9 * 60 * 60 * 1000)); // UTC to KST
    const kstHour = kstTime.getUTCHours();
    const kstTimeString = kstTime.toISOString().replace('T', ' ').substring(0, 19);
    const isWithinTimeWindow = kstHour >= 8 && kstHour < 20;

    console.log('[브랜드 메시지] 시간 확인:', {
      currentTimeKST: kstTimeString,
      kstHour,
      isWithinTimeWindow,
      restriction: '브랜드 메시지는 08:00-20:00 KST만 발송 가능'
    });

    if (!isWithinTimeWindow) {
      console.warn('⚠️⚠️⚠️ 경고: 현재 시간이 브랜드 메시지 발송 시간(08:00-20:00 KST) 외입니다!');
    }

    // Targeting 요구사항 확인
    const targetingInfo = {
      'M': '수신동의 사용자만 (마케팅 수신동의 필요)',
      'N': '수신동의 + 채널 친구',
      'I': '전체 + 채널 친구 (요청 + 채널 친구)'
    };
    console.log('[브랜드 메시지] Targeting 설정:', {
      targeting,
      requirement: targetingInfo[targeting],
      warning: targeting === 'M' ? '⚠️ 수신자가 카카오 마케팅 수신동의를 해야 합니다' : ''
    });

    console.log('[브랜드 메시지] MTS API 요청:', {
      endpoint: `${MTS_API_URL}/btalk/send/message/basic`,
      phone_number: cleanToNumber,
      template_code: templateCode,
      send_mode: requestBody.send_mode,
      targeting: requestBody.targeting,
      hasAttachment: 'attachment' in requestBody,
      attachmentKeys: requestBody.attachment ? Object.keys(requestBody.attachment as object) : [],
      fullRequestBody: JSON.parse(JSON.stringify(requestBody)) // Deep clone for logging
    });

    // API 호출 전 실제 전송 JSON 출력
    const requestBodyString = JSON.stringify(requestBody);
    console.log('========================================');
    console.log('[브랜드 메시지] 실제 전송 JSON:');
    console.log(requestBodyString);
    console.log('========================================');
    console.log('[브랜드 메시지] 실제 전송 JSON (파싱):');
    console.log(JSON.parse(requestBodyString));
    console.log('========================================');

    // IMAGE/WIDE 타입 특별 로깅
    if (messageType === 'IMAGE' || messageType === 'WIDE') {
      console.log('🔍 IMAGE/WIDE 타입 상세 분석:');
      console.log('- message_type:', messageType);
      console.log('- message length:', message.length);
      console.log('- message content:', message);
      console.log('- attachment.image:', requestBody.attachment ? (requestBody.attachment as { image?: unknown }).image : 'undefined');
      console.log('- attachment keys:', requestBody.attachment ? Object.keys(requestBody.attachment as object) : []);

      if (requestBody.attachment && (requestBody.attachment as { image?: { img_url?: string; img_link?: string } }).image) {
        const img = (requestBody.attachment as { image: { img_url?: string; img_link?: string } }).image;
        console.log('  - img_url:', img.img_url);
        console.log('  - img_link:', img.img_link || '(없음)');
        console.log('  - img_link key exists:', 'img_link' in img);
      }
      console.log('========================================');
    }

    // API 호출
    const response = await fetch(`${MTS_API_URL}/btalk/send/message/basic`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: requestBodyString,
    });

    console.log('[브랜드 메시지] HTTP 응답 상태:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });

    // 원본 응답 텍스트 먼저 로깅
    const responseText = await response.text();
    console.log('========================================');
    console.log('[브랜드 메시지] MTS API 원본 응답 (텍스트):');
    console.log(responseText);
    console.log('========================================');

    const result = JSON.parse(responseText);
    console.log('[브랜드 메시지] MTS API 파싱된 응답 - 상세 분석:');
    console.log('- 모든 키:', Object.keys(result));
    console.log('- code:', result.code);
    console.log('- message:', result.message);
    console.log('- received_at:', result.received_at);
    console.log('- msg_id:', result.msg_id);
    console.log('- msgid:', result.msgid);
    console.log('- message_id:', result.message_id);
    console.log('- 전체 객체:', JSON.stringify(result, null, 2));
    console.log('========================================');

    // 성공 확인 (0000: 브랜드 메시지 성공)
    if (result.code === '0000' || result.code === '1000') {
      console.log('[브랜드 메시지] 발송 성공');
      return {
        success: true,
        msgId: result.msg_id,
        messageId: result.msg_id, // alias for compatibility
        responseData: result,
      };
    }

    // 실패 시 에러 메시지 반환
    console.error('[브랜드 메시지] 발송 실패:', {
      code: result.code,
      error: getErrorMessage(result.code) || result.message
    });
    return {
      success: false,
      error: getErrorMessage(result.code) || result.message || '브랜드 메시지 발송 실패',
      errorCode: result.code,
      responseData: result,
    };
  } catch (error) {
    console.error('MTS API 호출 오류 (브랜드 메시지):', error);

    if (error instanceof TypeError) {
      return {
        success: false,
        error: '네트워크 오류: MTS API에 연결할 수 없습니다.',
        errorCode: 'NETWORK_ERROR',
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
      errorCode: 'UNKNOWN_ERROR',
    };
  }
}

/**
 * 카카오 발신프로필 카테고리 전체 조회
 * @returns 카테고리 목록
 */
export async function getMtsCategoryList(): Promise<MtsApiResult> {
  try {
    // 환경 변수 확인
    if (!MTS_AUTH_CODE) {
      return {
        success: false,
        error: 'MTS_AUTH_CODE가 설정되지 않았습니다.',
        errorCode: 'CONFIG_ERROR',
      };
    }

    // multipart/form-data로 전송하기 위한 FormData 생성
    const formData = new FormData();
    formData.append('authCode', MTS_AUTH_CODE);

    // API 호출
    const response = await fetch(`${MTS_TEMPLATE_API_URL}/mts/api/category/all`, {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    // 성공 확인 (200 코드)
    if (result.code === '200') {
      return {
        success: true,
        responseData: result,
      };
    }

    // 실패 시 에러 메시지 반환
    return {
      success: false,
      error: result.message || '카테고리 목록 조회 실패',
      errorCode: result.code,
      responseData: result,
    };
  } catch (error) {
    console.error('MTS API 호출 오류 (카테고리 조회):', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
      errorCode: 'UNKNOWN_ERROR',
    };
  }
}

/**
 * 카카오 발신프로필 인증 토큰 요청
 * @param yellowId 카카오톡 채널 ID (예: @example)
 * @param phoneNumber 관리자 전화번호
 * @returns 토큰 요청 결과
 */
export async function requestMtsSenderToken(
  yellowId: string,
  phoneNumber: string
): Promise<MtsApiResult> {
  try {
    // 환경 변수 확인
    if (!MTS_AUTH_CODE) {
      return {
        success: false,
        error: 'MTS_AUTH_CODE가 설정되지 않았습니다.',
        errorCode: 'CONFIG_ERROR',
      };
    }

    // multipart/form-data로 전송하기 위한 FormData 생성
    const formData = new FormData();
    formData.append('authCode', MTS_AUTH_CODE);
    formData.append('yellowId', yellowId);
    formData.append('phoneNumber', phoneNumber);

    // API 호출
    const response = await fetch(`${MTS_TEMPLATE_API_URL}/mts/api/sender/token`, {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    // 성공 확인 (200 코드)
    if (result.code === '200') {
      return {
        success: true,
        responseData: result,
      };
    }

    // 실패 시 에러 메시지 반환
    return {
      success: false,
      error: result.message || '인증 토큰 요청 실패',
      errorCode: result.code,
      responseData: result,
    };
  } catch (error) {
    console.error('MTS API 호출 오류 (토큰 요청):', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
      errorCode: 'UNKNOWN_ERROR',
    };
  }
}

/**
 * 카카오 발신프로필 등록
 * @param token 카카오톡으로 받은 인증 토큰
 * @param phoneNumber 관리자 전화번호
 * @param yellowId 카카오톡 채널 ID
 * @param categoryCode 카테고리 코드
 * @returns 발신프로필 등록 결과 (senderKey 포함)
 */
export async function registerMtsSenderProfile(
  token: string,
  phoneNumber: string,
  yellowId: string,
  categoryCode: string
): Promise<MtsApiResult> {
  try {
    // 환경 변수 확인
    if (!MTS_AUTH_CODE) {
      return {
        success: false,
        error: 'MTS_AUTH_CODE가 설정되지 않았습니다.',
        errorCode: 'CONFIG_ERROR',
      };
    }

    // multipart/form-data로 전송하기 위한 FormData 생성
    const formData = new FormData();
    formData.append('authCode', MTS_AUTH_CODE);
    formData.append('token', token);
    formData.append('phoneNumber', phoneNumber);
    formData.append('yellowId', yellowId);
    formData.append('categoryCode', categoryCode);

    // API 호출
    const response = await fetch(`${MTS_TEMPLATE_API_URL}/mts/api/create/new/senderKey`, {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    // 성공 확인 (200 코드)
    if (result.code === '200') {
      return {
        success: true,
        responseData: result,
      };
    }

    // 실패 시 에러 메시지 반환
    return {
      success: false,
      error: result.message || '발신프로필 등록 실패',
      errorCode: result.code,
      responseData: result,
    };
  } catch (error) {
    console.error('MTS API 호출 오류 (발신프로필 등록):', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
      errorCode: 'UNKNOWN_ERROR',
    };
  }
}

/**
 * 카카오 알림톡 템플릿 등록
 * @param templateData 템플릿 정보
 */
export async function createMtsAlimtalkTemplate(templateData: {
  senderKey: string;
  senderKeyType?: string;
  templateCode: string;
  templateName: string;
  templateContent: string;
  templateMessageType?: string;
  templateEmphasizeType?: string;
  categoryCode?: string;
  securityFlag?: string;
  buttons?: string; // JSON string
  quickReplies?: string; // JSON string
  templateExtra?: string;
  templateTitle?: string;
  templateSubtitle?: string;
  templateImageName?: string;
  templateImageUrl?: string;
  templatePreviewMessage?: string;
  templateRepresentLink?: string;
}): Promise<MtsApiResult> {
  try {
    // FormData 생성
    const formData = new FormData();
    formData.append('senderKey', templateData.senderKey);
    formData.append('senderKeyType', templateData.senderKeyType || 'S');
    formData.append('templateCode', templateData.templateCode);
    formData.append('templateName', templateData.templateName);
    formData.append('templateContent', templateData.templateContent);
    formData.append('templateMessageType', templateData.templateMessageType || 'BA');
    formData.append('templateEmphasizeType', templateData.templateEmphasizeType || 'NONE');

    // 선택적 필드 추가
    if (templateData.categoryCode) formData.append('categoryCode', templateData.categoryCode);
    if (templateData.securityFlag) formData.append('securityFlag', templateData.securityFlag);
    if (templateData.buttons) formData.append('button', templateData.buttons); // MTS API는 'button' 사용
    if (templateData.quickReplies) formData.append('quickReplies', templateData.quickReplies);
    if (templateData.templateExtra) formData.append('templateExtra', templateData.templateExtra);
    if (templateData.templateTitle) formData.append('templateTitle', templateData.templateTitle);
    if (templateData.templateSubtitle) formData.append('templateSubtitle', templateData.templateSubtitle);
    if (templateData.templateImageName) formData.append('templateImageName', templateData.templateImageName);
    if (templateData.templateImageUrl) formData.append('templateImageUrl', templateData.templateImageUrl);
    if (templateData.templatePreviewMessage) formData.append('templatePreviewMessage', templateData.templatePreviewMessage);
    if (templateData.templateRepresentLink) formData.append('templateRepresentLink', templateData.templateRepresentLink);

    // API 호출
    const response = await fetch(`${MTS_TEMPLATE_API_URL}/mts/api/create/template`, {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    // 성공 확인
    if (result.code === '200') {
      return {
        success: true,
        responseData: result.data,
      };
    }

    // 실패 시 에러 메시지 반환
    console.error('❌ 템플릿 등록 실패:', result.message);
    return {
      success: false,
      error: result.message || '템플릿 등록 실패',
      errorCode: result.code,
      responseData: result,
    };
  } catch (error) {
    console.error('MTS API 호출 오류 (템플릿 등록):', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
      errorCode: 'UNKNOWN_ERROR',
    };
  }
}

/**
 * 카카오 알림톡 템플릿 검수 요청
 * @param senderKey 발신 프로필 키
 * @param templateCode 템플릿 코드
 * @param senderKeyType 발신 프로필 타입
 */
export async function requestMtsTemplateInspection(
  senderKey: string,
  templateCode: string,
  senderKeyType: string = 'S'
): Promise<MtsApiResult> {
  try {
    // FormData 생성
    const formData = new FormData();
    formData.append('senderKey', senderKey);
    formData.append('templateCode', templateCode);
    formData.append('senderKeyType', senderKeyType);

    // API 호출
    const response = await fetch(`${MTS_TEMPLATE_API_URL}/mts/api/template/request`, {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    // 성공 확인
    if (result.code === '200') {
      return {
        success: true,
        responseData: result.data,
      };
    }

    // 실패 시 에러 메시지 반환
    return {
      success: false,
      error: result.message || '템플릿 검수 요청 실패',
      errorCode: result.code,
      responseData: result,
    };
  } catch (error) {
    console.error('MTS API 호출 오류 (템플릿 검수 요청):', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
      errorCode: 'UNKNOWN_ERROR',
    };
  }
}

/**
 * 카카오 알림톡 템플릿 삭제
 * @param senderKey 발신 프로필 키
 * @param templateCode 템플릿 코드
 * @param senderKeyType 발신 프로필 타입
 */
export async function deleteMtsAlimtalkTemplate(
  senderKey: string,
  templateCode: string,
  senderKeyType: string = 'S'
): Promise<MtsApiResult> {
  try {
    // FormData 생성
    const formData = new FormData();
    formData.append('senderKey', senderKey);
    formData.append('templateCode', templateCode);
    formData.append('senderKeyType', senderKeyType);

    // API 호출
    const response = await fetch(`${MTS_TEMPLATE_API_URL}/mts/api/delete/template`, {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    // 성공 확인
    if (result.code === '200') {
      return {
        success: true,
        responseData: result.data,
      };
    }

    // 실패 시 에러 메시지 반환
    return {
      success: false,
      error: result.message || '템플릿 삭제 실패',
      errorCode: result.code,
      responseData: result,
    };
  } catch (error) {
    console.error('MTS API 호출 오류 (템플릿 삭제):', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
      errorCode: 'UNKNOWN_ERROR',
    };
  }
}

/**
 * 네이버 톡톡 템플릿 생성
 * @param navertalkId 네이버 톡톡 회원 ID
 * @param code 템플릿 코드
 * @param text 템플릿 내용
 * @param productCode 상품 코드 (INFORMATION: 정보성, BENEFIT: 혜택형, CARDINFO: 카드알림)
 * @param categoryCode 카테고리 코드
 * @param buttons 버튼 정보 (선택, 최대 5개)
 */
export async function createNaverTalkTemplate(
  partnerKey: string,
  code: string,
  text: string,
  productCode: 'INFORMATION' | 'BENEFIT' | 'CARDINFO',
  categoryCode: string,
  buttons?: Array<{
    type: 'WEB_LINK' | 'APP_LINK';
    buttonCode: string;
    name: string;
    url?: string;
    mobileUrl?: string;
  }>
): Promise<MtsApiResult> {
  try {
    // 환경 변수 확인
    if (!MTS_API_URL) {
      return {
        success: false,
        error: 'MTS_API_URL이 설정되지 않았습니다.',
        errorCode: 'CONFIG_ERROR',
      };
    }

    // 요청 본문
    const requestBody: Record<string, unknown> = {
      productCode,
      code,
      text,
      categoryCode,
    };

    // 버튼이 있는 경우 추가
    if (buttons && buttons.length > 0) {
      requestBody.buttons = buttons;
    }

    console.log('[네이버 톡톡] 템플릿 생성 요청:', {
      partnerKey,
      code,
      text,
      textLength: text?.length || 0,
      productCode,
      categoryCode,
      buttonsCount: buttons?.length || 0,
    });

    // API 호출
    const response = await fetch(`${MTS_API_URL}/naver/v1/template/${partnerKey}/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const result = await response.json();
    console.log('[네이버 톡톡] MTS API 응답:', result);

    // 성공 확인
    if (result.success === true) {
      console.log('[네이버 톡톡] 템플릿 생성 성공:', result.templateId);
      return {
        success: true,
        responseData: result,
      };
    }

    // 실패 시 에러 메시지 반환
    console.error('[네이버 톡톡] 템플릿 생성 실패:', result.resultMessage || result.message || result);
    return {
      success: false,
      error: result.resultMessage || result.message || '네이버 톡톡 템플릿 생성 실패',
      errorCode: result.code || 'TEMPLATE_CREATE_FAILED',
      responseData: result,
    };
  } catch (error) {
    console.error('MTS API 호출 오류 (네이버 톡톡 템플릿 생성):', error);

    if (error instanceof TypeError) {
      return {
        success: false,
        error: '네트워크 오류: MTS API에 연결할 수 없습니다.',
        errorCode: 'NETWORK_ERROR',
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
      errorCode: 'UNKNOWN_ERROR',
    };
  }
}

/**
 * 카카오 브랜드 메시지 템플릿 생성
 * @param userId 사용자 ID
 * @param senderKey 발신프로필 키
 * @param senderGroupKey 발신프로필 그룹 키 (senderKey 또는 senderGroupKey 중 하나 필수)
 * @param name 템플릿 이름
 * @param chatBubbleType 메시지 타입 (TEXT, IMAGE, WIDE, WIDE_ITEM_LIST, CAROUSEL_FEED, PREMIUM_VIDEO, COMMERCE, CAROUSEL_COMMERCE)
 * @param content 템플릿 내용
 * @param adult 성인용 메시지 여부
 * @param additionalContent 템플릿 부가정보 (선택)
 * @param imageUrl 이미지 URL (선택)
 * @param imageName 이미지 파일명 (선택)
 * @param imageLink 이미지 클릭시 이동할 URL (선택)
 * @param buttons 버튼 목록 (선택)
 */
export async function createBrandTemplate(
  userId: number,
  senderKey: string | undefined,
  senderGroupKey: string | undefined,
  name: string,
  chatBubbleType: 'TEXT' | 'IMAGE' | 'WIDE' | 'WIDE_ITEM_LIST' | 'CAROUSEL_FEED' | 'PREMIUM_VIDEO' | 'COMMERCE' | 'CAROUSEL_COMMERCE',
  content: string,
  adult: boolean = false,
  additionalContent?: string,
  imageUrl?: string,
  imageName?: string,
  imageLink?: string,
  buttons?: Array<{
    name: string;
    linkType: string;
    linkMobile?: string;
    linkPc?: string;
    linkAndroid?: string;
    linkIos?: string;
    bizFormId?: number;
  }>
): Promise<MtsApiResult> {
  try {
    // 환경 변수 확인
    if (!MTS_TEMPLATE_API_URL) {
      return {
        success: false,
        error: 'MTS_TEMPLATE_API_URL이 설정되지 않았습니다.',
        errorCode: 'CONFIG_ERROR',
      };
    }

    // senderKey 또는 senderGroupKey 중 하나는 필수
    if (!senderKey && !senderGroupKey) {
      return {
        success: false,
        error: 'senderKey 또는 senderGroupKey 중 하나는 필수입니다.',
        errorCode: 'MISSING_REQUIRED_PARAM',
      };
    }

    // 요청 본문 구성
    const requestBody: Record<string, unknown> = {
      authCode: MTS_AUTH_CODE, // MTS 인증 코드 추가
      name,
      chatBubbleType,
      content,
      adult,
    };

    // senderKey 또는 senderGroupKey 추가
    if (senderKey) {
      requestBody.senderKey = senderKey;
    }
    if (senderGroupKey) {
      requestBody.senderGroupKey = senderGroupKey;
    }

    // 선택적 필드 추가
    if (additionalContent) {
      requestBody.additionalContent = additionalContent;
    }
    if (imageUrl) {
      requestBody.imageUrl = imageUrl;
    }
    if (imageName) {
      requestBody.imageName = imageName;
    }
    if (imageLink) {
      requestBody.imageLink = imageLink;
    }
    if (buttons && buttons.length > 0) {
      requestBody.buttons = buttons;
    }

    console.log('[브랜드 메시지] 템플릿 생성 요청:', {
      name,
      chatBubbleType,
      senderKey,
      senderGroupKey,
      buttonsCount: buttons?.length || 0,
    });

    // API 호출
    const response = await fetch(`${MTS_TEMPLATE_API_URL}/mts/api/direct/create/template`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    // 응답 상태 로깅
    console.log('[브랜드 메시지] API 응답 상태:', response.status);

    // HTML 응답 체크
    const contentType = response.headers.get('content-type');
    console.log('[브랜드 메시지] Content-Type:', contentType);

    if (contentType && contentType.includes('text/html')) {
      const htmlText = await response.text();
      console.error('[브랜드 메시지] HTML 응답 받음 (처음 500자):', htmlText.substring(0, 500));
      return {
        success: false,
        error: '브랜드 메시지 템플릿 생성 API가 올바르지 않습니다. MTS에서 브랜드 메시지 권한을 확인해주세요.',
        errorCode: 'INVALID_API_RESPONSE',
      };
    }

    const result = await response.json();

    // 성공 확인 (code: "200")
    if (result.code === '200') {
      console.log('[브랜드 메시지] 템플릿 생성 성공:', result.data);

      // Supabase에 템플릿 저장
      try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const templateData = result.data;

        // 템플릿 데이터를 DB에 저장
        const { error: dbError } = await supabase
          .from('kakao_brand_templates')
          .insert({
            user_id: userId,
            sender_key: senderKey || templateData.senderKey,
            sender_group_key: senderGroupKey,
            template_code: templateData.code,
            template_name: templateData.name,
            content: templateData.content,
            chat_bubble_type: templateData.chatBubbleType,
            status: templateData.status,
            buttons: templateData.buttons || buttons,
            additional_content: additionalContent,
            image_url: imageUrl,
            image_name: imageName,
            image_link: imageLink,
            adult: templateData.adult,
            modified_at: templateData.modifiedAt ? new Date(templateData.modifiedAt) : null,
            synced_at: new Date(),
          });

        if (dbError) {
          console.error('[브랜드 메시지] DB 저장 오류:', dbError);
          // DB 저장 실패해도 MTS API 성공이므로 성공으로 처리
        } else {
          console.log('[브랜드 메시지] DB 저장 성공');
        }
      } catch (dbError) {
        console.error('[브랜드 메시지] DB 저장 예외:', dbError);
        // DB 저장 실패해도 MTS API 성공이므로 성공으로 처리
      }

      return {
        success: true,
        responseData: result,
      };
    }

    // 실패 시 에러 메시지 반환
    console.error('[브랜드 메시지] 템플릿 생성 실패:', result.message);
    return {
      success: false,
      error: result.message || '카카오 브랜드 메시지 템플릿 생성 실패',
      errorCode: result.code || 'TEMPLATE_CREATE_FAILED',
      responseData: result,
    };
  } catch (error) {
    console.error('MTS API 호출 오류 (브랜드 메시지 템플릿 생성):', error);

    if (error instanceof TypeError) {
      return {
        success: false,
        error: '네트워크 오류: MTS API에 연결할 수 없습니다.',
        errorCode: 'NETWORK_ERROR',
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
      errorCode: 'UNKNOWN_ERROR',
    };
  }
}

/**
 * 카카오 브랜드 메시지 템플릿 상세 조회
 * @param templateCode 템플릿 코드
 * @returns 템플릿 상세 정보
 */
export async function getMtsBrandTemplate(templateCode: string): Promise<MtsApiResult> {
  try {
    // 환경 변수 확인
    if (!MTS_AUTH_CODE) {
      return {
        success: false,
        error: 'MTS_AUTH_CODE가 설정되지 않았습니다.',
        errorCode: 'CONFIG_ERROR',
      };
    }

    if (!MTS_TEMPLATE_API_URL) {
      return {
        success: false,
        error: 'MTS_TEMPLATE_API_URL이 설정되지 않았습니다.',
        errorCode: 'CONFIG_ERROR',
      };
    }

    // 요청 본문
    const requestBody = {
      authCode: MTS_AUTH_CODE,
      code: templateCode,
    };

    console.log('[브랜드 템플릿 조회] MTS API 요청:', {
      endpoint: `${MTS_TEMPLATE_API_URL}/mts/api/direct/state/template`,
      templateCode,
    });

    // API 호출
    const response = await fetch(`${MTS_TEMPLATE_API_URL}/mts/api/direct/state/template`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify(requestBody),
    });

    const result = await response.json();
    console.log('[브랜드 템플릿 조회] MTS API 응답:', {
      code: result.code,
      message: result.message,
      hasData: !!result.data,
    });

    // 성공 확인
    if (result.code === '200' && result.data) {
      return {
        success: true,
        responseData: result.data,
      };
    }

    // 실패 시 에러 메시지 반환
    console.error('[브랜드 템플릿 조회] 실패:', {
      code: result.code,
      message: result.message,
    });
    return {
      success: false,
      error: result.message || '브랜드 템플릿 조회 실패',
      errorCode: result.code,
      responseData: result,
    };
  } catch (error) {
    console.error('MTS API 호출 오류 (브랜드 템플릿 조회):', error);

    if (error instanceof TypeError) {
      return {
        success: false,
        error: '네트워크 오류: MTS API에 연결할 수 없습니다.',
        errorCode: 'NETWORK_ERROR',
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
      errorCode: 'UNKNOWN_ERROR',
    };
  }
}

/**
 * 브랜드 메시지 발송 결과 조회
 * @param senderKey 발신 프로필 키
 * @param sendDate 발송 일자 (YYYYMMDD 형식, 최소 8자리)
 * @param page 페이지 번호 (기본값: 1)
 * @param count 페이지당 건수 (기본값: 1000)
 * @returns 발송 결과 목록
 */
export async function getBrandMessageResult(
  senderKey: string,
  sendDate: string,
  page: number = 1,
  count: number = 1000
): Promise<MtsApiResult> {
  try {
    // 환경 변수 확인
    if (!MTS_AUTH_CODE) {
      return {
        success: false,
        error: 'MTS_AUTH_CODE가 설정되지 않았습니다.',
        errorCode: 'CONFIG_ERROR',
      };
    }

    // 요청 본문
    const requestBody = {
      auth_code: MTS_AUTH_CODE,
      sender_key: senderKey,
      send_date: sendDate,
      page,
      count,
    };

    console.log('[브랜드 메시지 결과 조회] MTS API 요청:', {
      endpoint: `${MTS_API_URL}/btalk/resp/messages`,
      senderKey,
      sendDate,
      page,
      count,
    });

    // API 호출
    const response = await fetch(`${MTS_API_URL}/btalk/resp/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify(requestBody),
    });

    const result = await response.json();
    console.log('[브랜드 메시지 결과 조회] MTS API 응답:', {
      code: result.code,
      message: result.message,
      dataCount: result.data?.length || 0,
      receivedAt: result.received_at,
    });

    // 성공 확인 (0000: 성공)
    if (result.code === '0000') {
      return {
        success: true,
        responseData: result,
      };
    }

    // 실패 시 에러 메시지 반환
    console.error('[브랜드 메시지 결과 조회] 실패:', {
      code: result.code,
      message: result.message,
    });
    return {
      success: false,
      error: getErrorMessage(result.code) || result.message || '브랜드 메시지 결과 조회 실패',
      errorCode: result.code,
      responseData: result,
    };
  } catch (error) {
    console.error('MTS API 호출 오류 (브랜드 메시지 결과 조회):', error);

    if (error instanceof TypeError) {
      return {
        success: false,
        error: '네트워크 오류: MTS API에 연결할 수 없습니다.',
        errorCode: 'NETWORK_ERROR',
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
      errorCode: 'UNKNOWN_ERROR',
    };
  }
}
