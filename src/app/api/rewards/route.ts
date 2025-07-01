import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";
import { getKSTISOString } from "@/lib/utils";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Supabase 클라이언트 생성
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  db: {
    schema: "public",
  },
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// 리워드 타입 정의
interface RewardTransaction {
  id: string;
  user_id: number;
  type: string;
  amount: number;
  description: string;
  reference_id: string;
  metadata: Record<string, unknown>;
  status: string;
  created_at: string;
  updated_at: string;
  referredUser?: {
    name: string;
    email: string;
  };
  level?: number;
  referralChain?: Array<{
    name: string;
    email: string;
    level: number;
  }>;
}

// 추천 체인 조회 함수 (간단한 버전) - 현재 사용 안함
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function getReferralChain(
  finalUserId: number,
  salespersonId: number
): Promise<Array<{ name: string; email: string; level: number }>> {
  const chain: Array<{ name: string; email: string; level: number }> = [];

  try {
    // 최종 사용자 정보 먼저 추가
    const { data: finalUser } = await supabase
      .from("users")
      .select("name, email")
      .eq("id", finalUserId)
      .single();

    if (finalUser) {
      chain.push({
        name: finalUser.name,
        email: finalUser.email,
        level: 1,
      });
    }

    // 추천 관계 조회하여 체인 구성
    let currentUser = finalUserId;
    let level = 2;

    while (level <= 5) {
      // 최대 5단계까지만
      // 현재 사용자를 추천한 사람 찾기
      const { data: referral } = await supabase
        .from("referrals")
        .select(
          `
          referrer_id,
          users:referrer_id (name, email)
        `
        )
        .eq("referee_id", currentUser)
        .single();

      if (!referral || !referral.users) break;

      const userData = Array.isArray(referral.users)
        ? referral.users[0]
        : referral.users;

      chain.push({
        name: userData.name,
        email: userData.email,
        level: level,
      });

      // 영업사원에 도달하면 종료
      if (referral.referrer_id === salespersonId) break;

      currentUser = referral.referrer_id;
      level++;
    }

    return chain;
  } catch (error) {
    console.error("getReferralChain error:", error);
    return [];
  }
}

interface RewardStats {
  totalReward: number;
  directReward: number;
  indirectReward: number;
  pendingReward: number;
  monthlyReward: number;
}

// 리워드 통계 조회 (transactions 테이블만 사용)
async function getRewardStats(
  userId: number,
  startDate?: string,
  endDate?: string
): Promise<RewardStats> {
  let query = supabase
    .from("transactions")
    .select("amount, metadata, created_at")
    .eq("user_id", userId)
    .eq("type", "charge")
    .like("description", "%리워드%")
    .eq("status", "completed");

  if (startDate && endDate) {
    query = query.gte("created_at", startDate).lte("created_at", endDate);
  }

  const { data: rewards, error } = await query;

  if (error) {
    throw new Error("리워드 통계 조회 실패");
  }

  const stats: RewardStats = {
    totalReward: 0,
    directReward: 0,
    indirectReward: 0,
    pendingReward: 0,
    monthlyReward: 0,
  };

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  rewards?.forEach((reward) => {
    const amount = reward.amount;
    const metadata = reward.metadata || {};
    const createdAt = new Date(reward.created_at);

    stats.totalReward += amount;

    // 이번 달 리워드
    if (
      createdAt.getMonth() === currentMonth &&
      createdAt.getFullYear() === currentYear
    ) {
      stats.monthlyReward += amount;
    }

    // 레벨에 따른 직접/간접 구분
    const level =
      ((metadata as Record<string, unknown>).rewardLevel as number) || 1;
    if (level === 1) {
      stats.directReward += amount;
    } else {
      stats.indirectReward += amount;
    }
  });

  // 미지급 리워드 = 전체 리워드 (정산 테이블 없이 모두 미지급으로 처리)
  stats.pendingReward = stats.totalReward;

  return stats;
}

