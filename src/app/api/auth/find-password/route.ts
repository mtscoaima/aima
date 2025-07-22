import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import { sendEmail, createTempPasswordEmailTemplate } from "@/lib/emailUtils";

// Supabase 클라이언트 생성
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
    const body = await request.json();
    const { verificationId, username, name, email } = body;

    if (!username?.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "아이디를 입력해주세요.",
        },
        { status: 400 }
      );
    }

    let foundUser = null;

    if (verificationId) {
      // 휴대폰 본인인증으로 비밀번호 찾기
      const cookieStore = await cookies();
      const verificationCookie = cookieStore.get("inicis_verification");

      if (!verificationCookie) {
        return NextResponse.json(
          {
            success: false,
            message: "본인인증 정보가 만료되었습니다. 다시 인증해주세요.",
          },
          { status: 400 }
        );
      }

      try {
        const verificationData = JSON.parse(verificationCookie.value);

        // verificationId 일치 확인
        if (verificationData.verificationId !== verificationId) {
          return NextResponse.json(
            {
              success: false,
              message: "유효하지 않은 본인인증 정보입니다.",
            },
            { status: 400 }
          );
        }

        // 30분 이내인지 확인
        const elapsed = Date.now() - verificationData.timestamp;
        if (elapsed > 30 * 60 * 1000) {
          return NextResponse.json(
            {
              success: false,
              message: "본인인증 정보가 만료되었습니다. 다시 인증해주세요.",
            },
            { status: 400 }
          );
        }

        // 본인인증 정보와 아이디로 사용자 검색
        const { userInfo } = verificationData;

        const { data: user, error } = await supabase
          .from("users")
          .select("id, username, name, email")
          .eq("username", username.trim())
          .eq("name", userInfo.name)
          .eq("phone_number", userInfo.phoneNumber)
          .eq("birth_date", userInfo.birthDate)
          .maybeSingle();

        if (error) {
          console.error("사용자 검색 오류:", error);
          return NextResponse.json(
            {
              success: false,
              message: "사용자 검색 중 오류가 발생했습니다.",
            },
            { status: 500 }
          );
        }

        foundUser = user;

        // 인증 쿠키 삭제 (한 번 사용 후 삭제)
        cookieStore.delete("inicis_verification");
      } catch (parseError) {
        console.error("본인인증 정보 파싱 오류:", parseError);
        return NextResponse.json(
          {
            success: false,
            message: "본인인증 정보 처리 중 오류가 발생했습니다.",
          },
          { status: 500 }
        );
      }
    } else if (name && email) {
      // 이메일로 비밀번호 찾기
      if (!name.trim() || !email.trim()) {
        return NextResponse.json(
          {
            success: false,
            message: "아이디, 이름, 이메일을 모두 입력해주세요.",
          },
          { status: 400 }
        );
      }

      // 이메일 형식 검증
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          {
            success: false,
            message: "올바른 이메일 형식이 아닙니다.",
          },
          { status: 400 }
        );
      }

      const { data: user, error } = await supabase
        .from("users")
        .select("id, username, name, email")
        .eq("username", username.trim())
        .eq("name", name.trim())
        .eq("email", email.trim().toLowerCase())
        .maybeSingle();

      if (error) {
        console.error("사용자 검색 오류:", error);
        return NextResponse.json(
          {
            success: false,
            message: "사용자 검색 중 오류가 발생했습니다.",
          },
          { status: 500 }
        );
      }

      foundUser = user;
    } else {
      return NextResponse.json(
        {
          success: false,
          message: "필수 정보가 누락되었습니다.",
        },
        { status: 400 }
      );
    }

    if (!foundUser) {
      return NextResponse.json(
        {
          success: false,
          message: "입력하신 정보와 일치하는 계정이 없습니다.",
        },
        { status: 404 }
      );
    }

    // 임시 비밀번호 생성
    const tempPassword = generateTempPassword();
    const hashedTempPassword = await bcrypt.hash(tempPassword, 12);

    // 데이터베이스에서 비밀번호 업데이트
    const { error: updateError } = await supabase
      .from("users")
      .update({
        password: hashedTempPassword,
        updated_at: new Date().toISOString(),
      })
      .eq("id", foundUser.id);

    if (updateError) {
      console.error("비밀번호 업데이트 오류:", updateError);
      return NextResponse.json(
        {
          success: false,
          message: "비밀번호 업데이트 중 오류가 발생했습니다.",
        },
        { status: 500 }
      );
    }

    // 임시 비밀번호를 이메일로 전송
    try {
      const { html, text } = createTempPasswordEmailTemplate(
        tempPassword,
        foundUser.name,
        foundUser.username
      );
      const emailResult = await sendEmail({
        to: foundUser.email,
        subject: `[MTS플러스] ${foundUser.name}님의 임시 비밀번호 안내`,
        html,
        text,
      });

      if (!emailResult.success) {
        // 비밀번호는 이미 변경되었으므로 롤백하지 않고 에러만 기록
        console.error("이메일 전송 실패:", emailResult.error);
        return NextResponse.json(
          {
            success: false,
            message:
              "임시 비밀번호가 생성되었으나 이메일 전송에 실패했습니다. 관리자에게 문의하세요.",
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `${foundUser.email}로 임시 비밀번호를 전송했습니다. 이메일을 확인해주세요.`,
      });
    } catch (emailError) {
      console.error("이메일 전송 오류:", emailError);
      return NextResponse.json(
        {
          success: false,
          message:
            "임시 비밀번호가 생성되었으나 이메일 전송에 실패했습니다. 관리자에게 문의하세요.",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("비밀번호 찾기 오류:", error);
    return NextResponse.json(
      {
        success: false,
        message: "비밀번호 찾기 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
