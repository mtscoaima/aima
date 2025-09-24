import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { sendEmail, createTempPasswordEmailTemplate } from "@/lib/emailUtils";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
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

// 관리자 권한 확인
async function verifyAdminToken(request: NextRequest): Promise<{
  isValid: boolean;
  userId?: string;
  error?: string;
}> {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.error("로그인이 필요합니다. 다시 로그인해주세요.");
      return { isValid: false, error: "로그인이 필요합니다. 다시 로그인해주세요." };
    }

    const token = authHeader.substring(7);
    if (!token) {
      return { isValid: false, error: "토큰이 없습니다." };
    }

    let decoded: { userId: string };
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    } catch (jwtError) {
      console.error("JWT verification failed:", jwtError);
      return { isValid: false, error: "세션이 만료되었습니다. 다시 로그인해주세요." };
    }

    if (!decoded.userId) {
      return { isValid: false, error: "토큰에 사용자 ID가 없습니다." };
    }

    // Supabase에서 사용자 정보 조회하여 role 및 활성 상태 확인
    const { data: user, error } = await supabase
      .from("users")
      .select("id, role, is_active")
      .eq("id", decoded.userId)
      .single();

    if (error) {
      console.error("Database query error:", error);
      return { isValid: false, error: "사용자 조회 중 오류가 발생했습니다." };
    }

    if (!user) {
      return { isValid: false, error: "계정 정보를 찾을 수 없습니다. 다시 로그인해주세요." };
    }

    if (!user.is_active) {
      return { isValid: false, error: "이용이 제한된 계정입니다. 고객센터에 문의해주세요." };
    }

    if (user.role !== "ADMIN") {
      return { isValid: false, error: "접근 권한이 없습니다." };
    }

    return { isValid: true, userId: decoded.userId };
  } catch (error) {
    console.error("Token verification error:", error);
    return { isValid: false, error: "일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요." };
  }
}

// 임시 비밀번호 생성 함수
function generateTempPassword(length: number = 12): string {
  const charset =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  let password = "";

  // 각 타입별로 최소 1개씩 포함
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const special = "!@#$%^&*";

  password += upper[Math.floor(Math.random() * upper.length)];
  password += lower[Math.floor(Math.random() * lower.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];

  // 나머지 길이만큼 랜덤 문자 추가
  for (let i = 4; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }

  // 문자열 섞기
  return password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
}

export async function POST(request: NextRequest) {
  try {
    // 관리자 권한 확인
    const {
      isValid,
      error: authError,
      userId: adminId,
    } = await verifyAdminToken(request);
    if (!isValid) {
      return NextResponse.json(
        { message: authError || "접근 권한이 없습니다.", success: false },
        { status: 403 }
      );
    }

    const requestData = await request.json();
    const { userId } = requestData;

    if (!userId) {
      return NextResponse.json(
        { message: "사용자 ID가 필요합니다.", success: false },
        { status: 400 }
      );
    }

    // 대상 사용자 정보 조회
    const { data: targetUser, error: userError } = await supabase
      .from("users")
      .select("id, username, name, email, role")
      .eq("id", userId)
      .single();

    if (userError || !targetUser) {
      console.error("Target user query error:", userError);
      return NextResponse.json(
        { message: "사용자 정보 조회 중 오류가 발생했습니다.", success: false },
        { status: 500 }
      );
    }

    // 관리자 계정의 비밀번호는 초기화할 수 없음
    if (targetUser.role === "ADMIN") {
      return NextResponse.json(
        { message: "관리자 계정의 비밀번호는 초기화할 수 없습니다.", success: false },
        { status: 400 }
      );
    }

    // 관리자 정보 조회 (로그 기록용)
    const { data: adminUser } = await supabase
      .from("users")
      .select("name, email")
      .eq("id", adminId)
      .single();

    // 임시 비밀번호 생성
    const tempPassword = generateTempPassword();
    const hashedTempPassword = await bcrypt.hash(tempPassword, 12);

    // 데이터베이스에서 비밀번호 업데이트
    const now = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("users")
      .update({
        password: hashedTempPassword,
        updated_at: now,
        approval_log: {
          changed_by: adminUser?.name || adminUser?.email || "관리자",
          changed_by_email: adminUser?.email,
          changed_at: now,
          action: "PASSWORD_RESET",
          admin_id: adminId,
          description: "관리자가 비밀번호를 초기화했습니다.",
        },
      })
      .eq("id", userId);

    if (updateError) {
      console.error("Password update error:", updateError);
      return NextResponse.json(
        {
          message: "비밀번호 업데이트 중 오류가 발생했습니다.",
          success: false,
        },
        { status: 500 }
      );
    }

    // 임시 비밀번호를 이메일로 전송
    try {
      const { html, text } = createTempPasswordEmailTemplate(
        tempPassword,
        targetUser.name,
        targetUser.username
      );
      
      const emailResult = await sendEmail({
        to: targetUser.email,
        subject: `[MTS플러스] ${targetUser.name}님의 비밀번호 초기화 안내 (관리자 요청)`,
        html,
        text,
      });

      if (!emailResult.success) {
        console.error("Email sending failed:", emailResult.error);
        return NextResponse.json(
          {
            success: false,
            message:
              "비밀번호가 초기화되었으나 이메일 전송에 실패했습니다. 사용자에게 직접 임시 비밀번호를 안내해 주세요.",
            tempPassword, // 이메일 실패 시 관리자가 직접 전달할 수 있도록
          },
          { status: 200 } // 비밀번호 초기화는 성공했으므로 200
        );
      }

      return NextResponse.json({
        success: true,
        message: `${targetUser.name}님의 비밀번호가 초기화되었습니다. ${targetUser.email}로 임시 비밀번호가 전송되었습니다.`,
      });
    } catch (emailError) {
      console.error("Email sending error:", emailError);
      return NextResponse.json(
        {
          success: false,
          message:
            "비밀번호가 초기화되었으나 이메일 전송에 실패했습니다. 사용자에게 직접 임시 비밀번호를 안내해 주세요.",
          tempPassword, // 이메일 실패 시 관리자가 직접 전달할 수 있도록
        },
        { status: 200 } // 비밀번호 초기화는 성공했으므로 200
      );
    }
  } catch (error) {
    console.error("Password reset error:", error);
    return NextResponse.json(
      {
        message: "비밀번호 초기화 중 오류가 발생했습니다.",
        success: false,
      },
      { status: 500 }
    );
  }
}