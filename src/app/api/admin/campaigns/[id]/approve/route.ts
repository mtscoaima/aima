import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";

// Supabase 클라이언트 생성 (서버 사이드용 Service Role Key 사용)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
          description: `${level}차 추천 리워드 (캠페인)`,
          reference_id: `${referenceId}_reward_${level}`,
          metadata: {
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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const campaignId = id;

    // Authorization 헤더에서 토큰 추출
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, message: "인증 토큰이 필요합니다." },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // JWT 토큰 검증
    let decodedToken: { userId: string };
    try {
      decodedToken = jwt.verify(token, process.env.JWT_SECRET!) as {
        userId: string;
      };
    } catch {
      return NextResponse.json(
        { success: false, message: "유효하지 않은 토큰입니다." },
        { status: 401 }
      );
    }

    const userId = decodedToken.userId;

    // 사용자 존재 및 관리자 권한 확인
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, name, role")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, message: "사용자를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 관리자 권한 확인
    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "관리자 권한이 필요합니다." },
        { status: 403 }
      );
    }

    // 캠페인 존재 확인
    const { data: campaign, error: campaignError } = await supabase
      .from("campaigns")
      .select("*")
      .eq("id", campaignId)
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json(
        { success: false, message: "캠페인을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 승인 가능한 상태인지 확인
    if (campaign.status !== "PENDING_APPROVAL") {
      return NextResponse.json(
        {
          success: false,
          message: "승인 대기 상태의 캠페인만 승인할 수 있습니다.",
        },
        { status: 400 }
      );
    }

    // 현재 시간 (KST)
    const now = new Date();
    const kstTime = new Date(now.getTime() + 9 * 60 * 60 * 1000).toISOString();

    // 캠페인 승인 처리
    const { error: updateError } = await supabase
      .from("campaigns")
      .update({
        status: "APPROVED",
        approved_by: parseInt(userId),
        approved_at: kstTime,
        updated_at: kstTime,
      })
      .eq("id", campaignId);

    if (updateError) {
      console.error("캠페인 승인 오류:", updateError);
      return NextResponse.json(
        { success: false, message: "캠페인 승인 처리에 실패했습니다." },
        { status: 500 }
      );
    }

    // 예약 크레딧 처리
    const campaignCost = campaign.budget || 0;
    const campaignUserId = campaign.user_id;

    // 1. 예약 해제 (unreserve)
    const unreserveTransactionData = {
      user_id: campaignUserId,
      type: "unreserve",
      amount: campaignCost,
      description: `캠페인 예약 해제 (${campaign.name})`,
      reference_id: `campaign_unreserve_${campaignId}`,
      metadata: {
        campaign_id: parseInt(campaignId),
        campaign_name: campaign.name,
        unreserve_type: "campaign_approval",
      },
      status: "completed",
    };

    const { error: unreserveError } = await supabase
      .from("transactions")
      .insert(unreserveTransactionData);

    if (unreserveError) {
      console.error("예약 해제 오류:", unreserveError);
      return NextResponse.json(
        { success: false, message: "예약 해제 처리에 실패했습니다." },
        { status: 500 }
      );
    }

    // 2. 실제 사용 차감 (usage)
    const usageTransactionData = {
      user_id: campaignUserId,
      type: "usage",
      amount: campaignCost,
      description: `캠페인 실행 (${campaign.name})`,
      reference_id: `campaign_usage_${campaignId}`,
      metadata: {
        campaign_id: parseInt(campaignId),
        campaign_name: campaign.name,
        usage_type: "campaign_execution",
      },
      status: "completed",
    };

    const { error: usageError } = await supabase
      .from("transactions")
      .insert(usageTransactionData);

    if (usageError) {
      console.error("사용 차감 오류:", usageError);
      return NextResponse.json(
        { success: false, message: "사용 차감 처리에 실패했습니다." },
        { status: 500 }
      );
    }

    // 3. 리워드 지급 (전체 추천 체인 처리)
    try {
      await processReferralRewards(
        campaignUserId,
        campaignCost,
        `campaign_usage_${campaignId}`
      );
    } catch (rewardError) {
      console.error("리워드 처리 중 오류:", rewardError);
      // 리워드 처리 실패해도 캠페인 승인은 성공으로 처리
    }

    return NextResponse.json({
      success: true,
      message: "캠페인이 성공적으로 승인되었습니다.",
    });
  } catch (error) {
    console.error("캠페인 승인 오류:", error);
    return NextResponse.json(
      { success: false, message: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
