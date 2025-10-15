import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface JWTPayload {
  userId: number;
  email: string;
}

// DELETE: 주소록 그룹 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "인증 토큰이 필요합니다" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET!;
    const decoded = jwt.verify(token, jwtSecret) as JWTPayload;

    const { id } = await params;
    const groupId = parseInt(id);
    if (isNaN(groupId)) {
      return NextResponse.json({ error: "유효하지 않은 그룹 ID입니다" }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 그룹이 현재 사용자의 것인지 확인
    const { data: group, error: fetchError } = await supabase
      .from("address_book_groups")
      .select("id, user_id")
      .eq("id", groupId)
      .single();

    if (fetchError || !group) {
      return NextResponse.json({ error: "그룹을 찾을 수 없습니다" }, { status: 404 });
    }

    if (group.user_id !== decoded.userId) {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
    }

    // 그룹 삭제 (CASCADE로 연락처도 자동 삭제됨)
    const { error: deleteError } = await supabase
      .from("address_book_groups")
      .delete()
      .eq("id", groupId);

    if (deleteError) {
      console.error("그룹 삭제 오류:", deleteError);
      return NextResponse.json({ error: "그룹 삭제 실패" }, { status: 500 });
    }

    return NextResponse.json({ message: "그룹이 삭제되었습니다" }, { status: 200 });
  } catch (error) {
    console.error("그룹 삭제 에러:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
