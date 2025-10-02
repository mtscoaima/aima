import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";
import { randomBytes } from "crypto";

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

// 고유한 공유 토큰 생성
function generateShareToken(): string {
  return randomBytes(32).toString("hex");
}

// 공유 캘린더 목록 조회
export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: sharedCalendars, error } = await supabase
      .from("shared_calendars")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching shared calendars:", error);
      return NextResponse.json({ error: "Failed to fetch shared calendars" }, { status: 500 });
    }

    return NextResponse.json({ sharedCalendars: sharedCalendars || [] });
  } catch (error) {
    console.error("Error in GET /api/reservations/shared-calendars:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// 새 공유 캘린더 생성
export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      spaceIds,
      reservationDescription
    } = body;

    if (!title || title.trim() === "") {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    // 고유 토큰 생성 (중복 방지)
    let shareToken = generateShareToken();
    let isUnique = false;

    while (!isUnique) {
      const { data: existing } = await supabase
        .from("shared_calendars")
        .select("id")
        .eq("share_token", shareToken)
        .single();

      if (!existing) {
        isUnique = true;
      } else {
        shareToken = generateShareToken();
      }
    }

    const calendarData = {
      user_id: parseInt(userId),
      share_token: shareToken,
      title: title.trim(),
      space_ids: spaceIds || [],
      reservation_description: reservationDescription || null,
    };

    const { data, error } = await supabase
      .from("shared_calendars")
      .insert([calendarData])
      .select()
      .single();

    if (error) {
      console.error("Error creating shared calendar:", error);
      return NextResponse.json({ error: "Failed to create shared calendar" }, { status: 500 });
    }

    return NextResponse.json({ sharedCalendar: data }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/reservations/shared-calendars:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
