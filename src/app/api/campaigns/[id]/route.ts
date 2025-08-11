import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";

// Supabase 클라이언트 생성 (서버 사이드용 Service Role Key 사용)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 캠페인 삭제 API
export async function DELETE(
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

    // 캠페인 존재 확인 및 소유자 확인
    const { data: campaign, error: campaignError } = await supabase
      .from("campaigns")
      .select("*")
      .eq("id", campaignId)
      .eq("user_id", userId) // 본인의 캠페인만 삭제 가능
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json(
        { success: false, message: "캠페인을 찾을 수 없거나 삭제 권한이 없습니다." },
        { status: 404 }
      );
    }

    // 진행 중인 캠페인은 삭제 불가
    if (campaign.status === "ACTIVE") {
      return NextResponse.json(
        {
          success: false,
          message: "진행 중인 캠페인은 삭제할 수 없습니다. 먼저 일시정지해주세요.",
        },
        { status: 400 }
      );
    }

    // 관련 데이터 먼저 삭제 (외래키 제약조건 때문)
    try {
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

      // 기타 관련 테이블 삭제 (있는 경우)
      await supabase.from("rewards").delete().eq("campaign_id", campaignId);
      await supabase.from("payments").delete().eq("campaign_id", campaignId);
    } catch (relatedError) {
      console.error("관련 데이터 삭제 오류:", relatedError);
      // 관련 데이터 삭제 실패는 무시하고 계속 진행
    }

    // 캠페인 삭제
    const { error: deleteError } = await supabase
      .from("campaigns")
      .delete()
      .eq("id", campaignId)
      .eq("user_id", userId); // 추가 보안 확인

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
    console.error("캠페인 삭제 API 오류:", error);
    return NextResponse.json(
      { success: false, message: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// 캠페인 이름 수정 API
export async function PATCH(
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

    // 요청 본문 파싱
    const body = await request.json();
    const { name } = body;

    // 입력 검증
    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { success: false, message: "캠페인 이름을 입력해주세요." },
        { status: 400 }
      );
    }

    if (name.trim().length > 100) {
      return NextResponse.json(
        { success: false, message: "캠페인 이름은 100자를 초과할 수 없습니다." },
        { status: 400 }
      );
    }

    // 캠페인 존재 확인 및 소유자 확인
    const { data: campaign, error: campaignError } = await supabase
      .from("campaigns")
      .select("id, name, user_id")
      .eq("id", campaignId)
      .eq("user_id", userId) // 본인의 캠페인만 수정 가능
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json(
        { success: false, message: "캠페인을 찾을 수 없거나 수정 권한이 없습니다." },
        { status: 404 }
      );
    }

    // 캠페인 이름 업데이트
    const { error: updateError } = await supabase
      .from("campaigns")
      .update({ 
        name: name.trim(),
        updated_at: new Date().toISOString()
      })
      .eq("id", campaignId)
      .eq("user_id", userId); // 추가 보안 확인

    if (updateError) {
      console.error("캠페인 이름 수정 오류:", updateError);
      return NextResponse.json(
        { success: false, message: "캠페인 이름 수정에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "캠페인 이름이 성공적으로 수정되었습니다.",
      data: {
        id: campaignId,
        name: name.trim(),
      }
    });
  } catch (error) {
    console.error("캠페인 수정 API 오류:", error);
    return NextResponse.json(
      { success: false, message: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// 단일 캠페인 조회 API (추가 기능)
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

    // 캠페인 조회 (템플릿 정보와 함께)
    const { data: campaign, error: campaignError } = await supabase
      .from("campaigns")
      .select(`
        *,
        message_templates (
          name,
          content,
          image_url,
          category
        )
      `)
      .eq("id", campaignId)
      .eq("user_id", userId) // 본인의 캠페인만 조회 가능
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json(
        { success: false, message: "캠페인을 찾을 수 없거나 조회 권한이 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      campaign: campaign,
    });
  } catch (error) {
    console.error("캠페인 조회 API 오류:", error);
    return NextResponse.json(
      { success: false, message: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
