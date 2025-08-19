import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";

// Supabase 클라이언트 생성 (서버 사이드용 Service Role Key 사용)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface AdCostResponse {
  recent7Days: {
    startDate: string;
    endDate: string;
    totalCost: number;
  };
  previous7Days: {
    startDate: string;
    endDate: string;
    totalCost: number;
  };
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

    // 날짜 범위 계산 (KST 기준)
    const now = new Date();
    const recent7DaysEnd = new Date(now);
    const recent7DaysStart = new Date(now);
    recent7DaysStart.setDate(now.getDate() - 6); // 오늘 포함 7일

    const previous7DaysEnd = new Date(recent7DaysStart);
    previous7DaysEnd.setDate(previous7DaysEnd.getDate() - 1); // 최근 7일 시작 전날
    const previous7DaysStart = new Date(previous7DaysEnd);
    previous7DaysStart.setDate(previous7DaysEnd.getDate() - 6); // 이전 7일 시작

    // 날짜를 ISO 문자열로 변환 (시작은 00:00:00, 끝은 23:59:59)
    const recent7DaysStartStr = recent7DaysStart.toISOString().split('T')[0] + 'T00:00:00.000Z';
    const recent7DaysEndStr = recent7DaysEnd.toISOString().split('T')[0] + 'T23:59:59.999Z';
    
    const previous7DaysStartStr = previous7DaysStart.toISOString().split('T')[0] + 'T00:00:00.000Z';
    const previous7DaysEndStr = previous7DaysEnd.toISOString().split('T')[0] + 'T23:59:59.999Z';

    // 최근 7일 광고비 합계 조회
    const { data: recentCampaigns, error: recentError } = await supabase
      .from("campaigns")
      .select("budget, actual_cost")
      .eq("user_id", userId)
      .gte("created_at", recent7DaysStartStr)
      .lte("created_at", recent7DaysEndStr);

    if (recentError) {
      console.error("최근 7일 캠페인 조회 오류:", recentError);
      return NextResponse.json(
        { success: false, message: "최근 광고비 조회에 실패했습니다." },
        { status: 500 }
      );
    }

    // 이전 7일 광고비 합계 조회
    const { data: previousCampaigns, error: previousError } = await supabase
      .from("campaigns")
      .select("budget, actual_cost")
      .eq("user_id", userId)
      .gte("created_at", previous7DaysStartStr)
      .lte("created_at", previous7DaysEndStr);

    if (previousError) {
      console.error("이전 7일 캠페인 조회 오류:", previousError);
      return NextResponse.json(
        { success: false, message: "이전 광고비 조회에 실패했습니다." },
        { status: 500 }
      );
    }

    // 광고비 합계 계산 (actual_cost가 있으면 사용, 없으면 budget 사용)
    const recentTotal = recentCampaigns?.reduce((sum, campaign) => {
      const cost = campaign.actual_cost ?? campaign.budget ?? 0;
      return sum + cost;
    }, 0) ?? 0;

    const previousTotal = previousCampaigns?.reduce((sum, campaign) => {
      const cost = campaign.actual_cost ?? campaign.budget ?? 0;
      return sum + cost;
    }, 0) ?? 0;

    const response: AdCostResponse = {
      recent7Days: {
        startDate: recent7DaysStart.toISOString().split('T')[0],
        endDate: recent7DaysEnd.toISOString().split('T')[0],
        totalCost: recentTotal,
      },
      previous7Days: {
        startDate: previous7DaysStart.toISOString().split('T')[0],
        endDate: previous7DaysEnd.toISOString().split('T')[0],
        totalCost: previousTotal,
      },
    };

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("광고비 합계 조회 오류:", error);
    return NextResponse.json(
      { success: false, message: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
