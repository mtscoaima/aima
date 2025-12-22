import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { sendEmail, createUsernameEmailTemplate } from "@/lib/emailUtils";

// Supabase 클라이언트 생성
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { verificationId, name, email } = body;

    let usernames: string[] = [];

    if (verificationId) {
      // 휴대폰 본인인증으로 아이디 찾기
      const cookieStore = await cookies();
      const verificationCookie = cookieStore.get("kmc_verification");

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

        // 본인인증 정보로 사용자 검색
        const { userInfo } = verificationData;
        const { data: users, error } = await supabase
          .from("users")
          .select("username")
          .eq("name", userInfo.name)
          .eq("phone_number", userInfo.phoneNumber)
          .eq("birth_date", userInfo.birthDate);

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

        usernames =
          users?.map((user: { username: string }) => user.username) || [];

        // 인증 쿠키 삭제 (한 번 사용 후 삭제)
        cookieStore.delete("kmc_verification");
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

      // 휴대폰 인증의 경우 바로 결과 반환
      return NextResponse.json({
        success: true,
        usernames,
      });
    } else if (name && email) {
      // 이메일로 아이디 찾기
      if (!name.trim() || !email.trim()) {
        return NextResponse.json(
          {
            success: false,
            message: "이름과 이메일을 모두 입력해주세요.",
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

      // 이름과 이메일로 사용자 검색
      const { data: users, error } = await supabase
        .from("users")
        .select("username")
        .eq("name", name.trim())
        .eq("email", email.trim().toLowerCase());

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

      usernames =
        users?.map((user: { username: string }) => user.username) || [];

      if (usernames.length > 0) {
        // 아이디를 이메일로 전송
        try {
          const { html, text } = createUsernameEmailTemplate(
            usernames,
            name.trim()
          );
          const emailResult = await sendEmail({
            to: email.trim().toLowerCase(),
            subject: `[MTS플러스] ${name.trim()}님의 아이디 찾기 결과`,
            html,
            text,
          });

          if (!emailResult.success) {
            return NextResponse.json(
              {
                success: false,
                message: "이메일 전송 중 오류가 발생했습니다.",
              },
              { status: 500 }
            );
          }

          return NextResponse.json({
            success: true,
            emailSent: true,
            message: "등록된 아이디 정보를 이메일로 전송했습니다.",
          });
        } catch (emailError) {
          console.error("이메일 전송 오류:", emailError);
          return NextResponse.json(
            {
              success: false,
              message: "이메일 전송 중 오류가 발생했습니다.",
            },
            { status: 500 }
          );
        }
      } else {
        return NextResponse.json({
          success: true,
          emailSent: false,
          message: "입력하신 정보와 일치하는 아이디가 없습니다.",
        });
      }
    } else {
      return NextResponse.json(
        {
          success: false,
          message: "필수 정보가 누락되었습니다.",
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("아이디 찾기 오류:", error);
    return NextResponse.json(
      {
        success: false,
        message: "아이디 찾기 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
