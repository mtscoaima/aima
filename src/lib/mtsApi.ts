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

// MTS API 설정
const MTS_AUTH_CODE = process.env.MTS_AUTH_CODE;
const MTS_API_URL = process.env.MTS_API_URL || 'https://api.mtsco.co.kr';
const MTS_TEMPLATE_API_URL = process.env.MTS_TEMPLATE_API_URL || 'https://talks.mtsco.co.kr';

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
 * SMS 발송 (90바이트 이하, 자동으로 SMS/LMS 판단)
 * @param toNumber 수신번호 (하이픈 없이)
 * @param message 메시지 내용
 * @param callbackNumber 발신번호 (하이픈 없이)
 * @param subject 제목 (LMS용, 선택)
 * @param sendDate 예약 발송 시간 (YYYYMMDDHHmmss 형식, 선택)
 */
export async function sendMtsSMS(
  toNumber: string,
  message: string,
  callbackNumber: string,
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

    // 요청 본문
    const requestBody: Record<string, string> = {
      auth_code: MTS_AUTH_CODE,
      callback_number: cleanCallbackNumber,
      phone_number: cleanToNumber,
      message: message,
    };

    // 제목이 있으면 추가 (LMS용)
    if (subject) {
      requestBody.subject = subject;
    }

    // 예약 발송 시간이 있으면 추가
    if (sendDate) {
      requestBody.send_date = sendDate;
    }

    // API 호출
    const response = await fetch(`${MTS_API_URL}/sndng/sms/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify(requestBody),
    });

    const result = await response.json();

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
    const response = await fetch(`${MTS_API_URL}/sndng/atk/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify(requestBody),
    });

    const result = await response.json();

    // 성공 확인 (1000: 알림톡 성공)
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
      error: getErrorMessage(result.code) || result.message || '알림톡 발송 실패',
      errorCode: result.code,
      responseData: result,
    };
  } catch (error) {
    console.error('MTS API 호출 오류 (알림톡):', error);

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
  messageType: 'FT' | 'FI' | 'FW' | 'FL' | 'FC' = 'FT',
  adFlag: 'Y' | 'N' = 'N',
  imageUrls?: string[],
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
      phone_number: cleanToNumber,
      message: message,
      messageType: messageType,
      ad_flag: adFlag,
      callback_number: cleanCallbackNumber,
    };

    // 첨부 파일 (이미지, 버튼) 추가
    if (imageUrls || buttons) {
      const attachment: Record<string, unknown> = {};

      if (imageUrls && imageUrls.length > 0) {
        attachment.image = imageUrls.map(url => ({ img_url: url }));
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
    const response = await fetch(`${MTS_API_URL}/v2/sndng/ftk/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify(requestBody),
    });

    const result = await response.json();

    // 성공 확인 (1000: 친구톡 성공)
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
      error: getErrorMessage(result.code) || result.message || '친구톡 발송 실패',
      errorCode: result.code,
      responseData: result,
    };
  } catch (error) {
    console.error('MTS API 호출 오류 (친구톡 V2):', error);

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
 */
export async function getMtsAlimtalkTemplate(
  senderKey: string,
  templateCode: string
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
      template_code: templateCode,
    };

    // API 호출
    const response = await fetch(`${MTS_TEMPLATE_API_URL}/kakaoTalk/atk/getTemplate`, {
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
