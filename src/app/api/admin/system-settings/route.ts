import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// JWT 토큰에서 사용자 정보 추출
function getUserFromToken(
  request: NextRequest
): { userId: string; role: string } | null {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      role: string;
    };
    return decoded;
  } catch {
    return null;
  }
}

// 관리자 권한 확인
async function isAdmin(userId: string) {
  const { data: user } = await supabase
    .from("users")
    .select("role")
    .eq("id", userId)
    .single();

  return user?.role === "ADMIN";
}

// GET: 시스템 설정 조회
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromToken(request);
    if (!user) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    // 관리자 권한 확인 (토큰의 role을 우선 확인, 없으면 DB에서 재확인)
    if (user.role !== "ADMIN" && !(await isAdmin(user.userId))) {
      return NextResponse.json(
        { error: "접근 권한이 없습니다." },
        { status: 403 }
      );
    }

    // 시스템 설정 조회 (첫 번째 레코드만 사용)
    const { data: settings, error } = await supabase
      .from("system_settings")
      .select("*")
      .limit(1)
      .single();

    if (error) {
      console.error("시스템 설정 조회 오류:", error);
      return NextResponse.json(
        { error: "시스템 설정을 조회할 수 없습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        firstLevelCommissionRate: Number(settings.first_level_commission_rate),
        nthLevelDenominator: settings.nth_level_denominator,
        menuSettings: settings.menu_settings || { main_menu: [], admin_menu: [] },
        siteSettings: settings.site_settings || {},
        updatedAt: settings.updated_at,
      },
    });
  } catch (error) {
    console.error("시스템 설정 조회 중 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// PUT: 시스템 설정 업데이트
export async function PUT(request: NextRequest) {
  try {
    const user = getUserFromToken(request);
    if (!user) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    // 관리자 권한 확인 (토큰의 role을 우선 확인, 없으면 DB에서 재확인)
    if (user.role !== "ADMIN" && !(await isAdmin(user.userId))) {
      return NextResponse.json(
        { error: "접근 권한이 없습니다." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { firstLevelCommissionRate, nthLevelDenominator, menuSettings, siteSettings } = body;

    // 입력 값 검증
    if (
      typeof firstLevelCommissionRate !== "number" ||
      firstLevelCommissionRate < 0 ||
      firstLevelCommissionRate > 100
    ) {
      return NextResponse.json(
        { error: "1차 수수료 비율은 0~100 사이의 숫자여야 합니다." },
        { status: 400 }
      );
    }

    if (
      typeof nthLevelDenominator !== "number" ||
      nthLevelDenominator < 1 ||
      nthLevelDenominator > 100 ||
      !Number.isInteger(nthLevelDenominator)
    ) {
      return NextResponse.json(
        { error: "분모는 1~100 사이의 정수여야 합니다." },
        { status: 400 }
      );
    }

    // 시스템 설정 업데이트 (첫 번째 레코드 업데이트)
    interface UpdateData {
      first_level_commission_rate: number;
      nth_level_denominator: number;
      updated_at: string;
      menu_settings?: object;
      site_settings?: object;
    }

    const updateData: UpdateData = {
      first_level_commission_rate: firstLevelCommissionRate,
      nth_level_denominator: nthLevelDenominator,
      updated_at: new Date().toISOString()
    };

    if (menuSettings) {
      updateData.menu_settings = menuSettings;
    }

    if (siteSettings) {
      updateData.site_settings = siteSettings;
    }

    const { data, error } = await supabase
      .from("system_settings")
      .update(updateData)
      .eq("id", 1)
      .select()
      .single();

    if (error) {
      console.error("시스템 설정 업데이트 오류:", error);
      return NextResponse.json(
        { error: "시스템 설정을 업데이트할 수 없습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "시스템 설정이 성공적으로 업데이트되었습니다.",
      data: {
        firstLevelCommissionRate: Number(data.first_level_commission_rate),
        nthLevelDenominator: data.nth_level_denominator,
        updatedAt: data.updated_at,
      },
    });
  } catch (error) {
    console.error("시스템 설정 업데이트 중 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
