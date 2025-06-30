import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getKSTISOString } from "@/lib/utils";

// 서버 사이드에서는 서비스 역할 키 사용
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  db: {
    schema: "public",
  },
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export async function POST(request: NextRequest) {
  try {
    const { referralCode } = await request.json();

    if (!referralCode) {
      return NextResponse.json(
        {
          message: "추천 코드가 필요합니다",
          error: "Missing referral code",
          status: 400,
          timestamp: getKSTISOString(),
          path: "/api/users/update-referral-views",
        },
        { status: 400 }
      );
    }

    // referral_code로 사용자 찾기
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, referral_views")
      .eq("referral_code", referralCode)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        {
          message: "해당 추천 코드를 찾을 수 없습니다",
          error: "Referral code not found",
          status: 404,
          timestamp: getKSTISOString(),
          path: "/api/users/update-referral-views",
        },
        { status: 404 }
      );
    }

    // referral_views를 1 증가
    const currentViews = user.referral_views || 0;
    const { data: updatedUser, error: updateError } = await supabase
      .from("users")
      .update({ referral_views: currentViews + 1 })
      .eq("id", user.id)
      .select("referral_views")
      .single();

    if (updateError) {
      console.error("Error updating referral views:", updateError);
      return NextResponse.json(
        {
          message: "추천 조회수 업데이트 중 오류가 발생했습니다",
          error: "Database error",
          status: 500,
          timestamp: getKSTISOString(),
          path: "/api/users/update-referral-views",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "추천 조회수가 업데이트되었습니다",
      referralViews: updatedUser.referral_views,
    });
  } catch (error) {
    console.error("Update referral views error:", error);
    return NextResponse.json(
      {
        message: "서버 오류가 발생했습니다",
        error: "Internal server error",
        status: 500,
        timestamp: getKSTISOString(),
        path: "/api/users/update-referral-views",
      },
      { status: 500 }
    );
  }
}
