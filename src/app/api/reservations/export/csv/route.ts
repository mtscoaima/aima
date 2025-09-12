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

// CSV 형식으로 변환
function convertToCSV(data: any[]): string {
  if (data.length === 0) {
    return "";
  }

  // CSV 헤더
  const headers = [
    "예약ID",
    "공간명",
    "고객명",
    "전화번호", 
    "이메일",
    "예약시작시간",
    "예약종료시간",
    "인원수",
    "총금액",
    "예치금",
    "예약상태",
    "결제상태",
    "예약채널",
    "특별요청사항",
    "등록일시"
  ];

  // CSV 데이터 행들
  const rows = data.map(reservation => [
    reservation.id,
    reservation.spaces?.name || "",
    reservation.customer_name,
    reservation.customer_phone,
    reservation.customer_email || "",
    new Date(reservation.start_datetime).toLocaleString("ko-KR"),
    new Date(reservation.end_datetime).toLocaleString("ko-KR"),
    reservation.guest_count,
    reservation.total_amount,
    reservation.deposit_amount,
    reservation.status,
    reservation.payment_status,
    reservation.booking_channel,
    reservation.special_requirements || "",
    new Date(reservation.created_at).toLocaleString("ko-KR")
  ]);

  // CSV 문자열 생성 (Excel에서 한글 깨짐 방지를 위해 BOM 추가)
  const csvContent = [headers, ...rows]
    .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  return "\uFEFF" + csvContent; // BOM 추가
}

// CSV 파일 다운로드
export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const spaceId = searchParams.get("space_id");
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");
    const status = searchParams.get("status");

    // 예약 데이터 조회
    let query = supabase
      .from("reservations")
      .select(`
        *,
        spaces:space_id (
          id,
          name,
          icon_text,
          icon_color
        )
      `)
      .eq("user_id", userId);

    // 필터 적용
    if (spaceId) {
      query = query.eq("space_id", parseInt(spaceId));
    }

    if (startDate) {
      query = query.gte("start_datetime", startDate);
    }

    if (endDate) {
      query = query.lte("start_datetime", endDate);
    }

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query.order("start_datetime", { ascending: false });

    if (error) {
      console.error("Error fetching reservations for export:", error);
      return NextResponse.json({ error: "Failed to fetch reservations" }, { status: 500 });
    }

    // CSV 변환
    const csvData = convertToCSV(data || []);
    
    // 파일명 생성 (현재 날짜 포함)
    const today = new Date().toISOString().split('T')[0];
    const filename = `reservations_${today}.csv`;

    // CSV 응답 반환
    return new NextResponse(csvData, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Error in CSV export:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}