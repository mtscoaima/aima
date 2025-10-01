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

// 개별 예약 조회
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
    const reservationId = parseInt(id);
    if (isNaN(reservationId)) {
      return NextResponse.json({ error: "Invalid reservation ID" }, { status: 400 });
    }

    // 예약 정보와 공간 정보를 함께 조회
    const { data: reservation, error } = await supabase
      .from("reservations")
      .select(`
        *,
        spaces (
          name,
          icon_text,
          icon_color
        )
      `)
      .eq("id", reservationId)
      .eq("user_id", userId)
      .single();

    if (error) {
      console.error("Error fetching reservation:", error);
      return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
    }

    // 응답 데이터 구조화
    const formattedReservation = {
      ...reservation,
      space_name: reservation.spaces?.name || "",
      space_icon_text: reservation.spaces?.icon_text || "",
      space_icon_color: reservation.spaces?.icon_color || "#gray-500",
      // 예약 상세 페이지에서 사용할 필드 매핑
      people_count: reservation.guest_count,
      amount: reservation.total_amount
    };

    return NextResponse.json({ reservation: formattedReservation });
  } catch (error) {
    console.error("Error in GET /api/reservations/[id]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// 예약 정보 수정
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
    const reservationId = parseInt(id);
    if (isNaN(reservationId)) {
      return NextResponse.json({ error: "Invalid reservation ID" }, { status: 400 });
    }

    const body = await request.json();
    const { 
      customer_name, 
      customer_phone, 
      reservation_date, 
      start_time, 
      end_time, 
      people_count, 
      amount,
      total_amount, 
      payment_status,
      memo,
      special_requirements
    } = body;

    // 먼저 예약의 존재 여부와 소유권 확인
    const { data: reservation, error: findError } = await supabase
      .from("reservations")
      .select("id")
      .eq("id", reservationId)
      .eq("user_id", userId)
      .single();

    if (findError) {
      console.error('Error finding reservation:', findError);
      return NextResponse.json({ error: "Reservation not found", details: findError }, { status: 404 });
    }

    if (!reservation) {
      return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
    }

    // 업데이트할 데이터 준비
    const updateData: Record<string, string | number | null> = {};
    if (customer_name !== undefined) updateData.customer_name = customer_name;
    if (customer_phone !== undefined) updateData.customer_phone = customer_phone;
    if (reservation_date !== undefined) updateData.reservation_date = reservation_date;
    if (start_time !== undefined) updateData.start_time = start_time;
    if (end_time !== undefined) updateData.end_time = end_time;
    if (people_count !== undefined) updateData.guest_count = people_count;
    if (amount !== undefined) updateData.total_amount = amount;
    if (total_amount !== undefined) updateData.total_amount = total_amount;
    if (payment_status !== undefined) updateData.payment_status = payment_status;
    if (memo !== undefined) updateData.special_requirements = memo;
    if (special_requirements !== undefined) updateData.special_requirements = special_requirements;

    // 예약 정보 업데이트
    const { data, error } = await supabase
      .from("reservations")
      .update(updateData)
      .eq("id", reservationId)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      console.error("Error updating reservation:", error);
      return NextResponse.json({ error: "Failed to update reservation", details: error }, { status: 500 });
    }

    return NextResponse.json({ reservation: data });
  } catch (error) {
    console.error("Error in PUT /api/reservations/[id]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// 예약 삭제
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
    const reservationId = parseInt(id);
    if (isNaN(reservationId)) {
      return NextResponse.json({ error: "Invalid reservation ID" }, { status: 400 });
    }

    // 먼저 예약의 존재 여부와 소유권 확인
    const { data: reservation } = await supabase
      .from("reservations")
      .select("id")
      .eq("id", reservationId)
      .eq("user_id", userId)
      .single();

    if (!reservation) {
      return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
    }

    // 예약 삭제
    const { error } = await supabase
      .from("reservations")
      .delete()
      .eq("id", reservationId)
      .eq("user_id", userId);

    if (error) {
      console.error("Error deleting reservation:", error);
      return NextResponse.json({ error: "Failed to delete reservation" }, { status: 500 });
    }

    return NextResponse.json({ message: "Reservation deleted successfully" });
  } catch (error) {
    console.error("Error in DELETE /api/reservations/[id]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}