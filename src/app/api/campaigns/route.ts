import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";

// Supabase 클라이언트 생성 (서버 사이드용 Service Role Key 사용)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface CreateCampaignRequest {
  title?: string;
  content: string;
  imageUrl: string;
  adMedium: "naver_talktalk" | "sms";
  sendPolicy: "realtime" | "batch";
  validityStartDate?: string;
  validityEndDate?: string;
  scheduledSendDate?: string; // 일괄 발송 날짜
  scheduledSendTime?: string; // 일괄 발송 시간
  maxRecipients: string;
  targetCount?: number; // 타겟 대상자 수
  existingTemplateId?: number; // 기존 템플릿 ID (템플릿 사용하기로 온 경우)
  // templateTitle 제거됨 - template_id로 대체 가능
  buttons?: {
    id: string;
    text: string;
    linkType: 'web' | 'app';
    url?: string;
    iosUrl?: string;
    androidUrl?: string;
  }[]; // 동적 버튼 데이터
  genderRatio?: {
    female: number;
    male: number;
  }; // 성별 비율 데이터
  desiredRecipients?: string | null; // 희망 수신자 직접 입력
  targetFilters: {
    gender: string;
    ageGroup: string;
    location: {
      city: string;
      district: string;
    };
    cardAmount: string;
    cardTime: {
      startTime: string;
      endTime: string;
      period: string;
    };
  };
  estimatedCost: number;
  templateDescription?: string; // 설명 템트
}

