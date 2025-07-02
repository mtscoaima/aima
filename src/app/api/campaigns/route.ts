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
  sendPolicy: "realtime" | "batch";
  validityPeriod?: string;
  maxRecipients: string;
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

    // 사용자 권한 확인 (USER 또는 ADVERTISER 역할만 캠페인 생성 가능)
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
      !campaignData.sendPolicy
    ) {
      return NextResponse.json(
        { success: false, message: "필수 정보가 누락되었습니다." },
        { status: 400 }
      );
    }

    // 현재 시간 (KST)
    const now = new Date();
    const kstTime = new Date(now.getTime() + 9 * 60 * 60 * 1000).toISOString();

    // 먼저 message_template 생성
    const { data: messageTemplate, error: templateError } = await supabase
      .from("message_templates")
      .insert({
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
      })
      .select()
      .single();

    if (templateError) {
      console.error("템플릿 저장 오류:", templateError);
      return NextResponse.json(
        { success: false, message: "템플릿 저장에 실패했습니다." },
        { status: 500 }
      );
    }

    // 타겟 조건 및 추가 설정을 포함한 JSON 데이터 준비
    const targetCriteria = {
      ...campaignData.targetFilters,
      sendPolicy: campaignData.sendPolicy,
      validityPeriod: campaignData.validityPeriod,
      maxRecipients: parseInt(campaignData.maxRecipients) || 30,
    };

    // 캠페인 데이터 준비 (실제 스키마에 맞게)
    const campaign = {
      user_id: userId,
      name: campaignData.title || "AI 생성 캠페인",
      description: `AI가 생성한 캠페인입니다. 발송 정책: ${campaignData.sendPolicy}`,
      template_id: messageTemplate.id,
      status: "PENDING_APPROVAL", // 승인 대기 상태
      total_recipients: parseInt(campaignData.maxRecipients) || 30,
      budget: campaignData.estimatedCost || 0,
      target_criteria: targetCriteria,
      message_template: campaignData.content,
      schedule_start_date: campaignData.validityPeriod
        ? new Date(campaignData.validityPeriod).toISOString()
        : null,
      schedule_send_time_start:
        campaignData.targetFilters.cardTime.startTime + ":00",
      schedule_send_time_end:
        campaignData.targetFilters.cardTime.endTime + ":00",
      schedule_timezone: "Asia/Seoul",
      schedule_days_of_week: [1, 2, 3, 4, 5, 6, 7], // 모든 요일
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
      console.error("캠페인 저장 오류:", insertError);

      // 템플릿 삭제 (롤백)
      await supabase
        .from("message_templates")
        .delete()
        .eq("id", messageTemplate.id);

      return NextResponse.json(
        { success: false, message: "캠페인 저장에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "캠페인이 성공적으로 저장되었습니다.",
      campaign: newCampaign,
    });
  } catch (error) {
    console.error("캠페인 생성 오류:", error);
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
          image_url
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
