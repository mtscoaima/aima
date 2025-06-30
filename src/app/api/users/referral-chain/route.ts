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

export async function GET(request: NextRequest) {
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
          path: "/api/users/referral-chain",
        },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // JWT 토큰 검증
    let decoded: {
      userId: string;
      role: string;
    };

    try {
      decoded = jwt.verify(token, JWT_SECRET) as {
        userId: string;
        role: string;
      };
    } catch {
      return NextResponse.json(
        {
          message: "유효하지 않은 토큰",
          error: "Invalid token",
          status: 401,
          timestamp: getKSTISOString(),
          path: "/api/users/referral-chain",
        },
        { status: 401 }
      );
    }

    const userId = parseInt(decoded.userId);

    // 추천 체인 추적 함수
    const getReferralChain = async (startUserId: number): Promise<number[]> => {
      const chain: number[] = [startUserId];
      let currentUserId = startUserId;

      // 최대 10단계까지만 추적 (무한 루프 방지)
      for (let i = 0; i < 10; i++) {
        // 현재 유저를 추천한 사람 찾기
        const { data: referral, error } = await supabase
          .from("referrals")
          .select("referrer_id")
          .eq("referred_user_id", currentUserId)
          .eq("status", "ACTIVE")
          .single();

        if (error || !referral) {
          // 더 이상 추천한 사람이 없으면 체인 종료
          break;
        }

        // 추천한 사람을 체인에 추가
        chain.push(referral.referrer_id);
        currentUserId = referral.referrer_id;
      }

      return chain;
    };

    // 현재 사용자의 추천 체인 조회
    const referralChain = await getReferralChain(userId);

    // 체인을 문자열로 변환 (예: "3->2->1")
    const chainString = referralChain.join("->");

    console.log(`추천 체인: ${chainString}`);

    return NextResponse.json({
      userId: userId,
      referralChain: referralChain,
      chainString: chainString,
      message: "추천 체인 조회 성공",
      timestamp: getKSTISOString(),
    });
  } catch (error) {
    console.error("Referral chain error:", error);
    return NextResponse.json(
      {
        message: "서버 오류가 발생했습니다",
        error: "Internal server error",
        status: 500,
        timestamp: getKSTISOString(),
        path: "/api/users/referral-chain",
      },
      { status: 500 }
    );
  }
}
