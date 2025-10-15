import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface JWTPayload {
  userId: number;
  email: string;
}

// GET: 사용자의 주소록 그룹 목록 조회
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "인증 토큰이 필요합니다" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET!;
    const decoded = jwt.verify(token, jwtSecret) as JWTPayload;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: groups, error } = await supabase
      .from("address_book_groups")
      .select("*")
      .eq("user_id", decoded.userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("주소록 그룹 조회 오류:", error);
      return NextResponse.json({ error: "주소록 그룹 조회 실패" }, { status: 500 });
    }

    return NextResponse.json({ groups }, { status: 200 });
  } catch (error) {
    console.error("주소록 그룹 조회 에러:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

// POST: 새 주소록 그룹 생성
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "인증 토큰이 필요합니다" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET!;
    const decoded = jwt.verify(token, jwtSecret) as JWTPayload;

    const body = await request.json();
    const { group_name, description, custom_fields } = body;

    if (!group_name?.trim()) {
      return NextResponse.json({ error: "그룹명을 입력해주세요" }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: newGroup, error } = await supabase
      .from("address_book_groups")
      .insert({
        user_id: decoded.userId,
        group_name: group_name.trim(),
        description: description || null,
        custom_fields: custom_fields || []
      })
      .select()
      .single();

    if (error) {
      console.error("주소록 그룹 생성 오류:", error);
      return NextResponse.json({ error: "주소록 그룹 생성 실패" }, { status: 500 });
    }

    return NextResponse.json({ group: newGroup }, { status: 201 });
  } catch (error) {
    console.error("주소록 그룹 생성 에러:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
