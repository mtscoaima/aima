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

// 예약 목록 조회
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
      console.error("Error fetching reservations:", error);
      return NextResponse.json({ error: "Failed to fetch reservations" }, { status: 500 });
    }

    return NextResponse.json({ reservations: data || [] });
  } catch (error) {
    console.error("Error in GET /api/reservations/bookings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// 예약 생성
export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      space_id,
      customer_name,
      customer_phone,
      customer_email,
      start_datetime,
      end_datetime,
      guest_count,
      total_amount,
      deposit_amount,
      special_requirements,
      booking_type,
      booking_channel
    } = body;

    // 필수 필드 검증
    if (!space_id || !customer_name || !customer_phone || !start_datetime || !end_datetime) {
      return NextResponse.json(
        { error: "Missing required fields: space_id, customer_name, customer_phone, start_datetime, end_datetime" },
        { status: 400 }
      );
    }

    // 공간 소유권 확인
    const { data: space } = await supabase
      .from("spaces")
      .select("id")
      .eq("id", space_id)
      .eq("user_id", userId)
      .single();

    if (!space) {
      return NextResponse.json({ error: "Space not found or access denied" }, { status: 404 });
    }

    // 시간 유효성 검증
    const startDate = new Date(start_datetime);
    const endDate = new Date(end_datetime);
    
    if (startDate >= endDate) {
      return NextResponse.json({ error: "End time must be after start time" }, { status: 400 });
    }

    // 예약 시간 중복 검사 (날짜와 시간 모두 고려)
    // 겹치는 조건: (기존 시작 < 새로운 끝) AND (기존 끝 > 새로운 시작)
    const { data: conflictingReservations, error: conflictError } = await supabase
      .from("reservations")
      .select("id, start_datetime, end_datetime")
      .eq("space_id", space_id)
      .eq("user_id", userId)
      .neq("status", "cancelled")
      .lt("start_datetime", end_datetime)
      .gt("end_datetime", start_datetime);

    if (conflictError) {
      console.error("Error checking reservation conflicts:", conflictError);
      return NextResponse.json({ error: "Failed to check reservation conflicts" }, { status: 500 });
    }

    if (conflictingReservations && conflictingReservations.length > 0) {
      console.log("=== RESERVATION CONFLICT DETECTED ===");
      console.log("New reservation attempt:");
      console.log("  Start:", start_datetime);
      console.log("  End:", end_datetime);
      console.log("Conflicting existing reservations:");
      conflictingReservations.forEach((res, index) => {
        console.log(`  ${index + 1}. ID: ${res.id}, Start: ${res.start_datetime}, End: ${res.end_datetime}`);
      });
      console.log("=====================================");
      
      return NextResponse.json(
        { 
          error: "Time slot conflicts with existing reservation",
          conflictingReservations: conflictingReservations.map(res => ({
            id: res.id,
            start_datetime: res.start_datetime,
            end_datetime: res.end_datetime
          }))
        },
        { status: 409 }
      );
    }

    // 예약 데이터 생성
    const reservationData = {
      user_id: parseInt(userId),
      space_id: parseInt(space_id),
      customer_name: customer_name.trim(),
      customer_phone: customer_phone.trim(),
      customer_email: customer_email?.trim() || null,
      start_datetime,
      end_datetime,
      guest_count: guest_count || 1,
      total_amount: total_amount || 0,
      deposit_amount: deposit_amount || 0,
      special_requirements: special_requirements?.trim() || null,
      booking_type: booking_type || "hourly",
      status: "confirmed",
      payment_status: "pending",
      booking_channel: booking_channel || "manual"
    };

    const { data, error } = await supabase
      .from("reservations")
      .insert([reservationData])
      .select(`
        *,
        spaces:space_id (
          id,
          name,
          icon_text,
          icon_color
        )
      `)
      .single();

    if (error) {
      console.error("Error creating reservation:", error);
      return NextResponse.json({ error: "Failed to create reservation" }, { status: 500 });
    }

    return NextResponse.json({ reservation: data }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/reservations/bookings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}