import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { validateAuthAndAdminWithSuccess } from "@/utils/authUtils";

// Supabase 클라이언트 생성 (서버 사이드용 Service Role Key 사용)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // 관리자 권한 확인
    const authResult = validateAuthAndAdminWithSuccess(request);
    if (!authResult.isValid) {
      return authResult.errorResponse!;
    }

    // 모든 캠페인 조회
    const { data: campaigns, error: campaignsError } = await supabase
      .from("campaigns")
      .select("*")
      .order("created_at", { ascending: false });

    if (campaignsError) {
      console.error("캠페인 조회 오류:", campaignsError);
      return NextResponse.json(
        { success: false, message: "캠페인 조회에 실패했습니다." },
        { status: 500 }
      );
    }

    // 각 캠페인에 대해 사용자 정보와 템플릿 정보를 추가로 조회
    const enrichedCampaigns = await Promise.all(
      (campaigns || []).map(async (campaign) => {
        // 사용자 정보 조회
        const { data: user } = await supabase
          .from("users")
          .select("username, name, email, phone_number, company_info")
          .eq("id", campaign.user_id)
          .single();

        // 메시지 템플릿 정보 조회
        const { data: template } = campaign.template_id
          ? await supabase
              .from("message_templates")
              .select("name, content, image_url, buttons")
              .eq("id", campaign.template_id)
              .single()
          : { data: null };

        return {
          ...campaign,
          users: user,
          message_templates: template,
        };
      })
    );

    return NextResponse.json({
      success: true,
      campaigns: enrichedCampaigns,
    });
  } catch (error) {
    console.error("관리자 캠페인 조회 오류:", error);
    return NextResponse.json(
      { success: false, message: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