export async function POST(request: NextRequest) {
  try {
    // Authorization 헤더에서 토큰 추출
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, message: "인증 토큰이 필요합니다." },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // JWT 토큰 검증
    let decodedToken: { userId: string };
    try {
      decodedToken = jwt.verify(token, process.env.JWT_SECRET!) as {
        userId: string;
      };
    } catch {
      return NextResponse.json(
        { success: false, message: "유효하지 않은 토큰입니다." },
        { status: 401 }
      );
    }

    const userId = decodedToken.userId;

    // 사용자 존재 확인
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, name, role, approval_status")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, message: "사용자를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    if (user.role !== "USER" && user.role !== "ADVERTISER") {
      return NextResponse.json(
        { success: false, message: "캠페인 생성 권한이 없습니다." },
        { status: 403 }
      );
    }

    // 요청 본문 파싱
    const campaignData: CreateCampaignRequest = await request.json();

    // 필수 필드 검증
    if (
      !campaignData.content ||
      !campaignData.imageUrl ||
      !campaignData.sendPolicy ||
      !campaignData.adMedium
    ) {
      return NextResponse.json(
        { success: false, message: "필수 정보가 누락되었습니다." },
        { status: 400 }
      );
    }

    // 예상 비용 계산
    const campaignCost = campaignData.estimatedCost || 0;

    // 사용 가능한 크레딧 확인
    const { data: balanceData, error: balanceError } = await supabase
      .from("user_balances")
      .select("current_balance")
      .eq("user_id", userId)
      .single();

    if (balanceError) {
      console.error("잔액 조회 오류:", balanceError);
      return NextResponse.json(
        { success: false, message: "잔액 조회에 실패했습니다." },
        { status: 500 }
      );
    }

    const currentBalance = balanceData?.current_balance || 0;

    // 예약 크레딧 계산
    const { data: reserveData, error: reserveError } = await supabase
      .from("transactions")
      .select("amount")
      .eq("user_id", userId)
      .eq("type", "reserve")
      .eq("status", "completed");

    if (reserveError) {
      console.error("예약 크레딧 조회 오류:", reserveError);
      return NextResponse.json(
        { success: false, message: "예약 크레딧 조회에 실패했습니다." },
        { status: 500 }
      );
    }

    const reserveTotal =
      reserveData?.reduce((sum, t) => sum + t.amount, 0) || 0;

    // 예약 해제 크레딧 계산
    const { data: unreserveData, error: unreserveError } = await supabase
      .from("transactions")
      .select("amount")
      .eq("user_id", userId)
      .eq("type", "unreserve")
      .eq("status", "completed");

    if (unreserveError) {
      console.error("예약 해제 크레딧 조회 오류:", unreserveError);
      return NextResponse.json(
        { success: false, message: "예약 해제 크레딧 조회에 실패했습니다." },
        { status: 500 }
      );
    }

    const unreserveTotal =
      unreserveData?.reduce((sum, t) => sum + t.amount, 0) || 0;
    const reservedAmount = Math.max(0, reserveTotal - unreserveTotal);
    const availableBalance = currentBalance - reservedAmount;

    // 사용 가능한 크레딧 부족 검증
    if (availableBalance < campaignCost) {
      return NextResponse.json(
        {
          success: false,
          message: `사용 가능한 크레딧이 부족합니다. 예약된 크레딧: ${reservedAmount.toLocaleString()}원, 사용 가능한 크레딧: ${availableBalance.toLocaleString()}원`,
        },
        { status: 400 }
      );
    }

    // 현재 시간 (KST)
    const now = new Date();
    const kstTime = new Date(now.getTime() + 9 * 60 * 60 * 1000).toISOString();

    let messageTemplate;

    // 기존 템플릿 ID가 있으면 기존 템플릿 사용, 없으면 새로운 템플릿 생성
    if (campaignData.existingTemplateId) {
      // 기존 템플릿 사용
      const { data: existingTemplate, error: existingTemplateError } =
        await supabase
          .from("message_templates")
          .select("*")
          .eq("id", campaignData.existingTemplateId)
          .single();

      if (existingTemplateError || !existingTemplate) {
        return NextResponse.json(
          { success: false, message: "기존 템플릿을 찾을 수 없습니다." },
          { status: 404 }
        );
      }

      messageTemplate = existingTemplate;

      // 기존 템플릿의 사용 횟수 증가
      await supabase
        .from("message_templates")
        .update({ usage_count: (existingTemplate.usage_count || 0) + 1 })
        .eq("id", campaignData.existingTemplateId);
    } else {
      // 새로운 템플릿 생성
      const templateData = {
        user_id: userId,
        name: campaignData.title || "AI 생성 캠페인",
        content: campaignData.content,
        image_url: campaignData.imageUrl,
        category: "AI_GENERATED",
        is_ai_generated: true,
        ai_model: "gpt-4",
        is_active: true,
        usage_count: 0,
        created_at: kstTime,
        updated_at: kstTime,
        is_private: false,
      };

      const { data: newTemplate, error: templateError } = await supabase
        .from("message_templates")
        .insert(templateData)
        .select()
        .single();

      if (templateError) {
        return NextResponse.json(
          { success: false, message: "템플릿 저장에 실패했습니다." },
          { status: 500 }
        );
      }

      messageTemplate = newTemplate;
    }

    // 타겟 조건 및 추가 설정을 포함한 JSON 데이터 준비
    const targetCriteria = {
      ...campaignData.targetFilters,
      sendPolicy: campaignData.sendPolicy,
      validityStartDate: campaignData.validityStartDate,
      validityEndDate: campaignData.validityEndDate,
      scheduledSendDate: campaignData.scheduledSendDate,
      scheduledSendTime: campaignData.scheduledSendTime,
      targetCount: campaignData.targetCount,
      maxRecipients: parseInt(campaignData.maxRecipients) || 30,
      templateId: messageTemplate.id, // 템플릿 ID 저장
      templateTitle: campaignData.title || messageTemplate.name, // 템플릿 제목 저장
    };

    // getFirstSentence 함수 제거됨 - description 필드 사용 안함

    // 발송 시작 날짜 결정 (실시간: validityStartDate, 일괄: scheduledSendDate)
    let scheduleStartDate = null;
    if (
      campaignData.sendPolicy === "realtime" &&
      campaignData.validityStartDate
    ) {
      scheduleStartDate = new Date(
        campaignData.validityStartDate
      ).toISOString();
    } else if (
      campaignData.sendPolicy === "batch" &&
      campaignData.scheduledSendDate
    ) {
      scheduleStartDate = new Date(
        campaignData.scheduledSendDate
      ).toISOString();
    }

    // 발송 종료 날짜 결정 (실시간 발송만, 일괄 발송은 당일 완료)
    let scheduleEndDate = null;
    if (
      campaignData.sendPolicy === "realtime" &&
      campaignData.validityEndDate
    ) {
      scheduleEndDate = new Date(campaignData.validityEndDate).toISOString();
    } else if (
      campaignData.sendPolicy === "batch" &&
      campaignData.scheduledSendDate
    ) {
      // 일괄 발송은 같은 날에 완료
      scheduleEndDate = new Date(campaignData.scheduledSendDate).toISOString();
    }

    // 캠페인 데이터 준비 (실제 스키마에 맞게)
    const campaign = {
      user_id: userId,
      name: campaignData.title || messageTemplate.name, // 템플릿의 제목 사용
      // description 필드 제거됨 - 템플릿에서 자동 생성 가능
      template_id: messageTemplate.id, // 템플릿 ID 추가
      status: "DRAFT", // 임시 저장 상태
      total_recipients: parseInt(campaignData.maxRecipients) || 30,
      sent_count: 0, // 기본값
      success_count: 0, // 기본값
      failed_count: 0, // 기본값
      budget: campaignData.estimatedCost || 0,
      target_criteria: targetCriteria,
      message_template: campaignData.content,
      schedule_start_date: scheduleStartDate,
      schedule_end_date: scheduleEndDate,
      schedule_send_time_start:
        campaignData.sendPolicy === "batch" && campaignData.scheduledSendTime
          ? campaignData.scheduledSendTime + ":00"
          : campaignData.targetFilters.cardTime.startTime + ":00",
      schedule_send_time_end:
        campaignData.sendPolicy === "batch" && campaignData.scheduledSendTime
          ? campaignData.scheduledSendTime + ":00"
          : campaignData.targetFilters.cardTime.endTime + ":00",
      // schedule_timezone, schedule_days_of_week 필드 제거됨 - 고정값이므로 애플리케이션에서 처리
      ad_medium: campaignData.adMedium, // 광고매체 추가
      // 새로 추가된 필드들
      // template_title 필드 제거됨 - template_id로 대체 가능
      buttons: campaignData.buttons || [],
      gender_ratio: campaignData.genderRatio || null,
      desired_recipients: campaignData.desiredRecipients || null,
      created_at: kstTime,
      updated_at: kstTime,
    };

    // campaigns 테이블에 삽입
    const { data: newCampaign, error: insertError } = await supabase
      .from("campaigns")
      .insert(campaign)
      .select()
      .single();

    if (insertError) {
      // 새로운 템플릿을 생성한 경우에만 롤백 (기존 템플릿은 삭제하지 않음)
      if (!campaignData.existingTemplateId) {
        await supabase
          .from("message_templates")
          .delete()
          .eq("id", messageTemplate.id);
      }

      return NextResponse.json(
        {
          success: false,
          message: `캠페인 저장에 실패했습니다: ${insertError.message}`,
          error: insertError.code,
          details: insertError.details,
        },
        { status: 500 }
      );
    }

    // 캠페인이 성공적으로 생성되었으면 예약 크레딧 차감
    const reserveTransactionData = {
      user_id: userId,
      type: "reserve",
      amount: campaignCost,
      description: `캠페인 예약 (${campaign.name})`,
      reference_id: `campaign_reserve_${newCampaign.id}`,
      metadata: {
        campaign_id: newCampaign.id,
        campaign_name: campaign.name,
        reserve_type: "campaign_approval",
      },
      status: "completed",
    };

    const { error: reserveTransactionError } = await supabase
      .from("transactions")
      .insert(reserveTransactionData);

    if (reserveTransactionError) {
      console.error("예약 크레딧 차감 오류:", reserveTransactionError);

      // 캠페인 생성은 성공했으므로 경고 메시지와 함께 응답
      return NextResponse.json({
        success: true,
        message:
          "캠페인이 저장되었으나 예약 크레딧 차감에 실패했습니다. 관리자에게 문의해주세요.",
        campaign: newCampaign,
        warning: "예약 크레딧 차감 실패",
      });
    }

    return NextResponse.json({
      success: true,
      message: "캠페인이 성공적으로 저장되었습니다.",
      campaign: newCampaign,
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Authorization 헤더에서 토큰 추출
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, message: "인증 토큰이 필요합니다." },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // JWT 토큰 검증
    let decodedToken: { userId: string };
    try {
      decodedToken = jwt.verify(token, process.env.JWT_SECRET!) as {
        userId: string;
      };
    } catch {
      return NextResponse.json(
        { success: false, message: "유효하지 않은 토큰입니다." },
        { status: 401 }
      );
    }

    const userId = decodedToken.userId;

    // 사용자의 캠페인 목록 조회 (템플릿 정보와 함께)
    const { data: campaigns, error: campaignsError } = await supabase
      .from("campaigns")
      .select(
        `
        *,
        message_templates (
          name,
          content,
          image_url,
          category
        )
      `
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (campaignsError) {
      console.error("캠페인 조회 오류:", campaignsError);
      return NextResponse.json(
        { success: false, message: "캠페인 조회에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      campaigns: campaigns || [],
    });
  } catch (error) {
    console.error("캠페인 조회 오류:", error);
    return NextResponse.json(
      { success: false, message: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
