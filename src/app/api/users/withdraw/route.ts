import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";
import { getKSTISOString } from "@/lib/utils";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

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

export async function POST(request: NextRequest) {
  try {
    // Authorization 헤더에서 토큰 추출
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          message: "인증되지 않은 사용자",
          error: "Unauthorized",
          status: 401,
          timestamp: getKSTISOString(),
          path: "/api/users/withdraw",
        },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7); // "Bearer " 제거

    // JWT 토큰 검증
    let decoded: {
      userId: string;
      email: string;
      name: string;
      phoneNumber: string;
      role: string;
    };
    try {
      decoded = jwt.verify(token, JWT_SECRET) as {
        userId: string;
        email: string;
        name: string;
        phoneNumber: string;
        role: string;
      };
    } catch {
      return NextResponse.json(
        {
          message: "유효하지 않은 토큰",
          error: "Invalid token",
          status: 401,
          timestamp: getKSTISOString(),
          path: "/api/users/withdraw",
        },
        { status: 401 }
      );
    }

    // 토큰에서 사용자 ID 추출
    const userId = decoded.userId;
    if (!userId) {
      return NextResponse.json(
        {
          message: "토큰에 사용자 정보가 없습니다",
          error: "Invalid token payload",
          status: 401,
          timestamp: getKSTISOString(),
          path: "/api/users/withdraw",
        },
        { status: 401 }
      );
    }

    // 요청 본문 파싱 (필요한 경우만)
    try {
      await request.json();
    } catch {
      // JSON 파싱이 실패해도 진행
    }

    // 현재 사용자 정보 조회
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, email, name, phone_number, is_active")
      .eq("id", userId)
      .single();

    if (userError) {
      console.error("User query error:", userError);
      return NextResponse.json(
        {
          message: "사용자 정보 조회 중 오류가 발생했습니다",
          error: `Database Error: ${userError.message}`,
          status: 500,
          timestamp: getKSTISOString(),
          path: "/api/users/withdraw",
        },
        { status: 500 }
      );
    }

    if (!user) {
      return NextResponse.json(
        {
          message: "사용자를 찾을 수 없습니다",
          error: "User not found",
          status: 404,
          timestamp: getKSTISOString(),
          path: "/api/users/withdraw",
        },
        { status: 404 }
      );
    }

    // 이미 탈퇴한 사용자인지 확인
    if (!user.is_active) {
      return NextResponse.json(
        {
          message: "이미 탈퇴한 사용자입니다",
          error: "User already withdrawn",
          status: 400,
          timestamp: getKSTISOString(),
          path: "/api/users/withdraw",
        },
        { status: 400 }
      );
    }

    // 비밀번호 확인 없이 바로 탈퇴 처리

    // 탈퇴 로그 기록 (삭제 전에 먼저 저장)
    const withdrawalLog = {
      user_id: userId,
      email: user.email,
      name: user.name,
      phone_number: user.phone_number,
      reason: "사용자 요청",
      custom_reason: null,
      withdrawn_at: getKSTISOString(),
    };

    // 탈퇴 로그 테이블에 저장 (테이블이 있는 경우)
    try {
      await supabase.from("withdrawal_logs").insert(withdrawalLog);
    } catch (logError) {
      console.error(
        "Withdrawal log save failed (table may not exist):",
        logError
      );
      // 로그 저장 실패는 탈퇴 프로세스에 영향을 주지 않음
    }

    // 사용자와 관련된 다른 데이터들도 함께 삭제할 수 있도록 트랜잭션 처리
    // 먼저 관련 테이블들의 데이터를 삭제 (외래키 제약 조건 고려)

    // 사용자 관련 데이터 삭제 (예: 메시지, 캠페인 등)
    try {
      // 사용자가 보낸 메시지 삭제 (있는 경우)
      await supabase.from("messages").delete().eq("user_id", userId);

      // 사용자의 캠페인 삭제 (있는 경우)
      await supabase.from("campaigns").delete().eq("user_id", userId);

      // 사용자의 결제 내역 삭제 (있는 경우)
      await supabase.from("transactions").delete().eq("user_id", userId);

      // 사용자의 크레딧 내역 삭제 (있는 경우)
      await supabase.from("credit_transactions").delete().eq("user_id", userId);

      // 사용자의 리워드 내역 삭제 (있는 경우)
      await supabase.from("reward_transactions").delete().eq("user_id", userId);
    } catch (relatedDataError) {
      console.error(
        "Some related data deletion failed (tables may not exist):",
        relatedDataError
      );
      // 관련 데이터 삭제 실패는 사용자 삭제에 영향을 주지 않음
    }

    // 사용자 계정 완전 삭제
    const { error: deleteError } = await supabase
      .from("users")
      .delete()
      .eq("id", userId);

    if (deleteError) {
      console.error("User deletion error:", deleteError);
      return NextResponse.json(
        {
          message: "회원 탈퇴 처리 중 오류가 발생했습니다",
          error: `Database Error: ${deleteError.message}`,
          status: 500,
          timestamp: getKSTISOString(),
          path: "/api/users/withdraw",
        },
        { status: 500 }
      );
    }

    // 성공 응답
    return NextResponse.json(
      {
        message: "회원 탈퇴가 성공적으로 처리되었습니다",
        timestamp: getKSTISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Withdraw user error:", error);
    return NextResponse.json(
      {
        message: "서버 내부 오류",
        error: error instanceof Error ? error.message : "Unknown error",
        status: 500,
        timestamp: getKSTISOString(),
        path: "/api/users/withdraw",
      },
      { status: 500 }
    );
  }
}
