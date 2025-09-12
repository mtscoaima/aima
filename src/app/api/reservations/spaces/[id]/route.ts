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

// 공간 삭제 (하드 삭제)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const spaceId = parseInt(params.id);
    if (isNaN(spaceId)) {
      return NextResponse.json({ error: "Invalid space ID" }, { status: 400 });
    }

    // 먼저 공간의 존재 여부와 소유권 확인
    const { data: space } = await supabase
      .from("spaces")
      .select("id")
      .eq("id", spaceId)
      .eq("user_id", userId)
      .single();

    if (!space) {
      return NextResponse.json({ error: "Space not found" }, { status: 404 });
    }

    // 해당 공간에 예약이 있는지 확인
    const { data: reservations, error: reservationError } = await supabase
      .from("reservations")
      .select("id")
      .eq("space_id", spaceId)
      .eq("user_id", userId);

    if (reservationError) {
      console.error("Error checking reservations:", reservationError);
      return NextResponse.json({ error: "Failed to check reservations" }, { status: 500 });
    }

    if (reservations && reservations.length > 0) {
      return NextResponse.json(
        { 
          error: "Cannot delete space with existing reservations",
          reservationCount: reservations.length 
        },
        { status: 409 }
      );
    }

    // 예약이 없으면 공간 삭제
    const { error: deleteError } = await supabase
      .from("spaces")
      .delete()
      .eq("id", spaceId)
      .eq("user_id", userId);

    if (deleteError) {
      console.error("Error deleting space:", deleteError);
      return NextResponse.json({ error: "Failed to delete space" }, { status: 500 });
    }

    return NextResponse.json({ message: "Space deleted successfully" });
  } catch (error) {
    console.error("Error in DELETE /api/reservations/spaces/[id]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}