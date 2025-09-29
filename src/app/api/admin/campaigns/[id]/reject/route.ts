import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";

// Supabase 클라이언트 생성 (서버 사이드용 Service Role Key 사용)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const campaignId = id;
    const { reason } = await request.json();

    if (!reason || reason.trim().length === 0) {
      return NextResponse.json(
        { success: false, message: "거부 사유를 입력해주세요." },
        { status: 400 }
      );
    }

    // Authorization 헤더에서 토큰 추출
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, message: "로그인이 필요합니다. 다시 로그인해주세요." },
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
        { success: false, message: "세션이 만료되었습니다. 다시 로그인해주세요." },
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
        { success: false, message: "계정 정보를 찾을 수 없습니다. 다시 로그인해주세요." },
        { status: 404 }
      );
    }

    // 관리자 권한 확인
    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "접근 권한이 없습니다." },
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

    // 거부 가능한 상태인지 확인 (승인 대기 또는 검토 중)
    if (campaign.status !== "PENDING_APPROVAL" && campaign.status !== "REVIEWING") {
      return NextResponse.json(
        {
          success: false,
          message: "승인 대기 또는 검토 중 캠페인만 거부할 수 있습니다.",
        },
        { status: 400 }
      );
    }

    // 현재 시간 (KST)
    const now = new Date();
    const kstTime = new Date(now.getTime() + 9 * 60 * 60 * 1000).toISOString();

    // 캠페인 거부 처리
    const { error: updateError } = await supabase
      .from("campaigns")
      .update({
        status: "REJECTED",
        rejection_reason: reason.trim(),
        approved_by: parseInt(userId),
        approved_at: kstTime,
        updated_at: kstTime,
      })
      .eq("id", campaignId);

    if (updateError) {
      console.error("캠페인 거부 오류:", updateError);
      return NextResponse.json(
        { success: false, message: "캠페인 거부 처리에 실패했습니다." },
        { status: 500 }
      );
    }

    // 예약 크레딧 해제 처리 - 거부 시에도 예약된 금액을 해제해야 함
    const campaignUserId = campaign.user_id;

    // 해당 캠페인에 대한 예약 트랜잭션들 조회
    const { data: reserveTransactions, error: reserveError } = await supabase
      .from("transactions")
      .select("amount, metadata, reference_id")
      .eq("user_id", campaignUserId)
      .eq("type", "reserve")
      .eq("status", "completed")
      .or(`reference_id.like.%campaign_reserve_${campaignId}%,reference_id.like.%campaign_point_reserve_${campaignId}%`);

    if (reserveError) {
      console.error("예약 트랜잭션 조회 오류:", reserveError);
    }

    // 포인트 예약과 광고머니 예약 분리
    let pointReservedAmount = 0;
    let creditReservedAmount = 0;

    if (reserveTransactions) {
      for (const transaction of reserveTransactions) {
        const metadata = transaction.metadata as Record<string, string | number | boolean> | null;
        if (metadata?.transactionType === "point") {
          pointReservedAmount += transaction.amount;
        } else {
          creditReservedAmount += transaction.amount;
        }
      }
    }

    const transactions = [];

    // 1. 포인트 예약 해제 (포인트가 예약되어 있을 경우)
    if (pointReservedAmount > 0) {
      transactions.push({
        user_id: campaignUserId,
        type: "unreserve",
        amount: pointReservedAmount,
        description: `캠페인 포인트 예약 해제 - 거부 (${campaign.name})`,
        reference_id: `campaign_point_unreserve_reject_${campaignId}`,
        metadata: {
          campaign_id: parseInt(campaignId),
          campaign_name: campaign.name,
          unreserve_type: "campaign_rejection",
          transactionType: "point",
        },
        status: "completed",
      });
    }

    // 2. 광고머니 예약 해제 (광고머니가 예약되어 있을 경우)
    if (creditReservedAmount > 0) {
      transactions.push({
        user_id: campaignUserId,
        type: "unreserve",
        amount: creditReservedAmount,
        description: `캠페인 광고머니 예약 해제 - 거부 (${campaign.name})`,
        reference_id: `campaign_credit_unreserve_reject_${campaignId}`,
        metadata: {
          campaign_id: parseInt(campaignId),
          campaign_name: campaign.name,
          unreserve_type: "campaign_rejection",
          transactionType: "credit",
        },
        status: "completed",
      });
    }

    // 트랜잭션 실행
    if (transactions.length > 0) {
      const { error: transactionError } = await supabase
        .from("transactions")
        .insert(transactions);

      if (transactionError) {
        console.error("예약 해제 트랜잭션 처리 오류:", transactionError);
        // 거부 처리는 성공했으므로 경고와 함께 응답
        return NextResponse.json({
          success: true,
          message: "캠페인이 거부되었으나 예약 해제 처리에 문제가 발생했습니다. 관리자에게 문의하세요.",
          warning: "예약 해제 실패",
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "캠페인이 성공적으로 거부되었습니다.",
      unreservedAmounts: {
        point: pointReservedAmount,
        credit: creditReservedAmount,
      },
    });
  } catch (error) {
    console.error("캠페인 거부 오류:", error);
    return NextResponse.json(
      { success: false, message: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
