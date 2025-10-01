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

// 개별 공간 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const spaceId = parseInt(id);
    if (isNaN(spaceId)) {
      return NextResponse.json({ error: "Invalid space ID" }, { status: 400 });
    }

    // 공간 정보 조회
    const { data: space, error } = await supabase
      .from("spaces")
      .select("*")
      .eq("id", spaceId)
      .eq("user_id", userId)
      .single();

    if (error) {
      console.error("Error fetching space:", error);
      return NextResponse.json({ error: "Space not found" }, { status: 404 });
    }

    return NextResponse.json({ space });
  } catch (error) {
    console.error("Error in GET /api/reservations/spaces/[id]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// 공간 정보 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const spaceId = parseInt(id);
    if (isNaN(spaceId)) {
      return NextResponse.json({ error: "Invalid space ID" }, { status: 400 });
    }

    const body = await request.json();
    const { name, icon_text, icon_color } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Space name is required" }, { status: 400 });
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

    // 업데이트할 데이터 준비
    const updateData: Record<string, string> = { name: name.trim() };
    if (icon_text !== undefined) updateData.icon_text = icon_text;
    if (icon_color !== undefined) updateData.icon_color = icon_color;

    // 공간 정보 업데이트
    const { data, error } = await supabase
      .from("spaces")
      .update(updateData)
      .eq("id", spaceId)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      console.error("Error updating space:", error);
      return NextResponse.json({ error: "Failed to update space" }, { status: 500 });
    }

    return NextResponse.json({ space: data });
  } catch (error) {
    console.error("Error in PUT /api/reservations/spaces/[id]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// 공간 삭제 (예약도 함께 삭제)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const spaceId = parseInt(id);
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

    // 먼저 해당 공간의 모든 예약 삭제
    const { error: reservationDeleteError } = await supabase
      .from("reservations")
      .delete()
      .eq("space_id", spaceId)
      .eq("user_id", userId);

    if (reservationDeleteError) {
      console.error("Error deleting reservations:", reservationDeleteError);
      return NextResponse.json({ error: "Failed to delete related reservations" }, { status: 500 });
    }

    // 그 다음 공간 삭제
    const { error: spaceDeleteError } = await supabase
      .from("spaces")
      .delete()
      .eq("id", spaceId)
      .eq("user_id", userId);

    if (spaceDeleteError) {
      console.error("Error deleting space:", spaceDeleteError);
      return NextResponse.json({ error: "Failed to delete space" }, { status: 500 });
    }

    return NextResponse.json({ message: "Space and related reservations deleted successfully" });
  } catch (error) {
    console.error("Error in DELETE /api/reservations/spaces/[id]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}