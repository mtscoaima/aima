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

// 특정 예약 조회
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

    const { data, error } = await supabase
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
      .eq("id", reservationId)
      .eq("user_id", userId)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
    }

    return NextResponse.json({ reservation: data });
  } catch (error) {
    console.error("Error in GET /api/reservations/bookings/[id]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// 예약 수정
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
      customer_email,
      start_datetime,
      end_datetime,
      guest_count,
      total_amount,
      deposit_amount,
      special_requirements,
      status,
      payment_status
    } = body;

    // 기존 예약 정보 조회
    const { data: existingReservation } = await supabase
      .from("reservations")
      .select("*")
      .eq("id", reservationId)
      .eq("user_id", userId)
      .single();

    if (!existingReservation) {
      return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
    }

    // 시간이 변경되는 경우 유효성 검증
    if (start_datetime && end_datetime) {
      const startDate = new Date(start_datetime);
      const endDate = new Date(end_datetime);

      if (startDate >= endDate) {
        return NextResponse.json({ error: "End time must be after start time" }, { status: 400 });
      }

      // 시간 중복 검사 (자신 제외)
      const { data: conflictingReservations } = await supabase
        .from("reservations")
        .select("id")
        .eq("space_id", existingReservation.space_id)
        .eq("user_id", userId)
        .neq("id", reservationId)
        .neq("status", "cancelled")
        .or(`start_datetime.lt.${end_datetime},end_datetime.gt.${start_datetime}`);

      if (conflictingReservations && conflictingReservations.length > 0) {
        return NextResponse.json(
          { error: "Time slot conflicts with existing reservation" },
          { status: 409 }
        );
      }
    }

    // 업데이트 데이터 구성
    const updateData: Record<string, string | number | null> = {};

    if (customer_name !== undefined) updateData.customer_name = customer_name.trim();
    if (customer_phone !== undefined) updateData.customer_phone = customer_phone.trim();
    if (customer_email !== undefined) updateData.customer_email = customer_email?.trim() || null;
    if (start_datetime !== undefined) updateData.start_datetime = start_datetime;
    if (end_datetime !== undefined) updateData.end_datetime = end_datetime;
    if (guest_count !== undefined) updateData.guest_count = guest_count;
    if (total_amount !== undefined) updateData.total_amount = total_amount;
    if (deposit_amount !== undefined) updateData.deposit_amount = deposit_amount;
    if (special_requirements !== undefined) updateData.special_requirements = special_requirements?.trim() || null;
    if (status !== undefined) updateData.status = status;
    if (payment_status !== undefined) updateData.payment_status = payment_status;

    const { data, error } = await supabase
      .from("reservations")
      .update(updateData)
      .eq("id", reservationId)
      .eq("user_id", userId)
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

    if (error || !data) {
      console.error("Error updating reservation:", error);
      return NextResponse.json({ error: "Failed to update reservation" }, { status: 500 });
    }

    return NextResponse.json({ reservation: data });
  } catch (error) {
    console.error("Error in PUT /api/reservations/bookings/[id]:", error);
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

    // 예약 존재 여부 및 소유권 확인
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
    console.error("Error in DELETE /api/reservations/bookings/[id]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
