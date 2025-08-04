import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";

// 서버 사이드에서는 서비스 역할 키 사용
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  db: {
    schema: "public",
  },
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// JWT 토큰에서 사용자 정보 추출
async function getUserFromToken(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("인증 토큰이 필요합니다.");
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      email: string;
      name: string;
      phoneNumber: string;
      role: string;
    };
    return decoded;
  } catch (error) {
    throw new Error("유효하지 않은 토큰입니다.");
  }
}

// PUT /api/notifications/[id]/read - 특정 알림을 읽음으로 처리
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromToken(request);
    const notificationId = parseInt(params.id);

    if (isNaN(notificationId)) {
      return NextResponse.json(
        { error: "유효하지 않은 알림 ID입니다." },
        { status: 400 }
      );
    }

    // 1. 알림 정보 조회
    const { data: notification, error: fetchError } = await supabase
      .from("notifications")
      .select("*")
      .eq("id", notificationId)
      .single();

    if (fetchError || !notification) {
      console.error("알림 조회 실패:", fetchError);
      return NextResponse.json(
        { error: "알림을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 2. 권한 확인 - 개별 사용자 알림인 경우
    if (notification.recipient_user_id) {
      if (notification.recipient_user_id !== parseInt(user.userId)) {
        return NextResponse.json(
          { error: "해당 알림에 접근할 권한이 없습니다." },
          { status: 403 }
        );
      }

      // 개별 사용자 알림의 읽음 처리
      const { error: updateError } = await supabase
        .from("notifications")
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq("id", notificationId);

      if (updateError) {
        console.error("알림 읽음 처리 실패:", updateError);
        return NextResponse.json(
          { error: "알림 읽음 처리에 실패했습니다." },
          { status: 500 }
        );
      }
    }
    // 3. 역할 기반 알림인 경우
    else if (notification.recipient_role) {
      if (notification.recipient_role !== user.role) {
        return NextResponse.json(
          { error: "해당 알림에 접근할 권한이 없습니다." },
          { status: 403 }
        );
      }

      // notification_reads 테이블에 읽음 기록 추가 (UPSERT)
      const { error: upsertError } = await supabase
        .from("notification_reads")
        .upsert(
          {
            notification_id: notificationId,
            user_id: parseInt(user.userId),
            read_at: new Date().toISOString(),
          },
          {
            onConflict: "notification_id,user_id",
          }
        );

      if (upsertError) {
        console.error("알림 읽음 기록 추가 실패:", upsertError);
        return NextResponse.json(
          { error: "알림 읽음 처리에 실패했습니다." },
          { status: 500 }
        );
      }
    } else {
      return NextResponse.json(
        { error: "알림 타입이 올바르지 않습니다." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "알림이 읽음으로 처리되었습니다.",
    });
  } catch (error) {
    console.error("알림 읽음 처리 오류:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "서버 오류가 발생했습니다.",
      },
      {
        status:
          error instanceof Error && error.message.includes("토큰") ? 401 : 500,
      }
    );
  }
}
