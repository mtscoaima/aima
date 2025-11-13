import { NextRequest, NextResponse } from 'next/server';
import { validateAuthWithSuccess } from '@/utils/authUtils';
import { sendMtsFriendtalk, convertToMtsDateFormat } from '@/lib/mtsApi';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * 카카오 친구톡 V2 발송 API
 * POST /api/messages/kakao/friendtalk/send
 *
 * Request Body:
 * {
 *   senderKey: string;                // 발신 프로필 키
 *   recipients: Array<{               // 수신자 목록
 *     phone_number: string;
 *     name?: string;
 *   }>;
 *   message: string;                  // 메시지 내용
 *   callbackNumber: string;           // 발신번호
 *   messageType: 'FT'|'FI'|'FW'|'FL'|'FC'; // 메시지 타입
 *   adFlag: 'Y'|'N';                  // 광고 여부
 *   imageUrls?: string[];             // 이미지 URL 배열 (선택)
 *   imageLink?: string;               // 이미지 클릭 링크 (선택, FI/FW 타입)
 *   buttons?: Array<{                 // 버튼 (선택, FT/FI/FW/FL만)
 *     name: string;
 *     type: string;
 *     url_mobile?: string;
 *     url_pc?: string;
 *   }>;
 *   tranType?: 'SMS'|'LMS'|'MMS';     // 전환 발송 타입 (선택)
 *   tranMessage?: string;             // 전환 발송 메시지 (선택)
 *   scheduledAt?: string;             // 예약 발송 시간 (yyyy-MM-dd HH:mm 형식, 선택)
 *   // FL (와이드 아이템 리스트형) 타입 전용 필드
 *   headerText?: string;              // 헤더 (필수, 최대 20자)
 *   listItems?: Array<{               // 아이템 리스트 (필수, 3-4개)
 *     title: string;                  // 아이템 제목 (최대 25자, 줄바꿈 1개)
 *     image?: { fileId, fileName, fileSize, preview };
 *   }>;
 *   // FC (캐러셀형) 타입 전용 필드
 *   carousels?: Array<{               // 캐러셀 리스트 (필수, 2-6개)
 *     content: string;                // 캐러셀 내용 (최대 180자, 줄바꿈 2개)
 *     image?: { fileId, fileName, fileSize, preview };
 *     buttons: Array<{                // 캐러셀별 버튼 (1-2개)
 *       name: string;
 *       type: string;
 *       url_mobile?: string;
 *       url_pc?: string;
 *     }>;
 *   }>;
 *   moreLink?: string;                // 더보기 링크 (선택)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // JWT 인증 확인
    const authResult = validateAuthWithSuccess(request);
    if (!authResult.isValid || !authResult.userInfo) {
      return authResult.errorResponse;
    }

    const { userId } = authResult.userInfo;
    const body = await request.json();

    // 필수 파라미터 검증
    const {
      senderKey,
      recipients,
      message,
      callbackNumber,
      messageType,
      adFlag,
      imageUrls,
      imageLink,
      buttons,
      tranType,
      tranMessage,
      scheduledAt,
      // FW/FL/FC 타입 전용 필드
      headerText,
      listItems,
      carousels,
      moreLink,
    } = body;

    if (!senderKey) {
      return NextResponse.json(
        { error: '발신 프로필 키가 필요합니다.' },
        { status: 400 }
      );
    }

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json(
        { error: '수신자 목록이 필요합니다.' },
        { status: 400 }
      );
    }

    // FT/FI/FW 타입만 message 필드 필수 (FL/FC는 자체 필드 사용)
    if (messageType !== 'FL' && messageType !== 'FC' && !message) {
      return NextResponse.json(
        { error: '메시지 내용이 필요합니다.' },
        { status: 400 }
      );
    }

    if (!callbackNumber) {
      return NextResponse.json(
        { error: '발신번호가 필요합니다.' },
        { status: 400 }
      );
    }

    // 메시지 타입이 제공된 경우에만 유효성 검사
    if (messageType && !['FT', 'FI', 'FW', 'FL', 'FC'].includes(messageType)) {
      return NextResponse.json(
        { error: '메시지 타입이 올바르지 않습니다. (FT, FI, FW, FL, FC 중 하나)' },
        { status: 400 }
      );
    }

    if (!adFlag || !['Y', 'N'].includes(adFlag)) {
      return NextResponse.json(
        { error: '광고 여부가 올바르지 않습니다. (Y 또는 N)' },
        { status: 400 }
      );
    }

    // FL 타입 검증
    if (messageType === 'FL') {
      if (!headerText || headerText.trim().length === 0) {
        return NextResponse.json(
          { error: 'FL 타입은 헤더가 필요합니다.' },
          { status: 400 }
        );
      }
      if (!listItems || !Array.isArray(listItems) || listItems.length < 3 || listItems.length > 4) {
        return NextResponse.json(
          { error: 'FL 타입은 아이템 리스트가 3-4개 필요합니다.' },
          { status: 400 }
        );
      }
    }

    // FC 타입 검증
    if (messageType === 'FC') {
      if (!carousels || !Array.isArray(carousels) || carousels.length < 2 || carousels.length > 6) {
        return NextResponse.json(
          { error: 'FC 타입은 캐러셀이 2-6개 필요합니다.' },
          { status: 400 }
        );
      }
    }

    // 예약 발송 시간 변환 (있는 경우)
    const sendDate = scheduledAt ? convertToMtsDateFormat(scheduledAt) : undefined;

    // 발송 결과 저장
    const results = [];
    let successCount = 0;
    let failCount = 0;

    // 각 수신자에게 발송
    for (const recipient of recipients) {
      try {
        const phoneNumber = recipient.phone_number;
        const name = recipient.name || null;

        // MTS API 호출 직전 로그
        console.log('=== [API Route] MTS 친구톡 발송 요청 ===');
        console.log('senderKey:', senderKey);
        console.log('messageType:', messageType);
        console.log('recipient:', phoneNumber);
        console.log('message:', message);
        console.log('buttons:', buttons);
        console.log('imageUrls:', imageUrls);
        console.log('imageLink:', imageLink);
        console.log('adFlag:', adFlag);
        console.log('headerText:', headerText);
        console.log('listItems:', listItems);
        console.log('carousels:', carousels);
        console.log('moreLink:', moreLink);
        console.log('=====================================');

        const result = await sendMtsFriendtalk(
          senderKey,
          phoneNumber,
          message,
          callbackNumber,
          messageType,
          adFlag,
          imageUrls,
          imageLink,
          buttons,
          tranType,
          tranMessage,
          sendDate,
          // FW/FL/FC 타입 전용 필드
          headerText,
          listItems,
          carousels,
          moreLink
        );

        // MTS API 응답 로그
        console.log('=== [API Route] MTS API 응답 ===');
        console.log('result:', JSON.stringify(result, null, 2));
        console.log('================================');

        if (result.success) {
          successCount++;
        } else {
          failCount++;
        }

        results.push({
          recipient: phoneNumber,
          success: result.success,
          msgId: result.msgId,
          error: result.error,
          errorCode: result.errorCode,
        });

        // DB에 발송 이력 저장
        const { error: dbError } = await supabase.from('message_logs').insert({
          user_id: userId,
          to_number: phoneNumber,
          to_name: name,
          message_content: message,
          subject: null,
          message_type: 'KAKAO_FRIENDTALK',
          sent_at: result.success ? new Date().toISOString() : null,
          status: result.success ? 'sent' : 'failed',
          error_message: result.error || null,
          credit_used: result.success ? 20 : 0, // 친구톡 기본 단가 20원
          metadata: {
            sender_key: senderKey,
            callback_number: callbackNumber,
            message_type: messageType,
            ad_flag: adFlag,
            image_urls: imageUrls,
            image_link: imageLink,
            buttons: buttons,
            tran_type: tranType,
            tran_message: tranMessage,
            scheduled_at: scheduledAt,
            mts_msg_id: result.msgId,
            // FW/FL/FC 타입 전용 필드
            header_text: headerText,
            list_items: listItems,
            carousels: carousels,
            more_link: moreLink,
          },
        });

        if (dbError) {
          console.error(`DB 저장 실패 (${phoneNumber}):`, dbError);
        }
      } catch (error) {
        const phoneNumber = recipient.phone_number;
        failCount++;
        console.error(`예외 발생 (수신자: ${phoneNumber}):`, error);
        results.push({
          recipient: phoneNumber,
          success: false,
          error: error instanceof Error ? error.message : '알 수 없는 오류',
        });
      }
    }

    // 사용자 잔액 차감 (성공한 건수만)
    if (successCount > 0) {
      // 친구톡 단가 (기본 20원)
      const unitPrice = 20;
      const totalCost = successCount * unitPrice;

      // 트랜잭션 생성 (amount는 양수로 저장, UI에서 type='usage'일 때 - 표시)
      const { error: transError } = await supabase.from('transactions').insert({
        user_id: userId,
        type: 'usage',
        amount: totalCost, // 양수로 저장
        description: `카카오 친구톡 발송 (${successCount}건)`,
        reference_id: results.filter(r => r.success).map(r => r.msgId).join(','),
        metadata: {
          message_type: 'FRIENDTALK',
          recipient_count: successCount,
          unit_price: unitPrice,
          message_type_detail: messageType,
          ad_flag: adFlag,
        },
        status: 'completed',
      });

      if (transError) {
        console.error('트랜잭션 생성 실패:', transError);
      }
    }

    // 응답 반환
    return NextResponse.json({
      success: true,
      totalCount: recipients.length,
      successCount,
      failCount,
      results,
    });
  } catch (error) {
    console.error('친구톡 발송 API 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
