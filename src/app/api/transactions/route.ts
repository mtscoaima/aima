import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";

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

// 트랜잭션 타입 정의
type TransactionType =
  | "charge"
  | "usage"
  | "refund"
  | "penalty"
  | "reserve"
  | "unreserve";

// 시스템 설정 조회 함수
async function getSystemSettings() {
  try {
    const { data: settings, error } = await supabase
      .from("system_settings")
      .select("first_level_commission_rate, nth_level_denominator")
      .limit(1)
      .single();

    if (error) {
      console.error("시스템 설정 조회 오류:", error);
      // 기본값 반환
      return {
        firstLevelCommissionRate: 10.0,
        nthLevelDenominator: 20,
      };
    }

    return {
      firstLevelCommissionRate: Number(settings.first_level_commission_rate),
      nthLevelDenominator: settings.nth_level_denominator,
    };
  } catch (error) {
    console.error("시스템 설정 조회 중 오류:", error);
    // 기본값 반환
    return {
      firstLevelCommissionRate: 10.0,
      nthLevelDenominator: 20,
    };
  }
}

// 리워드 트랜잭션 타입 정의
interface RewardTransaction {
  level: number;
  referrerId: number;
  amount: number;
  transaction: {
    id: number;
    user_id: number;
    type: string;
    amount: number;
    description: string;
    reference_id: string;
    metadata: Record<string, unknown>;
    status: string;
    created_at: string;
    updated_at: string;
  };
}

// 추천 체인 조회 함수
async function getReferralChain(startUserId: number): Promise<number[]> {
  const chain: number[] = [];
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
}

// 리워드 계산 함수
function calculateRewards(
  usageAmount: number,
  firstLevelCommissionRate: number,
  nthLevelDenominator: number
): Array<{ level: number; amount: number }> {
  const rewards: Array<{ level: number; amount: number }> = [];

  // 1차 영업사원: 시스템 설정의 비율 사용
  const firstLevelReward = Math.floor(
    usageAmount * (firstLevelCommissionRate / 100)
  );
  if (firstLevelReward >= 10) {
    rewards.push({ level: 1, amount: firstLevelReward });
  }

  // 나머지 금액에 대해서 계산 (100% - 1차 비율)
  const remainingAmount =
    usageAmount * ((100 - firstLevelCommissionRate) / 100);

  // 2차부터 계산 (시스템 설정의 분모 사용)
  for (let level = 2; level <= 10; level++) {
    const denominator = Math.pow(nthLevelDenominator, level - 1);
    const rewardAmount = Math.floor(remainingAmount / denominator);

    // 10원 미만은 지급하지 않음
    if (rewardAmount < 10) {
      break;
    }

    rewards.push({ level, amount: rewardAmount });
  }

  return rewards;
}

// 추천 체인 리워드 처리 함수
async function processReferralRewards(
  userId: number,
  usageAmount: number,
  referenceId: string
) {
  try {
    // 추천 체인 조회
    const referralChain = await getReferralChain(userId);

    if (referralChain.length === 0) {
      return [];
    }

    // 시스템 설정 조회
    const systemSettings = await getSystemSettings();

    // 리워드 계산
    const rewards = calculateRewards(
      usageAmount,
      systemSettings.firstLevelCommissionRate,
      systemSettings.nthLevelDenominator
    );

    if (rewards.length === 0) {
      return [];
    }

    const rewardTransactions: RewardTransaction[] = [];

    // 각 레벨별로 리워드 지급
    for (const reward of rewards) {
      const level = reward.level;
      const rewardAmount = reward.amount;

      // 해당 레벨의 추천인이 있는지 확인
      if (referralChain.length >= level) {
        const referrerId = referralChain[level - 1];

        // 리워드 트랜잭션 생성
        const transactionData = {
          user_id: referrerId,
          type: "charge" as const,
          amount: rewardAmount,
          description: `${level}차 추천 리워드`,
          reference_id: `${referenceId}_reward_${level}`,
          metadata: {
            isReward: true,
            rewardLevel: level,
            originalReferenceId: referenceId,
            originalUserId: userId,
            originalAmount: usageAmount,
            rewardType: "referral_commission",
          },
          status: "completed" as const,
        };

        const { data: rewardTransaction, error: rewardError } = await supabase
          .from("transactions")
          .insert(transactionData)
          .select()
          .single();

        if (rewardError) {
          console.error(
            `❌ [REWARD] ${level}차 리워드 트랜잭션 생성 실패:`,
            rewardError
          );
        } else {
          rewardTransactions.push({
            level,
            referrerId,
            amount: rewardAmount,
            transaction: rewardTransaction,
          });
        }
      }
    }

    return rewardTransactions;
  } catch (error) {
    console.error("❌ [REWARD] 추천 체인 리워드 처리 중 오류:", error);
    return [];
  }
}

