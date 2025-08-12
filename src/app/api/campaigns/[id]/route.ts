import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";

// Supabase 클라이언트 생성 (서버 사이드용 Service Role Key 사용)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 캠페인 삭제 API
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const campaignId = parseInt(id);

    if (isNaN(campaignId)) {
      return NextResponse.json(
        { success: false, message: "올바르지 않은 캠페인 ID입니다." },
        { status: 400 }
      );
    }

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

    // 캠페인 존재 확인 및 소유자 확인
    const { data: campaign, error: campaignError } = await supabase
      .from("campaigns")
      .select("*")
      .eq("id", campaignId)
      .eq("user_id", userId) // 본인의 캠페인만 삭제 가능
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json(
        { success: false, message: "캠페인을 찾을 수 없거나 삭제 권한이 없습니다." },
        { status: 404 }
      );
    }

    // 진행 중인 캠페인은 삭제 불가
    if (campaign.status === "ACTIVE") {
      return NextResponse.json(
        {
          success: false,
          message: "진행 중인 캠페인은 삭제할 수 없습니다. 먼저 일시정지해주세요.",
        },
        { status: 400 }
      );
    }

    // 예약금 해제 처리 (DRAFT 또는 PENDING_APPROVAL 상태의 캠페인)
    const campaignCost = campaign.budget || 0;
    if (campaignCost > 0 && (campaign.status === "DRAFT" || campaign.status === "PENDING_APPROVAL")) {
      // 해당 캠페인에 대한 예약 트랜잭션이 있는지 확인
      const { data: reserveTransaction, error: reserveCheckError } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", userId)
        .eq("type", "reserve")
        .eq("reference_id", `campaign_reserve_${campaignId}`)
        .eq("status", "completed")
        .single();

      // 예약 트랜잭션이 있고, 아직 해제되지 않은 경우 해제 처리
      if (reserveTransaction && !reserveCheckError) {
        // 이미 해제된 예약금인지 확인
        const { data: unreserveTransaction, error: unreserveCheckError } = await supabase
          .from("transactions")
          .select("*")
          .eq("user_id", userId)
          .eq("type", "unreserve")
          .eq("reference_id", `campaign_unreserve_delete_${campaignId}`)
          .eq("status", "completed")
          .single();

        // 아직 해제되지 않은 경우에만 해제 처리
        if (!unreserveTransaction || unreserveCheckError) {
          const unreserveTransactionData = {
            user_id: parseInt(userId),
            type: "unreserve",
            amount: campaignCost,
            description: `캠페인 삭제로 인한 예약 해제 (${campaign.name})`,
            reference_id: `campaign_unreserve_delete_${campaignId}`,
            metadata: {
              campaign_id: campaignId,
              campaign_name: campaign.name,
              unreserve_type: "campaign_deletion",
              original_reserve_reference: `campaign_reserve_${campaignId}`,
            },
            status: "completed",
          };

          const { error: unreserveError } = await supabase
            .from("transactions")
            .insert(unreserveTransactionData);

          if (unreserveError) {
            console.error("예약 해제 오류:", unreserveError);
            return NextResponse.json(
              { 
                success: false, 
                message: "예약금 해제 처리에 실패했습니다. 다시 시도해주세요." 
              },
              { status: 500 }
            );
          }
        }
      }
    }

    // 관련 데이터 먼저 삭제 (외래키 제약조건 때문)
    try {
      // campaign_targets 삭제
      await supabase
        .from("campaign_targets")
        .delete()
        .eq("campaign_id", campaignId);

      // campaign_messages 삭제
      await supabase
        .from("campaign_messages")
        .delete()
        .eq("campaign_id", campaignId);

      // 기타 관련 테이블 삭제 (있는 경우)
      await supabase.from("rewards").delete().eq("campaign_id", campaignId);
      await supabase.from("payments").delete().eq("campaign_id", campaignId);
    } catch (relatedError) {
      console.error("관련 데이터 삭제 오류:", relatedError);
      // 관련 데이터 삭제 실패는 무시하고 계속 진행
    }

    // 캠페인 삭제
    const { error: deleteError } = await supabase
      .from("campaigns")
      .delete()
      .eq("id", campaignId)
      .eq("user_id", userId); // 추가 보안 확인

    if (deleteError) {
      console.error("캠페인 삭제 오류:", deleteError);
      return NextResponse.json(
        { success: false, message: "캠페인 삭제 처리에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "캠페인이 성공적으로 삭제되었습니다.",
    });
  } catch (error) {
    console.error("캠페인 삭제 API 오류:", error);
    return NextResponse.json(
      { success: false, message: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// 캠페인 이름 수정 API
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const campaignId = parseInt(id);

    if (isNaN(campaignId)) {
      return NextResponse.json(
        { success: false, message: "올바르지 않은 캠페인 ID입니다." },
        { status: 400 }
      );
    }

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

    // 요청 본문 파싱
    const body = await request.json();
    const { name, requestApproval, cancelApprovalRequest, updateTargetCriteria, target_criteria } = body;

    // 승인 요청인 경우, 승인 요청 취소인 경우, 타깃 조건 수정인 경우, 이름 수정인 경우 구분
    if (requestApproval) {
      // 승인 요청 처리
      // 캠페인 존재 확인 및 소유자 확인
      const { data: campaign, error: campaignError } = await supabase
        .from("campaigns")
        .select("id, status, user_id")
        .eq("id", campaignId)
        .eq("user_id", userId)
        .single();

      if (campaignError || !campaign) {
        return NextResponse.json(
          { success: false, message: "캠페인을 찾을 수 없거나 권한이 없습니다." },
          { status: 404 }
        );
      }

      // DRAFT 또는 REJECTED 상태인지 확인
      if (campaign.status !== "DRAFT" && campaign.status !== "REJECTED") {
        return NextResponse.json(
          { success: false, message: "임시저장 또는 반려 상태의 캠페인만 승인 요청할 수 있습니다." },
          { status: 400 }
        );
      }

      // 상태를 PENDING_APPROVAL로 변경 (반려 사유가 있다면 초기화)
      const updateData: any = {
        status: "PENDING_APPROVAL",
        updated_at: new Date().toISOString()
      };
      
      // REJECTED 상태에서 승인 요청하는 경우 반려 관련 정보 초기화
      if (campaign.status === "REJECTED") {
        updateData.rejection_reason = null;
        updateData.approved_by = null;
        updateData.approved_at = null;
      }

      const { error: updateError } = await supabase
        .from("campaigns")
        .update(updateData)
        .eq("id", campaignId)
        .eq("user_id", userId);

      if (updateError) {
        console.error("캠페인 승인 요청 오류:", updateError);
        return NextResponse.json(
          { success: false, message: "승인 요청에 실패했습니다." },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "승인 요청이 성공적으로 처리되었습니다.",
        data: {
          id: campaignId,
          status: "PENDING_APPROVAL",
        }
      });
    } else if (cancelApprovalRequest) {
      // 승인 요청 취소 처리
      // 캠페인 존재 확인 및 소유자 확인
      const { data: campaign, error: campaignError } = await supabase
        .from("campaigns")
        .select("id, status, user_id")
        .eq("id", campaignId)
        .eq("user_id", userId)
        .single();

      if (campaignError || !campaign) {
        return NextResponse.json(
          { success: false, message: "캠페인을 찾을 수 없거나 권한이 없습니다." },
          { status: 404 }
        );
      }

      // PENDING_APPROVAL 상태인지 확인
      if (campaign.status !== "PENDING_APPROVAL") {
        return NextResponse.json(
          { success: false, message: "승인 대기 상태의 캠페인만 취소할 수 있습니다." },
          { status: 400 }
        );
      }

      // 상태를 DRAFT로 변경
      const { error: updateError } = await supabase
        .from("campaigns")
        .update({ 
          status: "DRAFT",
          updated_at: new Date().toISOString()
        })
        .eq("id", campaignId)
        .eq("user_id", userId);

      if (updateError) {
        console.error("캠페인 승인 요청 취소 오류:", updateError);
        return NextResponse.json(
          { success: false, message: "승인 요청 취소에 실패했습니다." },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "승인 요청이 성공적으로 취소되었습니다.",
        data: {
          id: campaignId,
          status: "DRAFT",
        }
      });
    } else if (updateTargetCriteria) {
      // 타깃 조건 수정 처리
      // 캠페인 존재 확인 및 소유자 확인
      const { data: campaign, error: campaignError } = await supabase
        .from("campaigns")
        .select("id, status, user_id, target_criteria")
        .eq("id", campaignId)
        .eq("user_id", userId)
        .single();

      if (campaignError || !campaign) {
        return NextResponse.json(
          { success: false, message: "캠페인을 찾을 수 없거나 권한이 없습니다." },
          { status: 404 }
        );
      }

      // 수정 가능한 상태인지 확인 (DRAFT, PENDING_APPROVAL, REJECTED 상태만 수정 가능)
      if (campaign.status !== "DRAFT" && campaign.status !== "PENDING_APPROVAL" && campaign.status !== "REJECTED") {
        return NextResponse.json(
          { success: false, message: "등록, 승인 대기, 또는 반려 상태의 캠페인만 수정할 수 있습니다." },
          { status: 400 }
        );
      }

      // 타깃 조건 검증
      if (!target_criteria || typeof target_criteria !== "object") {
        return NextResponse.json(
          { success: false, message: "올바르지 않은 타깃 조건입니다." },
          { status: 400 }
        );
      }

      // 타깃 조건 업데이트
      const { error: updateError } = await supabase
        .from("campaigns")
        .update({ 
          target_criteria: target_criteria,
          updated_at: new Date().toISOString()
        })
        .eq("id", campaignId)
        .eq("user_id", userId);

      if (updateError) {
        console.error("캠페인 타깃 조건 수정 오류:", updateError);
        return NextResponse.json(
          { success: false, message: "캠페인 수정에 실패했습니다." },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "캠페인이 성공적으로 수정되었습니다.",
        data: {
          id: campaignId,
          target_criteria: target_criteria,
        }
      });
    }

    // 이름 수정 처리
    // 입력 검증
    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { success: false, message: "캠페인 이름을 입력해주세요." },
        { status: 400 }
      );
    }

    if (name.trim().length > 100) {
      return NextResponse.json(
        { success: false, message: "캠페인 이름은 100자를 초과할 수 없습니다." },
        { status: 400 }
      );
    }

    // 캠페인 존재 확인 및 소유자 확인
    const { data: campaign, error: campaignError } = await supabase
      .from("campaigns")
      .select("id, name, user_id")
      .eq("id", campaignId)
      .eq("user_id", userId) // 본인의 캠페인만 수정 가능
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json(
        { success: false, message: "캠페인을 찾을 수 없거나 수정 권한이 없습니다." },
        { status: 404 }
      );
    }

    // 캠페인 이름 업데이트
    const { error: updateError } = await supabase
      .from("campaigns")
      .update({ 
        name: name.trim(),
        updated_at: new Date().toISOString()
      })
      .eq("id", campaignId)
      .eq("user_id", userId); // 추가 보안 확인

    if (updateError) {
      console.error("캠페인 이름 수정 오류:", updateError);
      return NextResponse.json(
        { success: false, message: "캠페인 이름 수정에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "캠페인 이름이 성공적으로 수정되었습니다.",
      data: {
        id: campaignId,
        name: name.trim(),
      }
    });
  } catch (error) {
    console.error("캠페인 수정 API 오류:", error);
    return NextResponse.json(
      { success: false, message: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// 단일 캠페인 조회 API (추가 기능)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const campaignId = parseInt(id);

    if (isNaN(campaignId)) {
      return NextResponse.json(
        { success: false, message: "올바르지 않은 캠페인 ID입니다." },
        { status: 400 }
      );
    }

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

    // 캠페인 조회 (템플릿 정보와 함께)
    const { data: campaign, error: campaignError } = await supabase
      .from("campaigns")
      .select(`
        *,
        message_templates (
          name,
          content,
          image_url,
          category
        )
      `)
      .eq("id", campaignId)
      .eq("user_id", userId) // 본인의 캠페인만 조회 가능
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json(
        { success: false, message: "캠페인을 찾을 수 없거나 조회 권한이 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      campaign: campaign,
    });
  } catch (error) {
    console.error("캠페인 조회 API 오류:", error);
    return NextResponse.json(
      { success: false, message: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
