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
  global: {
    headers: {
      "Content-Type": "application/json",
    },
  },
});

interface KakaoUserInfo {
  id: number;
  kakao_account?: {
    email?: string;
    profile?: {
      nickname?: string;
    };
  };
  properties?: {
    nickname?: string;
  };
}

interface NaverUserInfo {
  response: {
    id: string;
    email?: string;
    name?: string;
  };
}

interface GoogleUserInfo {
  id: string;
  email?: string;
  name?: string;
}

export async function POST(request: NextRequest) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("❌ [SNS 연동] Supabase 환경 변수가 설정되지 않았습니다");
      return NextResponse.json(
        {
          message: "서버 설정 오류가 발생했습니다.",
          error: "Missing Supabase configuration",
          status: 500,
          timestamp: getKSTISOString(),
          path: "/api/users/social-link",
        },
        { status: 500 }
      );
    }

    // Authorization 헤더에서 토큰 추출
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          message: "인증되지 않은 사용자",
          error: "접근 권한이 없습니다.",
          status: 401,
          timestamp: getKSTISOString(),
          path: "/api/users/social-link",
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
      console.error("JWT 토큰 검증 실패: 세션이 만료되었습니다. 다시 로그인해주세요.");
      return NextResponse.json(
        {
          message: "세션이 만료되었습니다. 다시 로그인해주세요.",
          error: "Invalid token",
          status: 401,
          timestamp: getKSTISOString(),
          path: "/api/users/social-link",
        },
        { status: 401 }
      );
    }

    const userId = decoded.userId;

    const body = await request.json();
    const { socialType, accessToken } = body;

    if (!socialType || !accessToken) {
      return NextResponse.json(
        {
          message: "소셜 로그인 타입과 액세스 토큰이 필요합니다.",
          error: "Missing required parameters",
          status: 400,
          timestamp: getKSTISOString(),
          path: "/api/users/social-link",
        },
        { status: 400 }
      );
    }

    if (!["kakao", "naver", "google"].includes(socialType)) {
      return NextResponse.json(
        {
          message: "지원하지 않는 소셜 로그인 타입입니다.",
          error: "Unsupported social type",
          status: 400,
          timestamp: getKSTISOString(),
          path: "/api/users/social-link",
        },
        { status: 400 }
      );
    }

    // 현재 사용자 정보 조회
    const { data: currentUser, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (userError || !currentUser) {
      return NextResponse.json(
        {
          message: "계정 정보를 찾을 수 없습니다. 다시 로그인해주세요.",
          error: "User not found",
          status: 404,
          timestamp: getKSTISOString(),
          path: "/api/users/social-link",
        },
        { status: 404 }
      );
    }

    let socialUserId: string = "";
    let socialResponse: Response;

    // 소셜 타입에 따라 사용자 정보 가져오기
    if (socialType === "kakao") {
      socialResponse = await fetch("https://kapi.kakao.com/v2/user/me", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
        },
      });

      if (!socialResponse.ok) {
        return NextResponse.json(
          {
            message: "카카오 사용자 정보를 가져올 수 없습니다.",
            error: "Failed to fetch Kakao user info",
            status: 401,
            timestamp: getKSTISOString(),
            path: "/api/users/social-link",
          },
          { status: 401 }
        );
      }

      const kakaoUser: KakaoUserInfo =
        (await socialResponse.json()) as KakaoUserInfo;
      socialUserId = kakaoUser.id.toString();

      // 이미 연동된 계정이 있는지 확인
      const { data: existingUser } = await supabase
        .from("users")
        .select("id, email, name")
        .eq("kakao_user_id", socialUserId)
        .single();

      if (existingUser && existingUser.id !== userId) {
        return NextResponse.json(
          {
            message: "이미 다른 계정에 연동된 카카오 계정입니다.",
            error: "Already linked to another account",
            status: 409,
            timestamp: getKSTISOString(),
            path: "/api/users/social-link",
            existingUser: {
              email: existingUser.email,
              name: existingUser.name,
            },
          },
          { status: 409 }
        );
      }

      // 현재 사용자가 이미 카카오 계정을 연동했는지 확인
      if (currentUser.kakao_user_id) {
        return NextResponse.json(
          {
            message: "이미 카카오 계정이 연동되어 있습니다.",
            error: "Already linked",
            status: 409,
            timestamp: getKSTISOString(),
            path: "/api/users/social-link",
          },
          { status: 409 }
        );
      }

      // 카카오 계정 연동
      const { error: updateError } = await supabase
        .from("users")
        .update({ kakao_user_id: socialUserId })
        .eq("id", userId);

      if (updateError) {
        return NextResponse.json(
          {
            message: "카카오 계정 연동에 실패했습니다.",
            error: "Failed to link Kakao account",
            status: 500,
            timestamp: getKSTISOString(),
            path: "/api/users/social-link",
          },
          { status: 500 }
        );
      }
    } else if (socialType === "naver") {
      socialResponse = await fetch("https://openapi.naver.com/v1/nid/me", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!socialResponse.ok) {
        return NextResponse.json(
          {
            message: "네이버 사용자 정보를 가져올 수 없습니다.",
            error: "Failed to fetch Naver user info",
            status: 401,
            timestamp: getKSTISOString(),
            path: "/api/users/social-link",
          },
          { status: 401 }
        );
      }

      const naverUser: NaverUserInfo =
        (await socialResponse.json()) as NaverUserInfo;
      socialUserId = naverUser.response.id;

      // 이미 연동된 계정이 있는지 확인
      const { data: existingUser } = await supabase
        .from("users")
        .select("id, email, name")
        .eq("naver_user_id", socialUserId)
        .single();

      if (existingUser && existingUser.id !== userId) {
        return NextResponse.json(
          {
            message: "이미 다른 계정에 연동된 네이버 계정입니다.",
            error: "Already linked to another account",
            status: 409,
            timestamp: getKSTISOString(),
            path: "/api/users/social-link",
            existingUser: {
              email: existingUser.email,
              name: existingUser.name,
            },
          },
          { status: 409 }
        );
      }

      // 현재 사용자가 이미 네이버 계정을 연동했는지 확인
      if (currentUser.naver_user_id) {
        return NextResponse.json(
          {
            message: "이미 네이버 계정이 연동되어 있습니다.",
            error: "Already linked",
            status: 409,
            timestamp: getKSTISOString(),
            path: "/api/users/social-link",
          },
          { status: 409 }
        );
      }

      // 네이버 계정 연동
      const { error: updateError } = await supabase
        .from("users")
        .update({ naver_user_id: socialUserId })
        .eq("id", userId);

      if (updateError) {
        return NextResponse.json(
          {
            message: "네이버 계정 연동에 실패했습니다.",
            error: "Failed to link Naver account",
            status: 500,
            timestamp: getKSTISOString(),
            path: "/api/users/social-link",
          },
          { status: 500 }
        );
      }
    } else if (socialType === "google") {
      socialResponse = await fetch(
        "https://www.googleapis.com/oauth2/v2/userinfo",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!socialResponse.ok) {
        return NextResponse.json(
          {
            message: "구글 사용자 정보를 가져올 수 없습니다.",
            error: "Failed to fetch Google user info",
            status: 401,
            timestamp: getKSTISOString(),
            path: "/api/users/social-link",
          },
          { status: 401 }
        );
      }

      const googleUser: GoogleUserInfo =
        (await socialResponse.json()) as GoogleUserInfo;
      socialUserId = googleUser.id;

      // 이미 연동된 계정이 있는지 확인
      const { data: existingUser } = await supabase
        .from("users")
        .select("id, email, name")
        .eq("google_user_id", socialUserId)
        .single();

      if (existingUser && existingUser.id !== userId) {
        return NextResponse.json(
          {
            message: "이미 다른 계정에 연동된 구글 계정입니다.",
            error: "Already linked to another account",
            status: 409,
            timestamp: getKSTISOString(),
            path: "/api/users/social-link",
            existingUser: {
              email: existingUser.email,
              name: existingUser.name,
            },
          },
          { status: 409 }
        );
      }

      // 현재 사용자가 이미 구글 계정을 연동했는지 확인
      if (currentUser.google_user_id) {
        return NextResponse.json(
          {
            message: "이미 구글 계정이 연동되어 있습니다.",
            error: "Already linked",
            status: 409,
            timestamp: getKSTISOString(),
            path: "/api/users/social-link",
          },
          { status: 409 }
        );
      }

      // 구글 계정 연동
      const { error: updateError } = await supabase
        .from("users")
        .update({ google_user_id: socialUserId })
        .eq("id", userId);

      if (updateError) {
        return NextResponse.json(
          {
            message: "구글 계정 연동에 실패했습니다.",
            error: "Failed to link Google account",
            status: 500,
            timestamp: getKSTISOString(),
            path: "/api/users/social-link",
          },
          { status: 500 }
        );
      }
    }

    // socialUserId가 제대로 할당되었는지 확인
    if (!socialUserId) {
      return NextResponse.json(
        {
          message: "소셜 사용자 ID를 가져올 수 없습니다.",
          error: "Failed to get social user ID",
          status: 500,
          timestamp: getKSTISOString(),
          path: "/api/users/social-link",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: `${
          socialType === "kakao"
            ? "카카오"
            : socialType === "naver"
            ? "네이버"
            : "구글"
        } 계정이 성공적으로 연동되었습니다.`,
        socialType,
        socialUserId,
        timestamp: getKSTISOString(),
        path: "/api/users/social-link",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ [SNS 연동] 전체 에러:", error);
    return NextResponse.json(
      {
        message: "서버 내부 오류가 발생했습니다.",
        error: "Internal server error",
        status: 500,
        timestamp: getKSTISOString(),
        path: "/api/users/social-link",
      },
      { status: 500 }
    );
  }
}

// SNS 연동 해제 API
export async function DELETE(request: NextRequest) {
  try {
    // Authorization 헤더에서 토큰 추출
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          message: "인증되지 않은 사용자",
          error: "접근 권한이 없습니다.",
          status: 401,
          timestamp: getKSTISOString(),
          path: "/api/users/social-link",
        },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // JWT 토큰 검증
    let decoded: { userId: string };
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    } catch {
      console.error("JWT 토큰 검증 실패: 세션이 만료되었습니다. 다시 로그인해주세요.");
      return NextResponse.json(
        {
          message: "세션이 만료되었습니다. 다시 로그인해주세요.",
          error: "Invalid token",
          status: 401,
          timestamp: getKSTISOString(),
          path: "/api/users/social-link",
        },
        { status: 401 }
      );
    }

    const userId = decoded.userId;
    const url = new URL(request.url);
    const socialType = url.searchParams.get("type");

    if (!socialType || !["kakao", "naver", "google"].includes(socialType)) {
      return NextResponse.json(
        {
          message: "유효하지 않은 소셜 로그인 타입입니다.",
          error: "Invalid social type",
          status: 400,
          timestamp: getKSTISOString(),
          path: "/api/users/social-link",
        },
        { status: 400 }
      );
    }

    const updateField = `${socialType}_user_id`;

    // SNS 연동 해제
    const { error: updateError } = await supabase
      .from("users")
      .update({ [updateField]: null })
      .eq("id", userId);

    if (updateError) {
      return NextResponse.json(
        {
          message: "SNS 연동 해제에 실패했습니다.",
          error: "Failed to unlink SNS account",
          status: 500,
          timestamp: getKSTISOString(),
          path: "/api/users/social-link",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: `${
          socialType === "kakao"
            ? "카카오"
            : socialType === "naver"
            ? "네이버"
            : "구글"
        } 계정 연동이 해제되었습니다.`,
        socialType,
        timestamp: getKSTISOString(),
        path: "/api/users/social-link",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ [SNS 연동 해제] 전체 에러:", error);
    return NextResponse.json(
      {
        message: "서버 내부 오류가 발생했습니다.",
        error: "Internal server error",
        status: 500,
        timestamp: getKSTISOString(),
        path: "/api/users/social-link",
      },
      { status: 500 }
    );
  }
}