// JWT 토큰에서 사용자 정보 추출
function getUserInfoFromToken(request: NextRequest): { userId: number; role: string } | null {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; role: string };
    return { userId: decoded.userId, role: decoded.role };
  } catch (error) {
    console.error("JWT 토큰 검증 실패:", error);
    return null;
  }
}

// 예약 크레딧 계산 함수
async function getReservedAmount(userId: number): Promise<number> {
  try {
    // reserve 트랜잭션 총합
    const { data: reserveData, error: reserveError } = await supabase
      .from("transactions")
      .select("amount")
      .eq("user_id", userId)
      .eq("type", "reserve")
      .eq("status", "completed");

    if (reserveError) {
      console.error("예약 크레딧 조회 오류:", reserveError);
      return 0;
    }

    const reserveTotal =
      reserveData?.reduce((sum, t) => sum + t.amount, 0) || 0;

    // unreserve 트랜잭션 총합
    const { data: unreserveData, error: unreserveError } = await supabase
      .from("transactions")
      .select("amount")
      .eq("user_id", userId)
      .eq("type", "unreserve")
      .eq("status", "completed");

    if (unreserveError) {
      console.error("예약 해제 크레딧 조회 오류:", unreserveError);
      return reserveTotal;
    }

    const unreserveTotal =
      unreserveData?.reduce((sum, t) => sum + t.amount, 0) || 0;

    return Math.max(0, reserveTotal - unreserveTotal);
  } catch (error) {
    console.error("예약 크레딧 계산 중 오류:", error);
    return 0;
  }
}

// 사용 가능한 크레딧 계산 함수
async function getAvailableBalance(userId: number): Promise<{
  totalBalance: number;
  reservedAmount: number;
  availableBalance: number;
}> {
  try {
    // 현재 잔액 조회
    const { data: balanceData, error: balanceError } = await supabase
      .from("user_balances")
      .select("current_balance")
      .eq("user_id", userId)
      .single();

    if (balanceError && balanceError.code !== "PGRST116") {
      console.error("잔액 조회 오류:", balanceError);
      return { totalBalance: 0, reservedAmount: 0, availableBalance: 0 };
    }

    const totalBalance = balanceData?.current_balance || 0;
    const reservedAmount = await getReservedAmount(userId);
    const availableBalance = totalBalance - reservedAmount;

    return {
      totalBalance,
      reservedAmount,
      availableBalance: Math.max(0, availableBalance),
    };
  } catch (error) {
    console.error("사용 가능한 크레딧 계산 중 오류:", error);
    return { totalBalance: 0, reservedAmount: 0, availableBalance: 0 };
  }
}

// 트랜잭션 목록 조회 (GET)
export async function GET(request: NextRequest) {
  try {
    // JWT 토큰에서 사용자 정보 추출
    const userInfo = getUserInfoFromToken(request);
    if (!userInfo) {
      return NextResponse.json(
        { error: "인증 토큰이 필요합니다." },
        { status: 401 }
      );
    }

    // URL 파라미터 추출
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");
    const targetUserId = searchParams.get("userId");

    // 조회할 사용자 ID 결정
    let queryUserId = userInfo.userId;
    
    // 관리자가 다른 사용자의 트랜잭션을 조회하는 경우
    if (targetUserId && userInfo.role === "ADMIN") {
      queryUserId = parseInt(targetUserId);
    }

    // Supabase에서 트랜잭션 조회
    const { data: transactions, error: transactionError } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", queryUserId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (transactionError) {
      console.error("트랜잭션 조회 오류:", transactionError);
      return NextResponse.json(
        { error: "트랜잭션 조회에 실패했습니다." },
        { status: 500 }
      );
    }

    // 전체 트랜잭션 개수 조회
    const { count, error: countError } = await supabase
      .from("transactions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", queryUserId);

    if (countError) {
      console.error("트랜잭션 개수 조회 오류:", countError);
    }

    // 사용 가능한 크레딧 정보 조회
    const balanceInfo = await getAvailableBalance(queryUserId);

    return NextResponse.json({
      success: true,
      transactions: transactions || [],
      currentBalance: balanceInfo.totalBalance,
      reservedAmount: balanceInfo.reservedAmount,
      availableBalance: balanceInfo.availableBalance,
      total: count || 0,
    });
  } catch (error) {
    console.error("트랜잭션 조회 오류:", error);
    return NextResponse.json(
      { error: "트랜잭션 조회에 실패했습니다." },
      { status: 500 }
    );
  }
}

