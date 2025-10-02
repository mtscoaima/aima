import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 공개 공유 캘린더 조회 (인증 불필요)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    // 공유 캘린더 조회
    const { data: sharedCalendar, error: calendarError } = await supabase
      .from("shared_calendars")
      .select("*")
      .eq("share_token", token)
      .single();

    if (calendarError || !sharedCalendar) {
      return NextResponse.json({ error: "Shared calendar not found" }, { status: 404 });
    }

    // 조회수 증가
    await supabase
      .from("shared_calendars")
      .update({
        view_count: (sharedCalendar.view_count || 0) + 1,
        last_viewed_at: new Date().toISOString()
      })
      .eq("id", sharedCalendar.id);

    // 예약 데이터 조회 (오늘 이후 예약만)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let reservationQuery = supabase
      .from("reservations")
      .select("*")
      .eq("user_id", sharedCalendar.user_id)
      .in("status", ["confirmed", "checked_in"]) // 확정된 예약만 표시
      .gte("start_datetime", today.toISOString()); // 오늘 이후 예약만

    // space_ids 필터 적용
    if (sharedCalendar.space_ids && sharedCalendar.space_ids.length > 0) {
      reservationQuery = reservationQuery.in("space_id", sharedCalendar.space_ids);
    }

    const { data: reservations, error: reservationError } = await reservationQuery;

    if (reservationError) {
      console.error("Error fetching reservations:", reservationError);
      return NextResponse.json({
        error: "Failed to fetch reservations",
        details: reservationError.message
      }, { status: 500 });
    }

    // 공간 정보 별도 조회
    const spaceIds = [...new Set(reservations?.map(r => r.space_id) || [])];
    const { data: spaces } = await supabase
      .from("spaces")
      .select("id, name, icon_text, icon_color")
      .in("id", spaceIds);

    const spaceMap = new Map(spaces?.map(s => [s.id, s]) || []);

    // 고객 정보는 항상 "비공개" 처리 (프론트엔드에서 마스킹)
    const filteredReservations = (reservations || []).map((reservation) => {
      const space = spaceMap.get(reservation.space_id);
      return {
        id: reservation.id,
        space_id: reservation.space_id,
        customer_name: reservation.customer_name, // 프론트엔드에서 마스킹 처리
        customer_phone: "비공개",
        customer_email: "비공개",
        guest_count: reservation.guest_count,
        amount: null, // 금액은 항상 비공개
        start_time: reservation.start_datetime,
        end_time: reservation.end_datetime,
        status: reservation.status,
        notes: reservation.notes,
        spaces: space || {
          id: reservation.space_id,
          name: "알 수 없음",
          icon_text: "?",
          icon_color: "#999999"
        },
      };
    });

    return NextResponse.json({
      calendar: {
        title: sharedCalendar.title,
        reservation_description: sharedCalendar.reservation_description,
      },
      reservations: filteredReservations,
    });
  } catch (error) {
    console.error("Error in GET /api/shared/calendar/[token]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
