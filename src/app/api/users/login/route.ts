import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getKSTISOString, generateReferralCode } from "@/lib/utils";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// 서버 사이드에서는 서비스 역할 키 사용
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// 서비스 키 사용
const supabaseKey = supabaseServiceKey;

const supabase = createClient(supabaseUrl, supabaseKey, {
  db: {
    schema: "public",
  },
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  global: {
    headers: {
      "Content-Type": "application/json",
    },
  },
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    // 입력 검증
    if (!username || !password) {
      return NextResponse.json(
        {
          message: "아이디와 비밀번호는 필수입니다.",
          error: "Missing required fields",
          status: 400,
          timestamp: getKSTISOString(),
          path: "/api/users/login",
          fieldErrors: [
            {
              field: !username ? "username" : "password",
              message: !username
                ? "아이디는 필수입니다."
                : "비밀번호는 필수입니다.",
            },
          ],
        },
        { status: 400 }
      );
    }

    // 아이디 형식 검증
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      return NextResponse.json(
        {
          message: "올바른 아이디 형식이 아닙니다.",
          error: "Invalid username format",
          status: 400,
          timestamp: getKSTISOString(),
          path: "/api/users/login",
          fieldErrors: [
            {
              field: "username",
              message:
                "아이디는 영문, 숫자, 언더스코어만 사용하여 3-20자로 입력하세요.",
            },
          ],
        },
        { status: 400 }
      );
    }

    // 사용자 조회
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("username", username)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        {
          message: "사용자를 찾을 수 없습니다.",
          error: "User not found",
          status: 404,
          timestamp: getKSTISOString(),
          path: "/api/users/login",
          fieldErrors: [
            {
              field: "username",
              message: "등록되지 않은 아이디입니다.",
            },
          ],
        },
        { status: 404 }
      );
    }

    // 비밀번호 검증
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        {
          message: "비밀번호가 일치하지 않습니다.",
          error: "Invalid password",
          status: 401,
          timestamp: getKSTISOString(),
          path: "/api/users/login",
          fieldErrors: [
            {
              field: "password",
              message: "비밀번호가 올바르지 않습니다.",
            },
          ],
        },
        { status: 401 }
      );
    }

    // 계정 활성화 상태 확인
    if (!user.is_active) {
      return NextResponse.json(
        {
          message: "비활성화된 계정입니다.",
          error: "Account deactivated",
          status: 401,
          timestamp: getKSTISOString(),
          path: "/api/users/login",
          fieldErrors: [
            {
              field: "username",
              message: "계정이 비활성화되어 있습니다. 관리자에게 문의하세요.",
            },
          ],
        },
        { status: 401 }
      );
    }

    // JWT 토큰 생성
    const accessToken = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        phoneNumber: user.phone_number,
        role: user.role,
        approval_status: user.approval_status,
      },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    const refreshToken = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        phoneNumber: user.phone_number,
        type: "refresh",
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // 영업사원인 경우 추천 코드가 없다면 생성
    let updatedUser = user;
    if (user.role === "SALESPERSON" && !user.referral_code) {
      const referralCode = generateReferralCode(user.id);

      // 중복 검증
      let attempts = 0;
      let uniqueReferralCode = referralCode;

      while (attempts < 10) {
        const { data: existingCode } = await supabase
          .from("users")
          .select("id")
          .eq("referral_code", uniqueReferralCode)
          .maybeSingle();

        if (!existingCode) break;

        uniqueReferralCode = generateReferralCode(user.id + attempts);
        attempts++;
      }

      // 추천 코드 저장
      const { data: updatedUserData, error: referralUpdateError } =
        await supabase
          .from("users")
          .update({ referral_code: uniqueReferralCode })
          .eq("id", user.id)
          .select("*")
          .single();

      if (referralUpdateError) {
        console.error("Failed to update referral code:", referralUpdateError);
      } else if (updatedUserData) {
        updatedUser = updatedUserData;
      }
    }

    // 마지막 로그인 시간 업데이트 (한국 시간 사용)
    const updateTime = getKSTISOString();
    const { error: updateError } = await supabase
      .from("users")
      .update({ last_login_at: updateTime })
      .eq("id", user.id)
      .select("last_login_at");

    if (updateError) {
      console.error("Failed to update last_login_at:", updateError);
      console.error("Update error details:", {
        code: updateError.code,
        message: updateError.message,
        details: updateError.details,
        hint: updateError.hint,
      });
    } else {
      // 업데이트 후 실제 값 확인
      const { error: verifyError } = await supabase
        .from("users")
        .select("last_login_at")
        .eq("id", user.id)
        .single();

      if (verifyError) {
        console.error("Failed to verify last_login_at update:", verifyError);
      }
    }

    // 로그인 시 발신번호 자동 추가 체크
    if (user.phone_number) {
      try {
        // 사용자의 본인 전화번호가 발신번호로 등록되어 있는지 확인
        const { data: existingSenderNumber } = await supabase
          .from("sender_numbers")
          .select("id")
          .eq("user_id", user.id)
          .eq("is_user_phone", true)
          .maybeSingle();

        if (!existingSenderNumber) {
          // 본인 전화번호가 발신번호로 등록되어 있지 않은 경우 자동 추가
          // 전화번호 정규화 (하이픈 형식으로)
          let normalizedPhoneNumber = user.phone_number;
          const digitsOnly = user.phone_number.replace(/[^0-9]/g, "");
          const phoneRegexWithHyphen = /^010-[0-9]{4}-[0-9]{4}$/;
          const phoneRegexWithoutHyphen = /^010[0-9]{8}$/;

          if (phoneRegexWithHyphen.test(user.phone_number)) {
            normalizedPhoneNumber = user.phone_number;
          } else if (phoneRegexWithoutHyphen.test(digitsOnly)) {
            normalizedPhoneNumber = digitsOnly.replace(
              /(\d{3})(\d{4})(\d{4})/,
              "$1-$2-$3"
            );
          }

          // 기존 발신번호가 있는지 확인 (기본값 설정용)
          const { count: senderCount } = await supabase
            .from("sender_numbers")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id);

          const isFirstNumber = senderCount === 0;

          // 발신번호 자동 추가
          const { error: senderNumberError } = await supabase
            .from("sender_numbers")
            .insert({
              user_id: user.id,
              phone_number: normalizedPhoneNumber,
              display_name: `${user.name} (본인)`,
              is_default: isFirstNumber, // 첫 번째 발신번호면 기본값으로 설정
              is_user_phone: true, // 본인 전화번호 표시
              is_verified: false,
              status: "ACTIVE",
              created_at: updateTime,
              updated_at: updateTime,
            });

          if (senderNumberError) {
            console.error(
              "로그인 시 발신번호 자동 추가 실패:",
              senderNumberError
            );
          }
        }
      } catch (senderError) {
        console.error("로그인 시 발신번호 체크 중 오류:", senderError);
        // 발신번호 추가 실패는 치명적이지 않으므로 로그만 남기고 계속 진행
      }
    }

    // 성공 응답
    return NextResponse.json(
      {
        accessToken,
        refreshToken,
        tokenType: "Bearer",
        expiresIn: 3600,
        user: {
          id: updatedUser.id,
          username: updatedUser.username,
          email: updatedUser.email,
          name: updatedUser.name,
          phoneNumber: updatedUser.phone_number,
          role: updatedUser.role,
          createdAt: updatedUser.created_at,
          updatedAt: updatedUser.updated_at,
          approval_status: updatedUser.approval_status,
          referralCode: updatedUser.referral_code, // 추천 코드 포함
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("로그인 에러:", error);
    return NextResponse.json(
      {
        message: "서버 내부 오류가 발생했습니다.",
        error: "Internal server error",
        status: 500,
        timestamp: getKSTISOString(),
        path: "/api/users/login",
        fieldErrors: [],
      },
      { status: 500 }
    );
  }
}