// 새 트랜잭션 생성 (POST)
export async function POST(request: NextRequest) {
  try {
    // JWT 토큰에서 사용자 정보 추출
    const userInfo = getUserInfoFromToken(request);

    if (!userInfo) {
      return NextResponse.json(
        { error: "인증 토큰이 필요합니다." },
        { status: 401 }
      );
    }

    const userId = userInfo.userId;

    // 요청 본문 파싱
    const body = await request.json();
    const { type, amount, description, reference_id, metadata } = body;

    // 입력 검증
    if (!type || !amount || !description) {
      return NextResponse.json(
        { error: "필수 필드가 누락되었습니다." },
        { status: 400 }
      );
    }

    if (
      ![
        "charge",
        "usage",
        "refund",
        "penalty",
        "reserve",
        "unreserve",
      ].includes(type)
    ) {
      return NextResponse.json(
        { error: "유효하지 않은 트랜잭션 타입입니다." },
        { status: 400 }
      );
    }

    if (typeof amount !== "number" || isNaN(amount) || amount === 0) {
      return NextResponse.json(
        { error: "유효하지 않은 금액입니다." },
        { status: 400 }
      );
    }

    // 사용 가능한 크레딧 정보 조회
    const balanceInfo = await getAvailableBalance(userId);

    // 잔액 부족 검증 (사용/차감/예약 트랜잭션인 경우)
    if (
      (type === "usage" || type === "penalty") &&
      balanceInfo.totalBalance < Math.abs(amount)
    ) {
      return NextResponse.json(
        {
          error: `잔액이 부족합니다. 현재 잔액: ${balanceInfo.totalBalance.toLocaleString()}, 요청 금액: ${Math.abs(
            amount
          ).toLocaleString()}`,
        },
        { status: 400 }
      );
    }

    // 예약 트랜잭션인 경우 사용 가능한 크레딧 검증
    if (type === "reserve" && balanceInfo.availableBalance < Math.abs(amount)) {
      return NextResponse.json(
        {
          error: `사용 가능한 크레딧이 부족합니다. 사용 가능한 크레딧: ${balanceInfo.availableBalance.toLocaleString()}, 요청 금액: ${Math.abs(
            amount
          ).toLocaleString()}`,
        },
        { status: 400 }
      );
    }

    // 트랜잭션 데이터 준비
    const transactionData = {
      user_id: userId,
      type: type as TransactionType,
      amount: Math.abs(amount), // 항상 양수로 저장
      description,
      reference_id,
      metadata: metadata || {},
      status: "completed" as const,
    };

    // Supabase에 트랜잭션 삽입 (트리거가 자동으로 잔액 업데이트)
    const { data: newTransaction, error: insertError } = await supabase
      .from("transactions")
      .insert(transactionData)
      .select()
      .single();

    if (insertError) {
      return NextResponse.json(
        { error: "트랜잭션 생성에 실패했습니다." },
        { status: 500 }
      );
    }

    // 업데이트된 잔액 정보 조회
    const updatedBalanceInfo = await getAvailableBalance(userId);

    // usage 타입인 경우 추천 체인 리워드 처리
    let rewardTransactions: RewardTransaction[] = [];
    if (type === "usage") {
      try {
        rewardTransactions = await processReferralRewards(
          userId,
          Math.abs(amount), // 사용 금액을 리워드 계산 기준으로 사용
          reference_id || `usage_${newTransaction.id}_${Date.now()}`
        );
      } catch (rewardError) {
        console.error("리워드 처리 중 오류 (트랜잭션은 성공):", rewardError);
        // 리워드 처리 실패해도 트랜잭션 자체는 성공으로 처리
      }
    }

    return NextResponse.json({
      transaction: newTransaction,
      newBalance: updatedBalanceInfo.totalBalance,
      reservedAmount: updatedBalanceInfo.reservedAmount,
      availableBalance: updatedBalanceInfo.availableBalance,
      rewardInfo:
        rewardTransactions.length > 0
          ? {
              rewardTransactions,
              totalRewards: rewardTransactions.reduce(
                (sum, reward) => sum + reward.amount,
                0
              ),
            }
          : null,
    });
  } catch (error) {
    console.error("트랜잭션 생성 오류:", error);
    return NextResponse.json(
      { error: "트랜잭션 생성에 실패했습니다." },
      { status: 500 }
    );
  }
}
