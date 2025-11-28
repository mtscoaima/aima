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

// 공간 목록 조회
export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 공간 목록 조회
    const { data: spacesData, error } = await supabase
      .from("spaces")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false});

    if (error) {
      console.error("Error fetching spaces:", error);
      return NextResponse.json({ error: "Failed to fetch spaces" }, { status: 500 });
    }

    return NextResponse.json({ spaces: spacesData || [] });
  } catch (error) {
    console.error("Error in GET /api/reservations/spaces:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// 공간 생성
export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, icon_text, icon_color } = body;

    if (!name || name.trim() === "") {
      return NextResponse.json({ error: "Space name is required" }, { status: 400 });
    }

    const spaceData = {
      user_id: parseInt(userId),
      name: name.trim(),
      icon_text: icon_text || name.substring(0, 2),
      icon_color: icon_color || "#8BC34A"
    };

    const { data, error } = await supabase
      .from("spaces")
      .insert([spaceData])
      .select()
      .single();

    if (error) {
      console.error("Error creating space:", error);
      return NextResponse.json({ error: "Failed to create space" }, { status: 500 });
    }

    return NextResponse.json({ space: data }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/reservations/spaces:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}