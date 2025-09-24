import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";

// Supabase 클라이언트 생성 (서버 사이드용 Service Role Key 사용)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(
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
      console.error("JWT 토큰 검증 실패: 유효하지 않은 토큰");
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
      console.error("사용자 조회 실패:", userError);
      return NextResponse.json(
        { success: false, message: "계정 정보를 찾을 수 없습니다. 다시 로그인해주세요." },
        { status: 404 }
      );
    }

    // 관리자 권한 확인
    if (user.role !== "ADMIN") {
      console.error(`관리자 권한 체크 실패: 사용자 ID ${userId}, 역할 ${user.role}`);
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

    // 시작 가능한 상태인지 확인
    if (campaign.status !== "APPROVED" && campaign.status !== "PAUSED") {
      return NextResponse.json(
        {
          success: false,
          message: "승인된 캠페인 또는 일시정지된 캠페인만 시작할 수 있습니다.",
        },
        { status: 400 }
      );
    }

    // 현재 시간 (KST)
    const now = new Date();
    const kstTime = new Date(now.getTime() + 9 * 60 * 60 * 1000).toISOString();

    // 캠페인 시작 처리
    const updateData: {
      status: string;
      updated_at: string;
      started_at?: string;
    } = {
      status: "ACTIVE",
      updated_at: kstTime,
    };

    // 처음 시작하는 경우 started_at 설정
    if (!campaign.started_at) {
      updateData.started_at = kstTime;
    }

    const { error: updateError } = await supabase
      .from("campaigns")
      .update(updateData)
      .eq("id", campaignId);

    if (updateError) {
      console.error("캠페인 시작 오류:", updateError);
      return NextResponse.json(
        { success: false, message: "캠페인 시작 처리에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "캠페인이 성공적으로 시작되었습니다.",
    });
  } catch (error) {
    console.error("캠페인 시작 오류:", error);
    return NextResponse.json(
      { success: false, message: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
