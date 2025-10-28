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

// POST /api/reservations/channels/custom
// 커스텀 채널 추가
export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { channelName } = body;

    // 입력 검증
    if (!channelName || typeof channelName !== "string") {
      return NextResponse.json(
        { error: "Channel name is required" },
        { status: 400 }
      );
    }

    const trimmedName = channelName.trim();
    if (trimmedName.length === 0) {
      return NextResponse.json(
        { error: "Channel name cannot be empty" },
        { status: 400 }
      );
    }

    if (trimmedName.length > 100) {
      return NextResponse.json(
        { error: "Channel name is too long (max 100 characters)" },
        { status: 400 }
      );
    }

    // 1. 중복 체크 (시스템 채널 + 사용자의 커스텀 채널)
    const { data: existingChannel } = await supabase
      .from("booking_channels")
      .select("id, user_id")
      .eq("name", trimmedName)
      .or(`user_id.is.null,user_id.eq.${userId}`)
      .single();

    if (existingChannel) {
      if (existingChannel.user_id === null) {
        return NextResponse.json(
          { error: "This channel name already exists as a system channel" },
          { status: 409 }
        );
      } else {
        return NextResponse.json(
          { error: "You already have a channel with this name" },
          { status: 409 }
        );
      }
    }

    // 2. 현재 사용자의 커스텀 채널 개수 조회 (display_order 계산용)
    const { count } = await supabase
      .from("booking_channels")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    const displayOrder = (count || 0) + 1000; // 시스템 채널 뒤에 표시

    // 3. 커스텀 채널 추가
    const { data, error } = await supabase
      .from("booking_channels")
      .insert({
        name: trimmedName,
        user_id: parseInt(userId),
        display_order: displayOrder,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating custom channel:", error);
      return NextResponse.json(
        { error: "Failed to create custom channel" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      channel: {
        id: data.id,
        name: data.name,
        isCustom: true,
        displayOrder: data.display_order,
      },
    });
  } catch (error) {
    console.error("Error in POST /api/reservations/channels/custom:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/reservations/channels/custom?id=123
// 커스텀 채널 삭제
export async function DELETE(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const channelId = searchParams.get("id");

    if (!channelId) {
      return NextResponse.json(
        { error: "Channel ID is required" },
        { status: 400 }
      );
    }

    // 1. 채널 조회 (본인 소유 확인)
    const { data: channel, error: fetchError } = await supabase
      .from("booking_channels")
      .select("*")
      .eq("id", channelId)
      .eq("user_id", userId)
      .single();

    if (fetchError || !channel) {
      return NextResponse.json(
        { error: "Channel not found or you don't have permission" },
        { status: 404 }
      );
    }

    // 2. 채널 삭제
    const { error: deleteError } = await supabase
      .from("booking_channels")
      .delete()
      .eq("id", channelId)
      .eq("user_id", userId);

    if (deleteError) {
      console.error("Error deleting custom channel:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete custom channel" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Channel deleted successfully",
    });
  } catch (error) {
    console.error("Error in DELETE /api/reservations/channels/custom:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/reservations/channels/custom?id=123
// 커스텀 채널 수정
export async function PUT(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const channelId = searchParams.get("id");

    if (!channelId) {
      return NextResponse.json(
        { error: "Channel ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { channelName } = body;

    // 입력 검증
    if (!channelName || typeof channelName !== "string") {
      return NextResponse.json(
        { error: "Channel name is required" },
        { status: 400 }
      );
    }

    const trimmedName = channelName.trim();
    if (trimmedName.length === 0) {
      return NextResponse.json(
        { error: "Channel name cannot be empty" },
        { status: 400 }
      );
    }

    if (trimmedName.length > 100) {
      return NextResponse.json(
        { error: "Channel name is too long (max 100 characters)" },
        { status: 400 }
      );
    }

    // 1. 채널 조회 (본인 소유 확인)
    const { data: channel, error: fetchError } = await supabase
      .from("booking_channels")
      .select("*")
      .eq("id", channelId)
      .eq("user_id", userId)
      .single();

    if (fetchError || !channel) {
      return NextResponse.json(
        { error: "Channel not found or you don't have permission" },
        { status: 404 }
      );
    }

    // 2. 중복 체크 (시스템 채널 + 사용자의 다른 커스텀 채널)
    const { data: existingChannel } = await supabase
      .from("booking_channels")
      .select("id, user_id")
      .eq("name", trimmedName)
      .or(`user_id.is.null,user_id.eq.${userId}`)
      .neq("id", channelId)
      .single();

    if (existingChannel) {
      if (existingChannel.user_id === null) {
        return NextResponse.json(
          { error: "This channel name already exists as a system channel" },
          { status: 409 }
        );
      } else {
        return NextResponse.json(
          { error: "You already have a channel with this name" },
          { status: 409 }
        );
      }
    }

    // 3. 채널 업데이트
    const { data, error: updateError } = await supabase
      .from("booking_channels")
      .update({ name: trimmedName })
      .eq("id", channelId)
      .eq("user_id", userId)
      .select()
      .single();

    if (updateError || !data) {
      console.error("Error updating custom channel:", updateError);
      return NextResponse.json(
        { error: "Failed to update custom channel" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      channel: {
        id: data.id,
        name: data.name,
        isCustom: true,
        displayOrder: data.display_order,
      },
    });
  } catch (error) {
    console.error("Error in PUT /api/reservations/channels/custom:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
