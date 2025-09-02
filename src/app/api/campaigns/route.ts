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
  scheduledSendDate?: string;
  scheduledSendTime?: string;
  maxRecipients: string;
  existingTemplateId?: number;
  // 새로운 데이터베이스 컬럼들
  targetAgeGroups: string[];
  targetLocationsDetailed?: Array<{ city: string; districts: string[] } | string>;
  cardAmountMax?: number | null;
  cardTimeStart?: string | null;
  cardTimeEnd?: string | null;
  targetIndustryTopLevel?: string | null;
  targetIndustrySpecific?: string | null;
  unitCost?: number;
  estimatedTotalCost?: number;
  expertReviewRequested?: boolean;
  expertReviewNotes?: string | null;
  buttons?: {
    id: string;
    text: string;
    linkType: 'web' | 'app';
    url?: string;
    iosUrl?: string;
    androidUrl?: string;
  }[];
  genderRatio?: {
    female: number;
    male: number;
  };
  desiredRecipients?: string | null;
  estimatedCost: number;
  templateDescription?: string;
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
        name: campaignData.templateDescription || "AI 생성 템플릿",
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
        template_code: "임시-0", // 임시값, 생성 후 업데이트
      };

      const { data: newTemplate, error: templateError } = await supabase
        .from("message_templates")
        .insert(templateData)
        .select()
        .single();

      if (templateError) {
        console.error("Template creation error:", templateError);
        return NextResponse.json(
          { success: false, message: "템플릿 저장에 실패했습니다.", error: templateError.message },
          { status: 500 }
        );
      }

      // 생성된 템플릿의 template_code 업데이트
      // ad_medium을 기반으로 적절한 템플릿 코드 생성
      const adMediumMapping: { [key: string]: string } = {
        'naver_talktalk': '결합메시지',
        'sms': '문자메시지',
        'kakao': '카카오메시지',
        'email': '이메일'
      };
      
      const templateCodePrefix = adMediumMapping[campaignData.adMedium] || '결합메시지';
      const templateCode = `${templateCodePrefix}-${newTemplate.id}`;

      // template_code 업데이트
      const { error: updateError } = await supabase
        .from("message_templates")
        .update({ template_code: templateCode })
        .eq("id", newTemplate.id);

      if (updateError) {
        console.error("Template code update error:", updateError);
        // template_code 업데이트 실패해도 템플릿 생성은 성공으로 처리
      }

      // 업데이트된 template_code를 포함한 템플릿 객체 생성
      messageTemplate = {
        ...newTemplate,
        template_code: templateCode
      };
    }

    // target_criteria 제거됨 - 더 이상 사용하지 않음

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

    // 카드 승인 금액 처리
    const cardAmountMax = campaignData.cardAmountMax || null;

    // 카드 승인 시간 처리
    const cardTimeStart = campaignData.cardTimeStart || null;
    const cardTimeEnd = campaignData.cardTimeEnd || null;

    // 캠페인 데이터 준비 (새로운 컬럼들 사용)
    const campaign = {
      user_id: userId,
      name: campaignData.title || messageTemplate.name,
      template_id: messageTemplate.id,
      status: "PENDING_APPROVAL",
      total_recipients: parseInt(campaignData.maxRecipients) || 30,
      sent_count: 0,
      success_count: 0,
      failed_count: 0,
      budget: campaignData.estimatedCost || 0,
      message_template: campaignData.content,
      schedule_start_date: scheduleStartDate,
      schedule_end_date: scheduleEndDate,
      schedule_send_time_start:
        campaignData.sendPolicy === "batch" && campaignData.scheduledSendTime
          ? campaignData.scheduledSendTime + ":00"
          : cardTimeStart ? cardTimeStart + ":00" : null,
      schedule_send_time_end:
        campaignData.sendPolicy === "batch" && campaignData.scheduledSendTime
          ? campaignData.scheduledSendTime + ":00"
          : cardTimeEnd ? cardTimeEnd + ":00" : null,
      ad_medium: campaignData.adMedium,
      // 새로운 데이터베이스 컬럼들
      send_policy_type: campaignData.sendPolicy,
      validity_start_date: campaignData.validityStartDate ? new Date(campaignData.validityStartDate).toISOString().split('T')[0] : null,
      validity_end_date: campaignData.validityEndDate ? new Date(campaignData.validityEndDate).toISOString().split('T')[0] : null,
      scheduled_send_date: campaignData.scheduledSendDate ? new Date(campaignData.scheduledSendDate).toISOString().split('T')[0] : null,
      scheduled_send_time: campaignData.scheduledSendTime || null,
      target_age_groups: campaignData.targetAgeGroups || ['all'],
      target_locations_detailed: campaignData.targetLocationsDetailed || [],
      card_amount_max: cardAmountMax,
      card_time_start: cardTimeStart,
      card_time_end: cardTimeEnd,
      target_industry_top_level: campaignData.targetIndustryTopLevel,
      target_industry_specific: campaignData.targetIndustrySpecific,
      unit_cost: campaignData.unitCost || 0,
      estimated_total_cost: campaignData.estimatedTotalCost || campaignData.estimatedCost || 0,
      expert_review_requested: campaignData.expertReviewRequested || false,
      expert_review_notes: campaignData.expertReviewNotes,
      buttons: campaignData.buttons || [],
      gender_ratio: campaignData.genderRatio || {},
      desired_recipients: campaignData.desiredRecipients,
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
          category,
          template_code
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
