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

interface ReferralData {
  id: number;
  name: string;
  joinDate: string;
  status: "활성" | "비활성" | "대기";
  totalPayment: number;
  email: string;
  children?: ReferralData[];
  level?: number;
}

interface DashboardStats {
  totalReferrals: number;
  monthlyNewSignups: number;
  totalRevenue: number;
  referralList: ReferralData[];
  dailyRevenue: Array<{ date: string; amount: number }>;
  monthlyRevenue: Array<{ period: string; amount: number }>;
}

// Supabase 조인 쿼리 결과 타입
interface UserJoinResult {
  id: number;
  name: string;
  email: string;
  created_at: string;
  is_active: boolean;
  approval_status: string;
}

// 재귀적으로 모든 하위 추천인을 찾는 함수
async function getAllSubReferrals(
  userId: number,
  visited: Set<number> = new Set(),
  maxDepth: number = 10,
  currentDepth: number = 0
): Promise<number[]> {
  // 무한 루프 방지
  if (visited.has(userId) || currentDepth >= maxDepth) {
    return [];
  }

  visited.add(userId);
  const allReferrals: number[] = [];

  try {
    // 직접 추천인들 조회
    const { data: directReferrals, error } = await supabase
      .from("referrals")
      .select("referred_user_id")
      .eq("referrer_id", userId)
      .eq("status", "ACTIVE");

    if (error || !directReferrals) {
      return [];
    }

    // 직접 추천인들을 결과에 추가
    const directReferralIds = directReferrals.map((r) => r.referred_user_id);
    allReferrals.push(...directReferralIds);

    // 각 직접 추천인의 하위 추천인들도 재귀적으로 조회
    for (const referralId of directReferralIds) {
      const subReferrals = await getAllSubReferrals(
        referralId,
        new Set(visited),
        maxDepth,
        currentDepth + 1
      );
      allReferrals.push(...subReferrals);
    }

    return allReferrals;
  } catch (error) {
    console.error("Error getting sub-referrals:", error);
    return [];
  }
}

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
          path: "/api/referrals/dashboard",
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
          path: "/api/referrals/dashboard",
        },
        { status: 401 }
      );
    }

    const userId = parseInt(decoded.userId);

    // 영업사원 권한 확인
    if (decoded.role !== "SALESPERSON") {
      return NextResponse.json(
        {
          message: "영업사원만 대시보드를 조회할 수 있습니다",
          error: "Forbidden",
          status: 403,
          timestamp: getKSTISOString(),
          path: "/api/referrals/dashboard",
        },
        { status: 403 }
      );
    }

    // 현재 사용자의 referral_code 조회
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("referral_code, created_at")
      .eq("id", userId)
      .single();

    if (userError || !user || !user.referral_code) {
      return NextResponse.json(
        {
          message: "추천 코드를 찾을 수 없습니다",
          error: "Referral code not found",
          status: 404,
          timestamp: getKSTISOString(),
          path: "/api/referrals/dashboard",
        },
        { status: 404 }
      );
    }

    // 1. 모든 하위 추천인 조회 (재귀적)
    const allSubReferralIds = await getAllSubReferrals(userId);
    const totalReferrals = allSubReferralIds.length;

    // 2. 이번 달 신규 가입자 수 조회 (하위 추천인 포함)
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const monthStart = `${currentYear}-${currentMonth
      .toString()
      .padStart(2, "0")}-01`;

    let nextMonth = currentMonth + 1;
    let nextYear = currentYear;
    if (nextMonth > 12) {
      nextMonth = 1;
      nextYear++;
    }
    const monthEnd = `${nextYear}-${nextMonth.toString().padStart(2, "0")}-01`;

    // 이번 달에 가입한 하위 추천인들 필터링
    let monthlyNewSignups = 0;
    if (allSubReferralIds.length > 0) {
      const { data: monthlyReferrals, error: monthlyError } = await supabase
        .from("referrals")
        .select("referred_user_id")
        .in("referred_user_id", allSubReferralIds)
        .eq("status", "ACTIVE")
        .gte("created_at", monthStart)
        .lt("created_at", monthEnd);

      if (!monthlyError && monthlyReferrals) {
        monthlyNewSignups = monthlyReferrals.length;
      } else if (monthlyError) {
        console.error("Error counting monthly signups:", monthlyError);
      }
    }

    // 3. 추천인 목록 조회 (계층구조 포함) - 재귀 함수를 사용하여 처리

    // 4. 재귀적으로 하위 추천인 트리를 구성하는 함수
    async function buildReferralTree(
      userId: number,
      level: number = 1,
      maxDepth: number = 5
    ): Promise<ReferralData[]> {
      if (level > maxDepth) return [];

      const { data: referralUsers, error: referralUsersError } = await supabase
        .from("referrals")
        .select(
          `
          referred_user_id,
          created_at,
          users!referrals_referred_user_id_fkey (
            id,
            name,
            email,
            created_at,
            is_active,
            approval_status
          )
        `
        )
        .eq("referrer_id", userId)
        .eq("status", "ACTIVE")
        .order("created_at", { ascending: false });

      if (referralUsersError || !referralUsers) return [];

      const referralList: ReferralData[] = [];

      for (const referral of referralUsers) {
        const referredUser = referral.users as unknown as UserJoinResult;
        if (!referredUser) continue;

        // 해당 사용자의 총 결제액 조회
        const { data: transactions, error: transactionsError } = await supabase
          .from("transactions")
          .select("amount")
          .eq("user_id", referredUser.id)
          .eq("type", "charge")
          .eq("status", "completed");

        let totalPayment = 0;
        if (!transactionsError && transactions) {
          totalPayment = transactions.reduce((sum, t) => sum + t.amount, 0);
        }

        // 상태 매핑
        let status: "활성" | "비활성" | "대기";
        if (!referredUser.is_active) {
          status = "비활성";
        } else if (referredUser.approval_status === "PENDING") {
          status = "대기";
        } else {
          status = "활성";
        }

        // 재귀적으로 하위 추천인 조회
        const children = await buildReferralTree(
          referredUser.id,
          level + 1,
          maxDepth
        );

        referralList.push({
          id: referredUser.id,
          name: referredUser.name,
          joinDate: new Date(referredUser.created_at).toLocaleDateString(
            "ko-KR"
          ),
          status,
          totalPayment,
          email: referredUser.email.replace(/(.{3}).*(@.*)/, "$1***$2"),
          children: children.length > 0 ? children : undefined,
          level,
        });
      }

      return referralList;
    }

    // 추천인 목록 구성 (최대 5단계까지)
    const referralList = await buildReferralTree(userId, 1, 5);

    // 5. 총 수익 조회 (transactions 테이블에서)
    const { data: rewardTransactions, error: rewardError } = await supabase
      .from("transactions")
      .select("amount")
      .eq("user_id", userId)
      .eq("type", "charge")
      .like("description", "%리워드%")
      .eq("status", "completed");

    let totalRevenue = 0;
    if (!rewardError && rewardTransactions) {
      totalRevenue = rewardTransactions.reduce((sum, r) => sum + r.amount, 0);
    }

    // 6. 일별/월별 수익 데이터 생성 (가입일 이후)
    const joinDate = new Date(user.created_at);
    const dailyRevenue: Array<{ date: string; amount: number }> = [];
    const monthlyRevenue: Array<{ period: string; amount: number }> = [];

    // 일별 수익 데이터 (최근 60일)
    for (let i = 59; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      if (date >= joinDate) {
        const dateStr = date.toISOString().split("T")[0];

        const { data: dailyRewards, error: dailyRewardError } = await supabase
          .from("transactions")
          .select("amount")
          .eq("user_id", userId)
          .eq("type", "charge")
          .like("description", "%리워드%")
          .eq("status", "completed")
          .gte("created_at", `${dateStr}T00:00:00`)
          .lt("created_at", `${dateStr}T23:59:59`);

        let dayAmount = 0;
        if (!dailyRewardError && dailyRewards) {
          dayAmount = dailyRewards.reduce((sum, r) => sum + r.amount, 0);
        }

        dailyRevenue.push({
          date: dateStr,
          amount: dayAmount,
        });
      }
    }

    // 월별 수익 데이터 (최근 24개월)
    for (let i = 23; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      date.setDate(1);

      if (date >= new Date(joinDate.getFullYear(), joinDate.getMonth(), 1)) {
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const periodStr = `${year}-${month.toString().padStart(2, "0")}`;

        const monthStart = `${year}-${month.toString().padStart(2, "0")}-01`;
        let nextMonth = month + 1;
        let nextYear = year;
        if (nextMonth > 12) {
          nextMonth = 1;
          nextYear++;
        }
        const monthEndStr = `${nextYear}-${nextMonth
          .toString()
          .padStart(2, "0")}-01`;

        const { data: monthlyRewards, error: monthlyRewardError } =
          await supabase
            .from("transactions")
            .select("amount")
            .eq("user_id", userId)
            .eq("type", "charge")
            .like("description", "%리워드%")
            .eq("status", "completed")
            .gte("created_at", monthStart)
            .lt("created_at", monthEndStr);

        let monthAmount = 0;
        if (!monthlyRewardError && monthlyRewards) {
          monthAmount = monthlyRewards.reduce((sum, r) => sum + r.amount, 0);
        }

        monthlyRevenue.push({
          period: periodStr,
          amount: monthAmount,
        });
      }
    }

    const dashboardData: DashboardStats = {
      totalReferrals: totalReferrals || 0,
      monthlyNewSignups: monthlyNewSignups || 0,
      totalRevenue,
      referralList,
      dailyRevenue,
      monthlyRevenue,
    };

    return NextResponse.json({
      data: dashboardData,
      message: "대시보드 데이터 조회 성공",
      timestamp: getKSTISOString(),
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      {
        message: "서버 오류가 발생했습니다",
        error: "Internal server error",
        status: 500,
        timestamp: getKSTISOString(),
        path: "/api/referrals/dashboard",
      },
      { status: 500 }
    );
  }
}
