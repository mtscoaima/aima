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
async function isAdmin(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("role")
      .eq("id", userId)
      .single();

    if (error || !data) return false;
    return data.role === "ADMIN";
  } catch {
    return false;
  }
}

// GET: 모든 차등 단가 설정 조회
export async function GET() {
  try {
    const { data, error } = await supabase
      .from("pricing_settings")
      .select("*")
      .eq("is_active", true)
      .order("id");

    if (error) {
      console.error("차등 단가 설정 조회 오류:", error);
      throw error;
    }

    return NextResponse.json({ pricingSettings: data || [] });
  } catch (error) {
    console.error("차등 단가 설정 조회 실패:", error);
    return NextResponse.json(
      { error: "차등 단가 설정을 조회할 수 없습니다." },
      { status: 500 }
    );
  }
}

// PUT: 차등 단가 설정 일괄 업데이트
export async function PUT(req: NextRequest) {
  try {
    const user = getUserFromToken(req);
    if (!user) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    // 관리자 권한 확인 (토큰의 role을 우선 확인, 없으면 DB에서 재확인)
    if (user.role !== "ADMIN" && !(await isAdmin(user.userId))) {
      return NextResponse.json(
        { error: "관리자 권한이 필요합니다." },
        { status: 403 }
      );
    }

    // 업데이트할 데이터 받기
    const { updates } = await req.json(); // [{ id, price }, ...]

    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json(
        { error: "업데이트할 데이터가 없습니다." },
        { status: 400 }
      );
    }

    // 각 설정 업데이트
    const updatePromises = updates.map(async (update: { id: number; price: number }) => {
      const { error } = await supabase
        .from("pricing_settings")
        .update({
          price: update.price,
          updated_at: new Date().toISOString()
        })
        .eq("id", update.id);

      if (error) throw error;
    });

    await Promise.all(updatePromises);

    return NextResponse.json({
      success: true,
      message: "차등 단가 설정이 업데이트되었습니다.",
      updatedCount: updates.length
    });
  } catch (error) {
    console.error("차등 단가 설정 업데이트 실패:", error);
    return NextResponse.json(
      { error: "차등 단가 설정을 업데이트할 수 없습니다." },
      { status: 500 }
    );
  }
}
