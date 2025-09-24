import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";

// 타입 정의
interface NotificationRead {
  user_id: number;
  read_at?: string;
}

interface NotificationWithReads {
  id: number;
  notification_reads?: NotificationRead[];
  [key: string]: unknown;
}

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
    throw new Error("로그인이 필요합니다. 다시 로그인해주세요.");
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
  } catch {
      console.error("JWT 토큰 검증 실패: 유효하지 않은 토큰");
    throw new Error("세션이 만료되었습니다. 다시 로그인해주세요.");
  }
}

// PUT /api/notifications/mark-all-read - 모든 알림을 읽음으로 처리
export async function PUT(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    const currentTime = new Date().toISOString();

    // 1. 개별 사용자 알림들을 모두 읽음으로 처리
    const { error: userNotificationsError } = await supabase
      .from("notifications")
      .update({
        is_read: true,
        read_at: currentTime,
      })
      .eq("recipient_user_id", user.userId)
      .eq("is_read", false);

    if (userNotificationsError) {
      console.error("개별 사용자 알림 읽음 처리 실패:", userNotificationsError);
      return NextResponse.json(
        { error: "개별 알림 읽음 처리에 실패했습니다." },
        { status: 500 }
      );
    }

    // 2. 역할 기반 알림들 조회 (사용자가 아직 읽지 않은 것들만)
    const { data: roleNotifications, error: fetchError } = await supabase
      .from("notifications")
      .select(
        `
        id,
        notification_reads!left (
          user_id
        )
      `
      )
      .eq("recipient_role", user.role);

    if (fetchError) {
      console.error("역할 알림 조회 실패:", fetchError);
      return NextResponse.json(
        { error: "역할 기반 알림 조회에 실패했습니다." },
        { status: 500 }
      );
    }

    // 3. 아직 읽지 않은 역할 기반 알림들 필터링
    const unreadRoleNotifications =
      roleNotifications?.filter((notification: NotificationWithReads) => {
        const hasRead = notification.notification_reads?.some(
          (read: NotificationRead) => read.user_id === parseInt(user.userId)
        );
        return !hasRead;
      }) || [];

    // 4. 읽지 않은 역할 기반 알림들에 대해 읽음 기록 추가
    if (unreadRoleNotifications.length > 0) {
      const readRecords = unreadRoleNotifications.map(
        (notification: NotificationWithReads) => ({
          notification_id: notification.id,
          user_id: parseInt(user.userId),
          read_at: currentTime,
        })
      );

      const { error: insertError } = await supabase
        .from("notification_reads")
        .insert(readRecords);

      if (insertError) {
        console.error("역할 알림 읽음 기록 추가 실패:", insertError);
        return NextResponse.json(
          { error: "역할 기반 알림 읽음 처리에 실패했습니다." },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: "모든 알림이 읽음으로 처리되었습니다.",
      processedCounts: {
        userNotifications: "처리됨", // 정확한 개수는 반환되지 않음
        roleNotifications: unreadRoleNotifications.length,
      },
    });
  } catch (error) {
    console.error("모든 알림 읽음 처리 오류:", error);
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
