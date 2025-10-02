import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";
import * as XLSX from "xlsx";

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

// 날짜/시간 포맷팅 함수
function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${year}.${month}.${day} 목 ${hours}:${minutes}`;
}

// Excel 파일 다운로드
export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year");
    const month = searchParams.get("month");
    const spaceId = searchParams.get("space_id");

    if (!year || !month) {
      return NextResponse.json({ error: "Year and month are required" }, { status: 400 });
    }

    // 해당 월의 시작일과 종료일 계산
    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999);

    const startDateStr = startDate.toISOString();
    const endDateStr = endDate.toISOString();

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
      .eq("user_id", userId)
      .gte("start_datetime", startDateStr)
      .lte("start_datetime", endDateStr)
      .neq("status", "cancelled")
      .order("start_datetime", { ascending: true });

    if (spaceId && spaceId !== "all") {
      query = query.eq("space_id", parseInt(spaceId));
    }

    const { data: reservations, error } = await query;

    if (error) {
      console.error("Error fetching reservations for export:", error);
      return NextResponse.json({ error: "Failed to fetch reservations" }, { status: 500 });
    }

    // Excel 데이터 생성
    const excelData = reservations?.map((reservation) => ({
      "공간 캘린더명": reservation.spaces?.name || "",
      "입실 시간": formatDateTime(reservation.start_datetime),
      "퇴실 시간": formatDateTime(reservation.end_datetime),
      "예약 채널": (() => {
        const channelMap: { [key: string]: string } = {
          manual: "전화예약",
          airbnb: "에어비앤비",
          booking: "부킹닷컴",
          naver: "네이버",
          kakao: "카카오",
          etc: "기타"
        };
        return channelMap[reservation.booking_channel || "manual"] || reservation.booking_channel;
      })(),
      "이름": reservation.customer_name || "",
      "휴대폰 번호": reservation.customer_phone || "",
      "메모": reservation.special_requirements || "",
      "총 금액": reservation.total_amount || 0,
    })) || [];

    // 워크북 생성
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // 열 너비 설정
    const colWidths = [
      { wch: 15 }, // 공간 캘린더명
      { wch: 20 }, // 입실 시간
      { wch: 20 }, // 퇴실 시간
      { wch: 15 }, // 예약 채널
      { wch: 12 }, // 이름
      { wch: 15 }, // 휴대폰 번호
      { wch: 40 }, // 메모
      { wch: 12 }, // 총 금액
    ];
    worksheet['!cols'] = colWidths;

    // 워크시트를 워크북에 추가
    XLSX.utils.book_append_sheet(workbook, worksheet, "예약 내역");

    // Excel 파일 생성
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // 파일명 생성
    const filename = `예약내역_${year}년_${month}월.xlsx`;

    // Excel 응답 반환
    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Error in Excel export:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}