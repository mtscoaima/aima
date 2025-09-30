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

// 통계 데이터 조회
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

    // 공간 목록 조회
    const { data: spaces, error: spacesError } = await supabase
      .from("spaces")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (spacesError) {
      console.error("Error fetching spaces:", spacesError);
      return NextResponse.json({ error: "Failed to fetch spaces" }, { status: 500 });
    }

    // 예약 데이터 조회
    let query = supabase
      .from("reservations")
      .select(`
        id,
        space_id,
        customer_name,
        guest_count,
        total_amount,
        deposit_amount,
        booking_channel,
        status,
        payment_status,
        start_datetime,
        end_datetime,
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
      .neq("status", "cancelled");

    if (spaceId && spaceId !== "all") {
      query = query.eq("space_id", parseInt(spaceId));
    }

    const { data: reservations, error: reservationsError } = await query;

    if (reservationsError) {
      console.error("Error fetching reservations:", reservationsError);
      return NextResponse.json({ error: "Failed to fetch reservations" }, { status: 500 });
    }

    // 전체 통계 계산
    const totalAmount = reservations?.reduce((sum, res) => sum + (res.total_amount || 0), 0) || 0;
    const totalReservations = reservations?.length || 0;
    const totalGuests = reservations?.reduce((sum, res) => sum + (res.guest_count || 0), 0) || 0;

    // 공간별 통계 계산
    const spaceStatistics = spaces?.map(space => {
      const spaceReservations = reservations?.filter(res => res.space_id === space.id) || [];
      const spaceAmount = spaceReservations.reduce((sum, res) => sum + (res.total_amount || 0), 0);
      const spaceCount = spaceReservations.length;
      const spaceGuests = spaceReservations.reduce((sum, res) => sum + (res.guest_count || 0), 0);
      const spacePercentage = totalAmount > 0 ? (spaceAmount / totalAmount) * 100 : 0;

      return {
        space_id: space.id,
        space_name: space.name,
        icon_text: space.icon_text,
        icon_color: space.icon_color,
        total_amount: spaceAmount,
        reservation_count: spaceCount,
        guest_count: spaceGuests,
        percentage: spacePercentage
      };
    }).filter(stat => stat.reservation_count > 0) || [];

    // 예약 채널별 통계 계산
    const channelStatistics: { [key: string]: any } = {};
    reservations?.forEach(res => {
      const channel = res.booking_channel || "manual";
      if (!channelStatistics[channel]) {
        channelStatistics[channel] = {
          channel,
          total_amount: 0,
          reservation_count: 0,
          guest_count: 0
        };
      }
      channelStatistics[channel].total_amount += res.total_amount || 0;
      channelStatistics[channel].reservation_count += 1;
      channelStatistics[channel].guest_count += res.guest_count || 0;
    });

    const channelStats = Object.values(channelStatistics).map(stat => ({
      ...stat,
      percentage: totalAmount > 0 ? (stat.total_amount / totalAmount) * 100 : 0
    }));

    // 채널 이름 한글화
    const channelNameMap: { [key: string]: string } = {
      manual: "전화",
      airbnb: "에어비앤비",
      booking: "부킹닷컴",
      naver: "네이버",
      kakao: "카카오",
      etc: "기타"
    };

    const translatedChannelStats = channelStats.map(stat => ({
      ...stat,
      channel_name: channelNameMap[stat.channel] || stat.channel
    }));

    return NextResponse.json({
      summary: {
        total_amount: totalAmount,
        total_reservations: totalReservations,
        total_guests: totalGuests
      },
      space_statistics: spaceStatistics,
      channel_statistics: translatedChannelStats,
      spaces: spaces || []
    });
  } catch (error) {
    console.error("Error in GET /api/reservations/statistics:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}