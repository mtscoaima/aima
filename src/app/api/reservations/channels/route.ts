import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const JWT_SECRET = process.env.JWT_SECRET!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// JWT 토큰에서 사용자 ID 추출
function getUserIdFromToken(request: NextRequest): string | null {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return decoded.userId;
  } catch {
    return null;
  }
}

interface Channel {
  id: number;
  name: string;
  isCustom: boolean;
  displayOrder: number;
}

// GET /api/reservations/channels
// 시스템 채널 + 사용자 커스텀 채널 반환 (통합 테이블)
export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 시스템 채널 (user_id IS NULL) + 사용자 커스텀 채널 (user_id = userId) 조회
    const { data: channels, error } = await supabase
      .from("booking_channels")
      .select("id, name, user_id, display_order")
      .eq("is_active", true)
      .or(`user_id.is.null,user_id.eq.${userId}`)
      .order("display_order", { ascending: true });

    if (error) {
      console.error("Error fetching channels:", error);
      return NextResponse.json(
        { error: "Failed to fetch channels" },
        { status: 500 }
      );
    }

    // 채널 데이터 변환
    const channelList: Channel[] = (channels || []).map((ch) => ({
      id: ch.id,
      name: ch.name,
      isCustom: ch.user_id !== null, // user_id가 있으면 커스텀 채널
      displayOrder: ch.display_order,
    }));

    // 시스템/커스텀 채널 개수 계산
    const systemCount = channelList.filter(ch => !ch.isCustom).length;
    const customCount = channelList.filter(ch => ch.isCustom).length;

    return NextResponse.json({
      success: true,
      channels: channelList,
      systemCount,
      customCount,
    });
  } catch (error) {
    console.error("Error in GET /api/reservations/channels:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
