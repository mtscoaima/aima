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
  is_read?: boolean;
  read_at?: string | null;
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
  } catch {
    throw new Error("유효하지 않은 토큰입니다.");
  }
}

// GET /api/notifications - 알림 목록 조회
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const unreadOnly = searchParams.get("unread_only") === "true";

    const offset = (page - 1) * limit;

    // 1. 사용자 개별 알림 조회
    let userNotificationsQuery = supabase
      .from("notifications")
      .select("*")
      .eq("recipient_user_id", user.userId)
      .order("created_at", { ascending: false });

    if (unreadOnly) {
      userNotificationsQuery = userNotificationsQuery.eq("is_read", false);
    }

    const { data: userNotifications, error: userError } =
      await userNotificationsQuery;

    if (userError) {
      console.error("사용자 알림 조회 실패:", userError);
      return NextResponse.json(
        { error: "알림을 불러오는데 실패했습니다." },
        { status: 500 }
      );
    }

    // 2. 역할 기반 알림 조회
    const roleNotificationsQuery = supabase
      .from("notifications")
      .select(
        `
        *,
        notification_reads!left (
          user_id,
          read_at
        )
      `
      )
      .eq("recipient_role", user.role)
      .order("created_at", { ascending: false });

    const { data: roleNotifications, error: roleError } =
      await roleNotificationsQuery;

    if (roleError) {
      console.error("역할 알림 조회 실패:", roleError);
      return NextResponse.json(
        { error: "알림을 불러오는데 실패했습니다." },
        { status: 500 }
      );
    }

    // 3. 역할 기반 알림에 읽음 상태 추가 및 필터링
    const processedRoleNotifications =
      roleNotifications
        ?.map((notification: NotificationWithReads) => {
          const readRecord = notification.notification_reads?.find(
            (read: NotificationRead) => read.user_id === parseInt(user.userId)
          );

          return {
            ...notification,
            is_read: !!readRecord,
            read_at: readRecord?.read_at || null,
            notification_reads: undefined, // 응답에서 제거
          };
        })
        .filter((notification: NotificationWithReads) => {
          return unreadOnly ? !notification.is_read : true;
        }) || [];

    // 4. 모든 알림 합치기 및 정렬
    const allNotifications = [
      ...(userNotifications || []),
      ...processedRoleNotifications,
    ].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    // 5. 페이지네이션 적용
    const paginatedNotifications = allNotifications.slice(
      offset,
      offset + limit
    );

    // 6. 읽지 않은 알림 개수 계산
    const unreadCount = allNotifications.filter(
      (notification) => !notification.is_read
    ).length;

    return NextResponse.json({
      notifications: paginatedNotifications,
      pagination: {
        page,
        limit,
        total: allNotifications.length,
        totalPages: Math.ceil(allNotifications.length / limit),
      },
      unreadCount,
    });
  } catch (error) {
    console.error("알림 조회 오류:", error);
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
