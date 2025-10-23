import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { validateAuthWithSuccess } from "@/utils/authUtils";
import { triggerNotification } from "@/lib/notificationService";
import { NotificationEventType } from "@/types/notificationEvents";

// Supabase 클라이언트 생성 (서버 사이드용 Service Role Key 사용)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 트랜잭션 메타데이터 타입 정의
interface TransactionMetadata {
  transactionType?: string;
  pointType?: string;
  chargedBy?: string;
  adminUserId?: number;
  reason?: string;
  isReward?: boolean;
  bulkChargeId?: string;
  campaign_id?: number;
  campaign_name?: string;
  reserve_type?: string;
  reserveType?: string;
  usage_type?: string;
  usageType?: string;
}

// 광고머니 잔액 계산 함수 (transaction 기반)
async function calculateCreditBalance(userId: number): Promise<number> {
  try {
    const { data: transactions, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "completed")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("트랜잭션 조회 오류:", error);
      return 0;
    }

    let balance = 0;

    for (const transaction of transactions || []) {
      const metadata = transaction.metadata as Record<string, string | number | boolean> | null;

      if (transaction.type === "charge") {
        // 광고머니 충전만 계산 (포인트 제외)
        if (!metadata?.isReward) {
          balance += transaction.amount;
        }
      } else if (transaction.type === "usage") {
        // 광고머니 사용만 계산 (포인트 사용 제외)
        if (metadata?.transactionType !== "point") {
          balance -= transaction.amount;
        }
      } else if (transaction.type === "refund") {
        balance += transaction.amount;
      } else if (transaction.type === "penalty") {
        balance -= transaction.amount;
      }
      // reserve/unreserve는 잔액에 영향 없음 (예약만)
    }

    return Math.max(0, balance);
  } catch (error) {
    console.error("광고머니 잔액 계산 중 오류:", error);
    return 0;
  }
}

interface CreateCampaignRequest {
  title?: string;
  content: string;
  imageUrl: string;
  sendPolicy: "realtime" | "batch";
  validityStartDate?: string;
  validityEndDate?: string;
  scheduledSendDate?: string;
  scheduledSendTime?: string;


  // ✅ 새로운 예산 필드들
  budget?: number;  // 캠페인 전체 예산
  campaignBudget?: number;  // campaign_budget 필드용
  dailyAdSpendLimit?: number;  // 일 최대 광고비 제한

  existingTemplateId?: number;
  // 새로운 데이터베이스 컬럼들
  targetAgeGroups: string[];
  targetLocationsDetailed?: Array<{ city: string; district: string; dong: string } | { city: string; districts: string[] } | string>;
  cardAmountMax?: number | null;
  cardTimeStart?: string | null;
  cardTimeEnd?: string | null;
  campaignIndustryId?: number | null;
  customIndustryName?: string | null;
  unitCost?: number;
  estimatedTotalCost?: number;
  expertReviewRequested?: boolean;
  expertReviewNotes?: string | null;
  buttons?: {
    id: string;
    text: string;
    linkType: 'web';
    url?: string;
  }[];
  genderRatio?: {
    female: number;
    male: number;
  };
  desiredRecipients?: string | null;
  estimatedCost: number;
  templateDescription?: string;
}

