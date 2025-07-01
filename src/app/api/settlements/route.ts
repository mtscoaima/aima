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

interface MonthlySettlement {
  id: string;
  period: string;
  totalReward: number;
  directReward: number;
  indirectReward: number;
  status: string;
  settlementDate: string;
  transactionCount: number;
}

// 월별 리워드 집계 함수
async function getMonthlyRewardSummary(
  userId: number,
  year: number,
  month: number
) {
  const startDate = new Date(year, month - 1, 1).toISOString();
  const endDate = new Date(year, month, 0, 23, 59, 59, 999).toISOString();

  const { data: rewards, error } = await supabase
    .from("transactions")
    .select("amount, metadata, created_at")
    .eq("user_id", userId)
    .eq("type", "charge")
    .like("description", "%리워드%")
    .eq("status", "completed")
    .gte("created_at", startDate)
    .lte("created_at", endDate);

  if (error) {
    return null;
  }

  let totalReward = 0;
  let directReward = 0;
  let indirectReward = 0;

  rewards?.forEach((reward) => {
    const amount = reward.amount;
    const metadata = reward.metadata || {};
    const level =
      typeof metadata === "object" &&
      metadata !== null &&
      "rewardLevel" in metadata
        ? (metadata.rewardLevel as number) || 1
        : 1;

    totalReward += amount;

    if (level === 1) {
      directReward += amount;
    } else {
      indirectReward += amount;
    }
  });

  return {
    totalReward,
    directReward,
    indirectReward,
    transactionCount: rewards?.length || 0,
  };
}

// 동적 정산 내역 생성 함수
async function generateSettlements(
  userId: number
): Promise<MonthlySettlement[]> {
  const settlements: MonthlySettlement[] = [];
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  // 지난 12개월의 정산 내역 생성
  for (let i = 0; i < 12; i++) {
    let targetYear = currentYear;
    let targetMonth = currentMonth - i - 1;

    if (targetMonth <= 0) {
      targetYear -= 1;
      targetMonth += 12;
    }

    const summary = await getMonthlyRewardSummary(
      userId,
      targetYear,
      targetMonth
    );

    if (summary && summary.totalReward > 0) {
      const periodLabel = `${targetYear}년 ${targetMonth}월`;

      // 정산 상태 및 날짜 결정
      let status = "completed";
      let settlementDate = "";

      if (targetYear === currentYear && targetMonth === currentMonth) {
        // 현재 월은 정산 대기
        status = "pending";
        const nextMonth = new Date(targetYear, targetMonth, 5);
        settlementDate = nextMonth.toISOString().split("T")[0];
      } else {
        // 이전 월은 완료됨
        status = "completed";
        const settlementDay = new Date(targetYear, targetMonth, 5);
        settlementDate = settlementDay.toISOString().split("T")[0];
      }

      settlements.push({
        id: `${targetYear}-${targetMonth.toString().padStart(2, "0")}`,
        period: periodLabel,
        totalReward: summary.totalReward,
        directReward: summary.directReward,
        indirectReward: summary.indirectReward,
        status,
        settlementDate,
        transactionCount: summary.transactionCount,
      });
    }
  }

  return settlements.sort((a, b) => b.id.localeCompare(a.id)); // 최신순 정렬
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { message: "인증되지 않은 사용자", error: "Unauthorized", status: 401 },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      role: string;
    };
    const userId = parseInt(decoded.userId);

    if (decoded.role !== "SALESPERSON") {
      return NextResponse.json(
        {
          message: "영업사원만 정산 내역을 조회할 수 있습니다",
          error: "Forbidden",
          status: 403,
        },
        { status: 403 }
      );
    }

    // 동적 정산 내역 생성
    const settlements = await generateSettlements(userId);

    return NextResponse.json({
      settlements,
      message: "정산 내역 조회 성공",
      timestamp: getKSTISOString(),
    });
  } catch (error) {
    console.error("Settlements API error:", error);
    return NextResponse.json(
      {
        message: "서버 오류가 발생했습니다",
        error: "Internal server error",
        status: 500,
      },
      { status: 500 }
    );
  }
}