// 리워드 내역 조회 (transactions 테이블만 사용)
async function getRewardTransactions(
  userId: number,
  type: "all" | "direct" | "indirect" = "all",
  page: number = 1,
  limit: number = 20
): Promise<{ transactions: RewardTransaction[]; total: number }> {
  let query = supabase
    .from("transactions")
    .select("*", { count: "exact" })
    .eq("user_id", userId)
    .eq("type", "charge")
    .like("description", "%리워드%")
    .eq("status", "completed")
    .order("created_at", { ascending: false });

  // 페이지네이션
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  const { data: transactions, error, count } = await query;

  if (error) {
    throw new Error("리워드 내역 조회 실패");
  }

  // 메타데이터 기반 필터링 및 사용자 정보 조회
  const enrichedTransactions = await Promise.all(
    (transactions || []).map(async (transaction) => {
      const metadata = transaction.metadata || {};
      const level =
        typeof metadata === "object" &&
        metadata !== null &&
        "rewardLevel" in metadata
          ? (metadata.rewardLevel as number) || 1
          : 1;

      // 타입별 필터링
      if (type === "direct" && level !== 1) return null;
      if (type === "indirect" && level === 1) return null;

      const originalUserId =
        typeof metadata === "object" &&
        metadata !== null &&
        "originalUserId" in metadata
          ? (metadata.originalUserId as number)
          : null;

      if (originalUserId) {
        const { data: originalUser } = await supabase
          .from("users")
          .select("name, email")
          .eq("id", originalUserId)
          .single();

        // 추천 체인 정보 조회 (간단한 버전)
        let referralChain: Array<{
          name: string;
          email: string;
          level: number;
        }> = [];

        if (originalUser) {
          if (level === 1) {
            // 직접 추천: 일반회원만 표시
            referralChain = [
              {
                name: originalUser.name,
                email: originalUser.email,
                level: 1,
              },
            ];
          } else if (level > 1) {
            // 간접 추천: 일반회원 -> 1차 영업사원 체인 구성
            try {
              // 실제 쿼리도 실행해서 로그 확인
              // 1단계: 일반회원을 직접 추천한 referrer_id 찾기
              const { data: referralData } = await supabase
                .from("referrals")
                .select("referrer_id")
                .eq("referred_user_id", originalUserId)
                .single();

              if (referralData && referralData.referrer_id) {
                // 2단계: 1차 영업사원 정보 조회
                const { data: firstSalespersonData } = await supabase
                  .from("users")
                  .select("name, email, role")
                  .eq("id", referralData.referrer_id)
                  .single();

                if (firstSalespersonData) {
                  // 실제 데이터로 체인 업데이트
                  referralChain = [
                    {
                      name: originalUser.name,
                      email: originalUser.email,
                      level: 1,
                    },
                    {
                      name: firstSalespersonData.name,
                      email: firstSalespersonData.email,
                      level: 2,
                    },
                  ];
                }
              }
            } catch (error) {
              console.error("1차 영업사원 조회 실패:", error);
              // 에러시에도 테스트 체인 유지
              if (referralChain.length === 0) {
                referralChain = [
                  {
                    name: originalUser.name,
                    email: originalUser.email,
                    level: 1,
                  },
                ];
              }
            }
          }
        }

        return {
          ...transaction,
          referredUser: originalUser,
          level,
          referralChain,
        };
      }

      return {
        ...transaction,
        level,
      };
    })
  );

  // null 값 제거 (필터링된 항목들)
  const filteredTransactions = enrichedTransactions.filter(
    (t) => t !== null
  ) as RewardTransaction[];

  return {
    transactions: filteredTransactions,
    total: count || 0,
  };
}

// GET: 리워드 데이터 조회
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          message: "인증되지 않은 사용자",
          error: "Unauthorized",
          status: 401,
          timestamp: getKSTISOString(),
          path: "/api/rewards",
        },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      role: string;
    };
    const userId = parseInt(decoded.userId);

    // 영업사원 권한 확인
    if (decoded.role !== "SALESPERSON") {
      return NextResponse.json(
        {
          message: "영업사원만 리워드를 조회할 수 있습니다",
          error: "Forbidden",
          status: 403,
          timestamp: getKSTISOString(),
          path: "/api/rewards",
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type =
      (searchParams.get("type") as "all" | "direct" | "indirect") || "all";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // 요청 타입에 따른 응답
    const action = searchParams.get("action");

    if (action === "stats") {
      // 통계 조회
      const stats = await getRewardStats(
        userId,
        startDate || undefined,
        endDate || undefined
      );
      return NextResponse.json({
        stats,
        message: "리워드 통계 조회 성공",
        timestamp: getKSTISOString(),
      });
    } else {
      // 내역 조회
      const result = await getRewardTransactions(userId, type, page, limit);
      return NextResponse.json({
        ...result,
        page,
        limit,
        totalPages: Math.ceil(result.total / limit),
        message: "리워드 내역 조회 성공",
        timestamp: getKSTISOString(),
      });
    }
  } catch (error) {
    console.error("Rewards API error:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "서버 오류가 발생했습니다",
        error: "Internal server error",
        status: 500,
        timestamp: getKSTISOString(),
        path: "/api/rewards",
      },
      { status: 500 }
    );
  }
}
