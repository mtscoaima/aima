import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";

// Supabase 클라이언트 생성 (서버 사이드용 Service Role Key 사용)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const campaignId = id;

    // Authorization 헤더에서 토큰 추출
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, message: "로그인이 필요합니다. 다시 로그인해주세요." },
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
        { success: false, message: "세션이 만료되었습니다. 다시 로그인해주세요." },
        { status: 401 }
      );
    }

    const userId = decodedToken.userId;

    // 사용자 존재 확인
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, name, role")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, message: "계정 정보를 찾을 수 없습니다. 다시 로그인해주세요." },
        { status: 404 }
      );
    }

    // 캠페인 존재 확인
    const { data: campaign, error: campaignError } = await supabase
      .from("campaigns")
      .select("*")
      .eq("id", campaignId)
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json(
        { success: false, message: "캠페인을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 권한 확인: 관리자이거나 캠페인 소유자
    const isAdmin = user.role === "ADMIN";
    const isOwner = campaign.user_id === parseInt(userId);

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { success: false, message: "권한이 없습니다." },
        { status: 403 }
      );
    }

    // 승인 완료된 캠페인은 일반 사용자 수정 불가 (관리자는 가능)
    if (!isAdmin && campaign.status === "APPROVED") {
      return NextResponse.json(
        { success: false, message: "승인 완료된 캠페인은 수정할 수 없습니다." },
        { status: 403 }
      );
    }

    // 요청 본문 파싱
    const updateData = await request.json();

    // 캠페인 단가 자동 계산 - 새로운 예산 로직 사용
    const campaignBudget = updateData.campaign_budget || updateData.budget || campaign.campaign_budget || campaign.budget;
    if (campaignBudget && updateData.total_recipients) {
      updateData.unit_cost = Math.ceil(campaignBudget / updateData.total_recipients);
    } else if (campaignBudget && campaign.total_recipients) {
      updateData.unit_cost = Math.ceil(campaignBudget / campaign.total_recipients);
    } else if (updateData.total_recipients && campaignBudget) {
      updateData.unit_cost = Math.ceil(campaignBudget / updateData.total_recipients);
    }

    // 업데이트 시간 설정
    updateData.updated_at = new Date().toISOString();

    // 캠페인 업데이트
    const { data: updatedCampaign, error: updateError } = await supabase
      .from("campaigns")
      .update(updateData)
      .eq("id", campaignId)
      .select("*")
      .single();

    if (updateError) {
      console.error("캠페인 업데이트 오류:", updateError);
      return NextResponse.json(
        { success: false, message: "캠페인 업데이트에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "캠페인이 성공적으로 업데이트되었습니다.",
      campaign: updatedCampaign
    });
  } catch (error) {
    console.error("캠페인 업데이트 오류:", error);
    return NextResponse.json(
      { success: false, message: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const campaignId = id;

    // Authorization 헤더에서 토큰 추출
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, message: "로그인이 필요합니다. 다시 로그인해주세요." },
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
        { success: false, message: "세션이 만료되었습니다. 다시 로그인해주세요." },
        { status: 401 }
      );
    }

    const userId = decodedToken.userId;

    // 사용자 존재 및 관리자 권한 확인
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, name, role")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, message: "계정 정보를 찾을 수 없습니다. 다시 로그인해주세요." },
        { status: 404 }
      );
    }

    // 관리자 권한 확인
    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "접근 권한이 없습니다." },
        { status: 403 }
      );
    }

    // 캠페인 존재 확인
    const { data: campaign, error: campaignError } = await supabase
      .from("campaigns")
      .select("*")
      .eq("id", campaignId)
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json(
        { success: false, message: "캠페인을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 삭제 가능한 상태인지 확인 (진행 중인 캠페인은 삭제 불가)
    if (campaign.status === "ACTIVE") {
      return NextResponse.json(
        {
          success: false,
          message:
            "진행 중인 캠페인은 삭제할 수 없습니다. 먼저 일시정지해주세요.",
        },
        { status: 400 }
      );
    }

    // 관련 데이터 먼저 삭제 (외래키 제약조건 때문)
    // campaign_targets 삭제
    await supabase
      .from("campaign_targets")
      .delete()
      .eq("campaign_id", campaignId);

    // campaign_messages 삭제
    await supabase
      .from("campaign_messages")
      .delete()
      .eq("campaign_id", campaignId);

    // rewards 삭제
    await supabase.from("rewards").delete().eq("campaign_id", campaignId);

    // payments 삭제
    await supabase.from("payments").delete().eq("campaign_id", campaignId);

    // 캠페인 삭제
    const { error: deleteError } = await supabase
      .from("campaigns")
      .delete()
      .eq("id", campaignId);

    if (deleteError) {
      console.error("캠페인 삭제 오류:", deleteError);
      return NextResponse.json(
        { success: false, message: "캠페인 삭제 처리에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "캠페인이 성공적으로 삭제되었습니다.",
    });
  } catch (error) {
    console.error("캠페인 삭제 오류:", error);
    return NextResponse.json(
      { success: false, message: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
