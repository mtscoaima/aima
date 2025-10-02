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

// 개별 공유 캘린더 조회
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
    const calendarId = parseInt(id);
    if (isNaN(calendarId)) {
      return NextResponse.json({ error: "Invalid calendar ID" }, { status: 400 });
    }

    const { data: sharedCalendar, error } = await supabase
      .from("shared_calendars")
      .select("*")
      .eq("id", calendarId)
      .eq("user_id", userId)
      .single();

    if (error) {
      console.error("Error fetching shared calendar:", error);
      return NextResponse.json({ error: "Shared calendar not found" }, { status: 404 });
    }

    return NextResponse.json({ sharedCalendar });
  } catch (error) {
    console.error("Error in GET /api/reservations/shared-calendars/[id]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// 공유 캘린더 수정
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
    const calendarId = parseInt(id);
    if (isNaN(calendarId)) {
      return NextResponse.json({ error: "Invalid calendar ID" }, { status: 400 });
    }

    const body = await request.json();
    const {
      title,
      description,
      isActive,
      expiresAt,
      displaySettings,
      spaceIds
    } = body;

    // 공유 캘린더 존재 여부 및 소유권 확인
    const { data: calendar } = await supabase
      .from("shared_calendars")
      .select("id")
      .eq("id", calendarId)
      .eq("user_id", userId)
      .single();

    if (!calendar) {
      return NextResponse.json({ error: "Shared calendar not found" }, { status: 404 });
    }

    // 업데이트할 데이터 준비
    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description;
    if (isActive !== undefined) updateData.is_active = isActive;
    if (expiresAt !== undefined) updateData.expires_at = expiresAt;
    if (displaySettings !== undefined) updateData.display_settings = displaySettings;
    if (spaceIds !== undefined) updateData.space_ids = spaceIds;

    const { data, error } = await supabase
      .from("shared_calendars")
      .update(updateData)
      .eq("id", calendarId)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      console.error("Error updating shared calendar:", error);
      return NextResponse.json({ error: "Failed to update shared calendar" }, { status: 500 });
    }

    return NextResponse.json({ sharedCalendar: data });
  } catch (error) {
    console.error("Error in PUT /api/reservations/shared-calendars/[id]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// 공유 캘린더 삭제
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
    const calendarId = parseInt(id);
    if (isNaN(calendarId)) {
      return NextResponse.json({ error: "Invalid calendar ID" }, { status: 400 });
    }

    // 공유 캘린더 존재 여부 및 소유권 확인
    const { data: calendar } = await supabase
      .from("shared_calendars")
      .select("id")
      .eq("id", calendarId)
      .eq("user_id", userId)
      .single();

    if (!calendar) {
      return NextResponse.json({ error: "Shared calendar not found" }, { status: 404 });
    }

    const { error } = await supabase
      .from("shared_calendars")
      .delete()
      .eq("id", calendarId)
      .eq("user_id", userId);

    if (error) {
      console.error("Error deleting shared calendar:", error);
      return NextResponse.json({ error: "Failed to delete shared calendar" }, { status: 500 });
    }

    return NextResponse.json({ message: "Shared calendar deleted successfully" });
  } catch (error) {
    console.error("Error in DELETE /api/reservations/shared-calendars/[id]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
