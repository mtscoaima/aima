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

// 알림 전송 요청 타입
interface NotificationRequest {
  recipient_user_id?: number | null;
  recipient_role?: string | null;
  sender_user_id?: number | null;
  title: string;
  message: string;
  type?: string;
  action_url?: string | null;
}

// JWT 토큰에서 사용자 정보 추출 (선택적 - 시스템 알림의 경우 필요 없음)
async function getUserFromToken(request: NextRequest): Promise<any | null> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
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
    return null;
  }
}

// POST /api/notifications/send - 새로운 알림 생성 및 전송
export async function POST(request: NextRequest) {
  try {
    const data: NotificationRequest = await request.json();

    // 1. 입력 검증
    if (!data.title || !data.message) {
      return NextResponse.json(
        { error: "제목과 메시지는 필수입니다." },
        { status: 400 }
      );
    }

    // recipient_user_id와 recipient_role 중 하나는 반드시 있어야 함
    if (!data.recipient_user_id && !data.recipient_role) {
      return NextResponse.json(
        { error: "수신자 정보(사용자 ID 또는 역할)가 필요합니다." },
        { status: 400 }
      );
    }

    // 둘 다 있으면 안됨
    if (data.recipient_user_id && data.recipient_role) {
      return NextResponse.json(
        { error: "사용자 ID와 역할 중 하나만 지정해야 합니다." },
        { status: 400 }
      );
    }

    // 2. 인증 확인 (내부 시스템 호출 시에는 토큰이 없을 수 있음)
    const user = await getUserFromToken(request);

    // 3. 알림 데이터 구성
    const notificationData = {
      recipient_user_id: data.recipient_user_id || null,
      recipient_role: data.recipient_role || null,
      sender_user_id:
        data.sender_user_id || (user ? parseInt(user.userId) : null),
      title: data.title.trim(),
      message: data.message.trim(),
      type: data.type || "INFO",
      action_url: data.action_url || null,
      created_at: new Date().toISOString(),
    };

    // 4. 개별 사용자 알림인 경우 사용자 존재 확인
    if (data.recipient_user_id) {
      const { data: userExists, error: userCheckError } = await supabase
        .from("users")
        .select("id")
        .eq("id", data.recipient_user_id)
        .single();

      if (userCheckError || !userExists) {
        return NextResponse.json(
          { error: "수신자를 찾을 수 없습니다." },
          { status: 404 }
        );
      }
    }

    // 5. 역할 기반 알림인 경우 유효한 역할인지 확인
    if (data.recipient_role) {
      const validRoles = ["ADMIN", "SALESPERSON", "USER"];
      if (!validRoles.includes(data.recipient_role)) {
        return NextResponse.json(
          { error: "유효하지 않은 역할입니다." },
          { status: 400 }
        );
      }
    }

    // 6. 알림 생성
    const { data: createdNotification, error: createError } = await supabase
      .from("notifications")
      .insert(notificationData)
      .select()
      .single();

    if (createError) {
      console.error("알림 생성 실패:", createError);
      return NextResponse.json(
        { error: "알림 생성에 실패했습니다." },
        { status: 500 }
      );
    }

    // 7. 역할 기반 알림인 경우 해당 역할의 사용자 수 조회 (통계용)
    let recipientCount = 1;
    if (data.recipient_role) {
      const { count, error: countError } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("role", data.recipient_role);

      if (!countError && count !== null) {
        recipientCount = count;
      }
    }

    return NextResponse.json({
      success: true,
      message: "알림이 성공적으로 전송되었습니다.",
      notification: {
        id: createdNotification.id,
        title: createdNotification.title,
        type: createdNotification.type,
        created_at: createdNotification.created_at,
        recipient_count: recipientCount,
      },
    });
  } catch (error) {
    console.error("알림 전송 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// 내부 함수: 사업자 인증 알림 전송 (다른 API에서 호출용)
export async function sendBusinessVerificationNotification(
  userName: string,
  userId: number
) {
  try {
    const notificationData = {
      recipient_role: "ADMIN",
      sender_user_id: userId,
      title: "새로운 사업자 인증 신청",
      message: `${userName}님이 사업자 인증을 신청했습니다. 검토가 필요합니다.`,
      type: "BUSINESS_VERIFICATION",
      action_url: `/admin/user-management?tab=verification&user_id=${userId}`,
    };

    const { data: createdNotification, error: createError } = await supabase
      .from("notifications")
      .insert(notificationData)
      .select()
      .single();

    if (createError) {
      console.error("사업자 인증 알림 생성 실패:", createError);
      throw new Error("알림 생성에 실패했습니다.");
    }

    return createdNotification;
  } catch (error) {
    console.error("사업자 인증 알림 전송 오류:", error);
    throw error;
  }
}
