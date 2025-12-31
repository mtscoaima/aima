/**
 * 발송 결과 조회 API (Polling 방식)
 * GET /api/delivery-results
 * 
 * Query Parameters:
 * - sendRequestId: 발송 의뢰 ID (필수)
 * 
 * MTS 응답요청 API를 호출하여 발송 결과를 조회하고 DB를 업데이트합니다.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  getAlimtalkResults,
  getSmsResults,
  getMmsResults,
  getBrandMessageResult,
  getDeliveryStatusFromResultCode,
  getResultCodeDescription,
} from '@/lib/mtsApi';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * JWT 토큰에서 사용자 ID 추출
 */
function getUserIdFromToken(token: string): number | null {
  try {
    const payload = JSON.parse(
      Buffer.from(token.split('.')[1], 'base64').toString()
    );
    return payload.userId || null;
  } catch {
    return null;
  }
}

/**
 * 날짜를 YYYYMMDD 형식으로 변환
 */
function formatDateToYYYYMMDD(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

/**
 * MTS 응답 데이터에서 전화번호로 매칭
 */
function normalizePhoneNumber(phone: string): string {
  return phone.replace(/[^0-9]/g, '');
}

export async function GET(request: NextRequest) {
  try {
    // 1. JWT 인증
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: '인증이 필요합니다' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const userId = getUserIdFromToken(token);

    if (!userId) {
      return NextResponse.json(
        { error: '유효하지 않은 토큰입니다' },
        { status: 401 }
      );
    }

    // 2. 쿼리 파라미터
    const { searchParams } = new URL(request.url);
    const sendRequestId = searchParams.get('sendRequestId');

    if (!sendRequestId) {
      return NextResponse.json(
        { error: 'sendRequestId가 필요합니다' },
        { status: 400 }
      );
    }

    // 3. 발송 의뢰 조회
    const { data: sendRequest, error: requestError } = await supabase
      .from('send_requests')
      .select('*')
      .eq('id', sendRequestId)
      .eq('user_id', userId)
      .single();

    if (requestError || !sendRequest) {
      return NextResponse.json(
        { error: '발송 의뢰를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // 4. 해당 발송 의뢰의 메시지 로그 조회
    const { data: messageLogs, error: logsError } = await supabase
      .from('message_logs')
      .select('*')
      .eq('send_request_id', sendRequestId);

    if (logsError) {
      console.error('메시지 로그 조회 오류:', logsError);
      return NextResponse.json(
        { error: '메시지 로그 조회에 실패했습니다' },
        { status: 500 }
      );
    }

    if (!messageLogs || messageLogs.length === 0) {
      return NextResponse.json({
        success: true,
        message: '메시지 로그가 없습니다',
        updated: 0,
      });
    }

    // 5. 발송 일자 추출 (created_at에서)
    const sendDate = formatDateToYYYYMMDD(new Date(sendRequest.created_at));
    const channelType = sendRequest.channel_type;

    // 6. MTS 응답요청 API 호출
    let mtsResults: Array<{
      phone_number: string;
      result_code: string;
      result_date?: string;
      real_send_date?: string;
      [key: string]: unknown;
    }> = [];

    console.log(`[delivery-results] 발송일: ${sendDate}, 채널: ${channelType}, 메시지 수: ${messageLogs.length}`);

    try {
      if (channelType === 'KAKAO_ALIMTALK') {
        // 알림톡: sender_key 필요
        const senderKey = sendRequest.metadata?.sender_key;
        if (senderKey) {
          const result = await getAlimtalkResults(senderKey, sendDate);
          if (result.success && result.responseData?.data) {
            mtsResults = result.responseData.data as typeof mtsResults;
          }
        }
      } else if (channelType === 'KAKAO_BRAND') {
        // 브랜드메시지: sender_key 필요
        const senderKey = sendRequest.metadata?.sender_key;
        if (senderKey) {
          const result = await getBrandMessageResult(senderKey, sendDate);
          if (result.success && result.responseData?.data) {
            mtsResults = result.responseData.data as typeof mtsResults;
          }
        }
      } else if (channelType === 'SMS') {
        // SMS
        console.log(`[delivery-results] SMS 결과 조회 시작 - sendDate: ${sendDate}`);
        const result = await getSmsResults(sendDate);
        console.log(`[delivery-results] SMS 결과:`, JSON.stringify(result, null, 2));
        if (result.success && result.responseData?.data) {
          mtsResults = result.responseData.data as typeof mtsResults;
        }
      } else if (channelType === 'LMS' || channelType === 'MMS') {
        // MMS/LMS
        const result = await getMmsResults(sendDate);
        if (result.success && result.responseData?.data) {
          mtsResults = result.responseData.data as typeof mtsResults;
        }
      }
    } catch (apiError) {
      console.error('MTS API 호출 오류:', apiError);
      // API 오류가 나도 기존 데이터는 반환
    }

    // 7. 전화번호로 매칭하여 결과 업데이트
    let updatedCount = 0;

    for (const log of messageLogs) {
      // 이미 결과가 확인된 경우 스킵
      if (log.delivery_status === 'delivered' || log.delivery_status === 'failed') {
        continue;
      }

      const normalizedLogPhone = normalizePhoneNumber(log.to_number);
      
      // MTS 결과에서 매칭되는 전화번호 찾기
      const matchedResult = mtsResults.find(r => {
        const normalizedResultPhone = normalizePhoneNumber(r.phone_number);
        return normalizedResultPhone === normalizedLogPhone ||
               normalizedResultPhone.endsWith(normalizedLogPhone) ||
               normalizedLogPhone.endsWith(normalizedResultPhone);
      });

      if (matchedResult && matchedResult.result_code) {
        const deliveryStatus = getDeliveryStatusFromResultCode(matchedResult.result_code);
        const resultMessage = getResultCodeDescription(matchedResult.result_code);
        
        // delivered_at 파싱 (result_date 또는 real_send_date 사용)
        let deliveredAt: string | null = null;
        const resultDateStr = matchedResult.result_date || matchedResult.real_send_date;
        if (resultDateStr && typeof resultDateStr === 'string') {
          // YYYYMMDDHHMMSS 형식을 ISO 형식으로 변환
          if (resultDateStr.length >= 14) {
            const year = resultDateStr.substring(0, 4);
            const month = resultDateStr.substring(4, 6);
            const day = resultDateStr.substring(6, 8);
            const hour = resultDateStr.substring(8, 10);
            const minute = resultDateStr.substring(10, 12);
            const second = resultDateStr.substring(12, 14);
            deliveredAt = `${year}-${month}-${day}T${hour}:${minute}:${second}+09:00`;
          }
        }

        // 개별 업데이트 실행
        await supabase
          .from('message_logs')
          .update({
            delivery_status: deliveryStatus,
            result_code: matchedResult.result_code,
            result_message: resultMessage,
            delivered_at: deliveredAt,
            result_checked_at: new Date().toISOString(),
          })
          .eq('id', log.id);

        updatedCount++;
      }
    }

    // 8. 업데이트된 메시지 로그 다시 조회
    const { data: updatedLogs } = await supabase
      .from('message_logs')
      .select('*')
      .eq('send_request_id', sendRequestId)
      .order('sent_at', { ascending: false });

    // 9. 통계 계산
    const stats = {
      total: updatedLogs?.length || 0,
      delivered: updatedLogs?.filter(l => l.delivery_status === 'delivered').length || 0,
      failed: updatedLogs?.filter(l => l.delivery_status === 'failed').length || 0,
      pending: updatedLogs?.filter(l => l.delivery_status === 'pending').length || 0,
      unknown: updatedLogs?.filter(l => l.delivery_status === 'unknown').length || 0,
    };

    // 10. send_requests 테이블의 success_count, fail_count 업데이트
    await supabase
      .from('send_requests')
      .update({
        success_count: stats.delivered,
        fail_count: stats.failed,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sendRequestId);

    return NextResponse.json({
      success: true,
      message: `${updatedCount}건의 결과가 업데이트되었습니다`,
      updated: updatedCount,
      stats,
      messages: updatedLogs,
    });

  } catch (error) {
    console.error('발송 결과 조회 API 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

