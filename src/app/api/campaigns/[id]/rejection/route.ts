import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";

// Supabase 클라이언트 생성
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 캠페인 반려사유 조회 API
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const campaignId = parseInt(id);

    if (isNaN(campaignId)) {
      return NextResponse.json(
        { success: false, message: "올바르지 않은 캠페인 ID입니다." },
        { status: 400 }
      );
    }

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
    let decodedToken: { userId: string; role?: string };
    try {
      decodedToken = jwt.verify(token, process.env.JWT_SECRET!) as {
        userId: string;
        role?: string;
      };
    } catch {
      return NextResponse.json(
        { success: false, message: "유효하지 않은 토큰입니다." },
        { status: 401 }
      );
    }

    const userId = decodedToken.userId;

    // 캠페인 소유자 확인
    const { data: campaign, error: campaignError } = await supabase
      .from("campaigns")
      .select("id, user_id, status")
      .eq("id", campaignId)
      .eq("user_id", userId)
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json(
        { success: false, message: "캠페인을 찾을 수 없거나 권한이 없습니다." },
        { status: 404 }
      );
    }

    // 반려 상태가 아닌 경우
    if (campaign.status !== "REJECTED") {
      return NextResponse.json(
        { success: false, message: "반려된 캠페인이 아닙니다." },
        { status: 400 }
      );
    }

    // 반려사유 조회 (가장 최근 반려사유)
    const { data: rejection, error: rejectionError } = await supabase
      .from("campaign_rejections")
      .select(`
        *,
        admin_user:users!admin_user_id (
          name,
          email
        )
      `)
      .eq("campaign_id", campaignId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (rejectionError) {
      console.error("반려사유 조회 오류:", rejectionError);
      
      // campaign_rejections 테이블이 없거나 데이터가 없는 경우 campaigns 테이블에서 조회
      const { data: campaignDetail, error: campaignDetailError } = await supabase
        .from("campaigns")
        .select(`
          id, rejection_reason, approved_at, updated_at,
          approved_by_user:users!approved_by (
            name,
            email
          )
        `)
        .eq("id", campaignId)
        .single();

      if (campaignDetailError || !campaignDetail) {
        return NextResponse.json(
          { success: false, message: "반려사유 조회에 실패했습니다." },
          { status: 500 }
        );
      }

      // 기본 반려사유 데이터 구성
      const fallbackRejection = {
        id: `fallback_${campaignId}`,
        campaign_id: campaignId,
        admin_user_id: campaignDetail.approved_by_user?.name ? 1 : null,
        rejection_reason: campaignDetail.rejection_reason || "캠페인 검토 결과 수정이 필요합니다.",
        rejection_details: campaignDetail.rejection_reason || "신청하신 캠페인 설정 항목을 검토 후 수정해주세요.",
        suggested_modifications: {
          items: ["수정항목"],
          message: "캠페인 설정을 전반적으로 검토해주세요."
        },
        admin_user: {
          name: campaignDetail.approved_by_user?.name || "관리자",
          email: campaignDetail.approved_by_user?.email || "admin@example.com"
        },
        created_at: campaignDetail.approved_at || campaignDetail.updated_at,
        updated_at: campaignDetail.updated_at
      };

      return NextResponse.json({
        success: true,
        rejection: fallbackRejection,
      });
    }

    return NextResponse.json({
      success: true,
      rejection: rejection,
    });
  } catch (error) {
    console.error("반려사유 조회 API 오류:", error);
    return NextResponse.json(
      { success: false, message: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