export async function POST(request: NextRequest) {
  try {
    // 인증 검증
    const authResult = validateAuthWithSuccess(request);
    if (!authResult.isValid) {
      return authResult.errorResponse!;
    }

    const userId = authResult.userInfo!.userId;

    // 사용자 존재 확인
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, name, role, approval_status")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      console.error("사용자 조회 실패:", userError);
      return NextResponse.json(
        { success: false, message: "계정 정보를 찾을 수 없습니다. 다시 로그인해주세요." },
        { status: 404 }
      );
    }

    if (user.role !== "USER" && user.role !== "ADVERTISER") {
      return NextResponse.json(
        { success: false, message: "캠페인 생성 권한이 없습니다." },
        { status: 403 }
      );
    }

    // 요청 본문 파싱
    const campaignData: CreateCampaignRequest = await request.json();

    // 필수 필드 검증
    if (
      !campaignData.content ||
      !campaignData.imageUrl ||
      !campaignData.sendPolicy
    ) {
      return NextResponse.json(
        { success: false, message: "필수 정보가 누락되었습니다." },
        { status: 400 }
      );
    }

    // 커스텀 업종 검증 (14번 선택 시)
    if (campaignData.campaignIndustryId === 14 && !campaignData.customIndustryName?.trim()) {
      return NextResponse.json(
        { success: false, message: "기타 업종을 선택하셨습니다. 업종명을 입력해주세요." },
        { status: 400 }
      );
    }

    // 예상 비용 계산
    const campaignCost = campaignData.estimatedCost || 0;

    // 포인트 잔액 계산 (transactions 기반)
    const { data: pointTransactions, error: pointError } = await supabase
      .from("transactions")
      .select("amount, type, metadata")
      .eq("user_id", userId)
      .eq("status", "completed");

    if (pointError) {
      console.error("포인트 트랜잭션 조회 오류:", pointError);
      return NextResponse.json(
        { success: false, message: "포인트 조회에 실패했습니다." },
        { status: 500 }
      );
    }

    // 포인트 충전 계산 (metadata.isReward = true)
    const pointCharged = (pointTransactions || [])
      .filter(t => {
        if (t.type === "charge") {
          const metadata = t.metadata as TransactionMetadata;
          return metadata && metadata.isReward === true;
        }
        return false;
      })
      .reduce((sum, t) => sum + t.amount, 0);

    // 포인트 사용 계산 (metadata.transactionType = "point")
    const pointUsed = (pointTransactions || [])
      .filter(t => {
        if (t.type === "usage") {
          const metadata = t.metadata as TransactionMetadata;
          return metadata && metadata.transactionType === "point";
        }
        return false;
      })
      .reduce((sum, t) => sum + t.amount, 0);

    const availablePoints = Math.max(0, pointCharged - pointUsed);

    // 사용 가능한 크레딧 확인 (transaction 기반)
    const currentBalance = await calculateCreditBalance(userId);

    // ✅ 승인 신청 시에는 예약금을 고려하지 않음
    // 전체 가용금액 기준으로 승인 신청 가능 (승인 대기 캠페인 수와 무관)
    // 관리자가 캠페인을 승인하면 그때 실제 차감됨
    const availableBalance = currentBalance;

    // 포인트 + 광고머니 총 사용 가능 금액 검증
    const totalAvailable = availablePoints + availableBalance;
    if (totalAvailable < campaignCost) {
      return NextResponse.json(
        {
          success: false,
          message: `사용 가능한 잔액이 부족합니다. 충전이 필요합니다.\n필요 금액: ${campaignCost.toLocaleString()}원\n보유 금액: 포인트 ${availablePoints.toLocaleString()}P + 광고머니 ${availableBalance.toLocaleString()}원 = 총 ${totalAvailable.toLocaleString()}원`,
          needCharge: true, // 프론트엔드에서 충전 페이지 유도
        },
        { status: 400 }
      );
    }

    // 현재 시간 (KST)
    const now = new Date();
    const kstTime = new Date(now.getTime() + 9 * 60 * 60 * 1000).toISOString();

    let messageTemplate;

    // 기존 템플릿 ID가 있으면 기존 템플릿 사용, 없으면 새로운 템플릿 생성
    if (campaignData.existingTemplateId) {
      // 기존 템플릿 사용
      const { data: existingTemplate, error: existingTemplateError } =
        await supabase
          .from("message_templates")
          .select("*")
          .eq("id", campaignData.existingTemplateId)
          .single();

      if (existingTemplateError || !existingTemplate) {
        return NextResponse.json(
          { success: false, message: "기존 템플릿을 찾을 수 없습니다." },
          { status: 404 }
        );
      }

      messageTemplate = existingTemplate;

      // 기존 템플릿의 사용 횟수 증가
      await supabase
        .from("message_templates")
        .update({ usage_count: (existingTemplate.usage_count || 0) + 1 })
        .eq("id", campaignData.existingTemplateId);
    } else {
      // 새로운 템플릿 생성
      const templateData = {
        user_id: userId,
        name: campaignData.templateDescription || "AI 생성 템플릿",
        content: campaignData.content,
        image_url: campaignData.imageUrl,
        category: "AI_GENERATED",
        is_ai_generated: true,
        ai_model: "gpt-4",
        is_active: true,
        usage_count: 0,
        created_at: kstTime,
        updated_at: kstTime,
        is_private: false,
        template_code: "임시-0", // 임시값, 생성 후 업데이트
      };

      const { data: newTemplate, error: templateError } = await supabase
        .from("message_templates")
        .insert(templateData)
        .select()
        .single();

      if (templateError) {
        console.error("Template creation error:", templateError);
        return NextResponse.json(
          { success: false, message: "템플릿 저장에 실패했습니다.", error: templateError.message },
          { status: 500 }
        );
      }

      // 생성된 템플릿의 template_code 업데이트
      const templateCode = `결합메시지-${newTemplate.id}`;

      // template_code 업데이트
      const { error: updateError } = await supabase
        .from("message_templates")
        .update({ template_code: templateCode })
        .eq("id", newTemplate.id);

      if (updateError) {
        console.error("Template code update error:", updateError);
        // template_code 업데이트 실패해도 템플릿 생성은 성공으로 처리
      }

      // 업데이트된 template_code를 포함한 템플릿 객체 생성
      messageTemplate = {
        ...newTemplate,
        template_code: templateCode
      };
    }

    // target_criteria 제거됨 - 더 이상 사용하지 않음

    // getFirstSentence 함수 제거됨 - description 필드 사용 안함

    // 발송 시작 날짜 결정 (실시간: validityStartDate, 일괄: scheduledSendDate)
    let scheduleStartDate = null;
    if (
      campaignData.sendPolicy === "realtime" &&
      campaignData.validityStartDate
    ) {
      scheduleStartDate = new Date(
        campaignData.validityStartDate
      ).toISOString();
    } else if (
      campaignData.sendPolicy === "batch" &&
      campaignData.scheduledSendDate
    ) {
      scheduleStartDate = new Date(
        campaignData.scheduledSendDate
      ).toISOString();
    }

    // 발송 종료 날짜 결정 (실시간 발송만, 일괄 발송은 당일 완료)
    let scheduleEndDate = null;
    if (
      campaignData.sendPolicy === "realtime" &&
      campaignData.validityEndDate
    ) {
      scheduleEndDate = new Date(campaignData.validityEndDate).toISOString();
    } else if (
      campaignData.sendPolicy === "batch" &&
      campaignData.scheduledSendDate
    ) {
      // 일괄 발송은 같은 날에 완료
      scheduleEndDate = new Date(campaignData.scheduledSendDate).toISOString();
    }

    // 카드 승인 금액 처리
    const cardAmountMax = campaignData.cardAmountMax || null;

    // 카드 승인 시간 처리
    const cardTimeStart = campaignData.cardTimeStart || null;
    const cardTimeEnd = campaignData.cardTimeEnd || null;

    // 캠페인 데이터 준비 (새로운 컬럼들 사용)
    const campaign = {
      user_id: userId,
      name: campaignData.title || messageTemplate.name,
      template_id: messageTemplate.id,
      status: "PENDING_APPROVAL",
      total_recipients: 0, // 새로운 로직에서는 예산 기반으로 계산
      sent_count: 0,
      success_count: 0,
      failed_count: 0,
      budget: campaignData.budget || campaignData.estimatedCost || 0, // 기존 budget 필드 사용
      campaign_budget: campaignData.campaignBudget || campaignData.budget || campaignData.estimatedCost || 0, // 새로운 campaign_budget 필드
      daily_ad_spend_limit: campaignData.dailyAdSpendLimit || null, // 일 최대 광고비 제한
      message_template: campaignData.content,
      schedule_start_date: scheduleStartDate,
      schedule_end_date: scheduleEndDate,
      schedule_send_time_start:
        campaignData.sendPolicy === "batch" && campaignData.scheduledSendTime
          ? campaignData.scheduledSendTime + ":00"
          : cardTimeStart ? cardTimeStart + ":00" : null,
      schedule_send_time_end:
        campaignData.sendPolicy === "batch" && campaignData.scheduledSendTime
          ? campaignData.scheduledSendTime + ":00"
          : cardTimeEnd ? cardTimeEnd + ":00" : null,
      // 새로운 데이터베이스 컬럼들
      send_policy_type: campaignData.sendPolicy,
      validity_start_date: campaignData.validityStartDate ? new Date(campaignData.validityStartDate).toISOString().split('T')[0] : null,
      validity_end_date: campaignData.validityEndDate ? new Date(campaignData.validityEndDate).toISOString().split('T')[0] : null,
      scheduled_send_date: campaignData.scheduledSendDate ? new Date(campaignData.scheduledSendDate).toISOString().split('T')[0] : null,
      scheduled_send_time: campaignData.scheduledSendTime || null,
      target_age_groups: campaignData.targetAgeGroups || ['all'],
      target_locations_detailed: campaignData.targetLocationsDetailed || [],
      card_amount_max: cardAmountMax,
      card_time_start: cardTimeStart,
      card_time_end: cardTimeEnd,
      campaign_industry_id: campaignData.campaignIndustryId,
      unit_cost: campaignData.unitCost || 0,
      estimated_total_cost: campaignData.estimatedTotalCost || campaignData.estimatedCost || 0,
      expert_review_requested: campaignData.expertReviewRequested || false,
      expert_review_notes: campaignData.expertReviewNotes,
      gender_ratio: campaignData.genderRatio || {},
      desired_recipients: campaignData.desiredRecipients,
      created_at: kstTime,
      updated_at: kstTime,
    };

    // campaigns 테이블에 삽입
    const { data: newCampaign, error: insertError } = await supabase
      .from("campaigns")
      .insert(campaign)
      .select()
      .single();

    if (insertError) {
      // 새로운 템플릿을 생성한 경우에만 롤백 (기존 템플릿은 삭제하지 않음)
      if (!campaignData.existingTemplateId) {
        await supabase
          .from("message_templates")
          .delete()
          .eq("id", messageTemplate.id);
      }

      return NextResponse.json(
        {
          success: false,
          message: `캠페인 저장에 실패했습니다: ${insertError.message}`,
          error: insertError.code,
          details: insertError.details,
        },
        { status: 500 }
      );
    }

    // 포인트 우선 차감 로직
    const pointsToUse = Math.min(availablePoints, campaignCost);
    const creditToReserve = campaignCost - pointsToUse;

    const transactions = [];

    // 1. 포인트 예약 트랜잭션 (포인트가 있을 경우)
    if (pointsToUse > 0) {
      const pointReserveTransaction = {
        user_id: userId,
        type: "reserve",
        amount: pointsToUse,
        description: `캠페인 포인트 예약 (${campaign.name})`,
        reference_id: `campaign_point_reserve_${newCampaign.id}`,
        metadata: {
          campaign_id: newCampaign.id,
          campaign_name: campaign.name,
          transactionType: "point",
          reserveType: "campaign_approval",
        },
        status: "completed",
      };
      transactions.push(pointReserveTransaction);
    }

    // 2. 광고머니 예약 트랜잭션 (부족 금액이 있을 경우)
    if (creditToReserve > 0) {
      const reserveTransactionData = {
        user_id: userId,
        type: "reserve",
        amount: creditToReserve,
        description: `캠페인 광고머니 예약 (${campaign.name})`,
        reference_id: `campaign_reserve_${newCampaign.id}`,
        metadata: {
          campaign_id: newCampaign.id,
          campaign_name: campaign.name,
          reserve_type: "campaign_approval",
          transactionType: "credit",
        },
        status: "completed",
      };
      transactions.push(reserveTransactionData);
    }

    // 트랜잭션 실행
    if (transactions.length > 0) {
      const { error: transactionError } = await supabase
        .from("transactions")
        .insert(transactions);

      if (transactionError) {
        console.error("트랜잭션 처리 오류:", transactionError);

        // 캠페인 생성은 성공했으므로 경고 메시지와 함께 응답
        return NextResponse.json({
          success: true,
          message:
            "캠페인이 저장되었으나 포인트/크레딧 차감에 실패했습니다. 관리자에게 문의해주세요.",
          campaign: newCampaign,
          warning: "포인트/크레딧 차감 실패",
        });
      }
    }

    // 커스텀 업종 저장 (14번 선택 시)
    if (campaignData.campaignIndustryId === 14 && campaignData.customIndustryName) {
      const { error: customIndustryError } = await supabase
        .from('custom_campaign_industries')
        .insert({
          campaign_id: newCampaign.id,
          custom_name: campaignData.customIndustryName.trim()
        });

      if (customIndustryError) {
        console.error('커스텀 업종 저장 오류:', customIndustryError);
        // 캠페인은 이미 생성되었으므로 경고만 표시
      }
    }

    // 캠페인 검수요청 알림 발송
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('name, company_info')
        .eq('id', userId)
        .single();

      // company_info는 JSONB 타입으로 companyName 필드를 가짐
      const companyInfo = userData?.company_info as { companyName?: string } | null;

      await triggerNotification({
        eventType: NotificationEventType.CAMPAIGN_CREATED,
        userId: userId,
        data: {
          companyName: companyInfo?.companyName || '미등록',
          userName: userData?.name || '사용자',
          campaignName: campaign.name,
        }
      });
    } catch (notificationError) {
      console.error("캠페인 검수요청 알림 발송 실패:", notificationError);
      // 알림 실패해도 캠페인 생성은 성공으로 처리
    }

    return NextResponse.json({
      success: true,
      message: "캠페인이 성공적으로 저장되었습니다.",
      campaign: newCampaign,
      paymentBreakdown: {
        totalCost: campaignCost,
        pointsUsed: pointsToUse,
        creditsReserved: creditToReserve,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // 인증 검증
    const authResult = validateAuthWithSuccess(request);
    if (!authResult.isValid) {
      return authResult.errorResponse!;
    }

    const userId = authResult.userInfo!.userId;

    // 사용자의 캠페인 목록 조회 (템플릿 정보 및 업종 정보와 함께)
    const { data: campaigns, error: campaignsError } = await supabase
      .from("campaigns")
      .select(
        `
        *,
        message_templates (
          name,
          content,
          image_url,
          category,
          template_code,
          buttons
        ),
        campaign_industries (
          id,
          name
        ),
        custom_campaign_industries (
          custom_name
        )
      `
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (campaignsError) {
      console.error("캠페인 조회 오류:", campaignsError);
      return NextResponse.json(
        { success: false, message: "캠페인 조회에 실패했습니다." },
        { status: 500 }
      );
    }

    // custom_campaign_industries 배열을 custom_industry_name 문자열로 변환
    const formattedCampaigns = (campaigns || []).map((campaign: { custom_campaign_industries?: Array<{ custom_name: string }>; [key: string]: unknown }) => {
      const customIndustryName = campaign.custom_campaign_industries?.[0]?.custom_name || null;
      return {
        ...campaign,
        custom_industry_name: customIndustryName,
      };
    });

    return NextResponse.json({
      success: true,
      campaigns: formattedCampaigns,
    });
  } catch (error) {
    console.error("캠페인 조회 오류:", error);
    return NextResponse.json(
      { success: false, message: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
