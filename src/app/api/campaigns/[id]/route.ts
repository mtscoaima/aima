import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { validateAuthWithSuccess } from "@/utils/authUtils";

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

    // 인증 검증
    const authResult = validateAuthWithSuccess(request);
    if (!authResult.isValid) {
      return authResult.errorResponse!;
    }

    const userId = authResult.userInfo!.userId.toString();

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

    // 승인완료된 캠페인은 삭제 불가
    if (campaign.status === "APPROVED") {
      return NextResponse.json(
        {
          success: false,
          message: "승인완료된 캠페인은 삭제할 수 없습니다.",
        },
        { status: 400 }
      );
    }

    // 예약금 해제 처리 (PENDING_APPROVAL, REVIEWING, REJECTED 상태의 캠페인)
    if (campaign.status === "PENDING_APPROVAL" || campaign.status === "REVIEWING" || campaign.status === "REJECTED") {
      // 해당 캠페인에 대한 모든 예약 트랜잭션들 조회 (포인트, 광고머니 구분)
      const { data: reserveTransactions, error: reserveError } = await supabase
        .from("transactions")
        .select("amount, metadata, reference_id")
        .eq("user_id", userId)
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
          user_id: parseInt(userId),
          type: "unreserve",
          amount: pointReservedAmount,
          description: `캠페인 포인트 예약 해제 - 삭제 (${campaign.name})`,
          reference_id: `campaign_point_unreserve_delete_${campaignId}`,
          metadata: {
            campaign_id: campaignId,
            campaign_name: campaign.name,
            unreserve_type: "campaign_deletion",
            transactionType: "point",
          },
          status: "completed",
        });
      }

      // 2. 광고머니 예약 해제 (광고머니가 예약되어 있을 경우)
      if (creditReservedAmount > 0) {
        transactions.push({
          user_id: parseInt(userId),
          type: "unreserve",
          amount: creditReservedAmount,
          description: `캠페인 광고머니 예약 해제 - 삭제 (${campaign.name})`,
          reference_id: `campaign_credit_unreserve_delete_${campaignId}`,
          metadata: {
            campaign_id: campaignId,
            campaign_name: campaign.name,
            unreserve_type: "campaign_deletion",
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

    // 인증 검증
    const authResult = validateAuthWithSuccess(request);
    if (!authResult.isValid) {
      return authResult.errorResponse!;
    }

    const userId = authResult.userInfo!.userId.toString();

    // 요청 본문 파싱
    const body = await request.json();
    const { name, requestApproval, cancelApprovalRequest, updateTargetCriteria, status, customIndustryName, custom_industry_name, ...updateData } = body;

    // custom_industry_name과 customIndustryName 둘 다 지원 (언더스코어/카멜케이스)
    const finalCustomIndustryName = customIndustryName || custom_industry_name;

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

      // REJECTED 상태인지 확인 (새로운 상태 체계에서는 REJECTED에서만 승인 재요청 가능)
      if (campaign.status !== "REJECTED") {
        return NextResponse.json(
          { success: false, message: "반려 상태의 캠페인만 승인 재요청할 수 있습니다." },
          { status: 400 }
        );
      }

      // 상태를 PENDING_APPROVAL로 변경 (반려 사유 초기화)
      const updateData: {
        status: string;
        updated_at: string;
        rejection_reason?: null;
        approved_by?: null;
        approved_at?: null;
      } = {
        status: "PENDING_APPROVAL",
        updated_at: new Date().toISOString(),
        rejection_reason: null,
        approved_by: null,
        approved_at: null
      };

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

      // PENDING_APPROVAL 또는 REVIEWING 상태인지 확인
      if (campaign.status !== "PENDING_APPROVAL" && campaign.status !== "REVIEWING") {
        return NextResponse.json(
          { success: false, message: "승인 대기 또는 승인 중 상태의 캠페인만 취소할 수 있습니다." },
          { status: 400 }
        );
      }

      // 상태를 REJECTED로 변경 (사용자가 직접 취소한 경우)
      const { error: updateError } = await supabase
        .from("campaigns")
        .update({ 
          status: "REJECTED",
          rejection_reason: "사용자 요청에 의한 승인 취소",
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
          status: "REJECTED",
        }
      });
    } else if (updateTargetCriteria) {
      // 타깃 조건 수정 처리
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

      // 수정 가능한 상태인지 확인 (REJECTED 상태만 수정 가능)
      if (campaign.status !== "REJECTED") {
        return NextResponse.json(
          { success: false, message: "반려 상태의 캠페인만 수정할 수 있습니다." },
          { status: 400 }
        );
      }

      // 타깃 조건 수정 기능 제거됨 (target_criteria 삭제로 인해)
      return NextResponse.json(
        { success: false, message: "타깃 조건 수정 기능은 더 이상 지원되지 않습니다." },
        { status: 400 }
      );
    } else if (status) {
      // 상태 변경 처리
      // 유효한 상태값인지 확인 (새로운 4개 상태)
      const validStatuses = ['PENDING_APPROVAL', 'REVIEWING', 'APPROVED', 'REJECTED'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { success: false, message: "올바르지 않은 상태값입니다." },
          { status: 400 }
        );
      }

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

      // 상태 변경 가능한지 확인
      const currentStatus = campaign.status;
      
      // 새로운 4개 상태 기준으로 토글 가능 여부 확인
      // APPROVED 상태에서만 활성/비활성 토글 가능 (실제로는 상태 표시만)
      const canToggle = currentStatus === 'APPROVED';
        
      if (!canToggle) {
        let errorMessage = "";
        
        switch (currentStatus) {
          case 'PENDING_APPROVAL':
            errorMessage = "승인대기 중인 캠페인입니다. 승인 완료 후 사용할 수 있습니다.";
            break;
          case 'REVIEWING':
            errorMessage = "승인 중인 캠페인입니다. 승인 완료 후 사용할 수 있습니다.";
            break;
          case 'REJECTED':
            errorMessage = "반려된 캠페인입니다. 수정 후 다시 승인 요청해주세요.";
            break;
          default:
            errorMessage = "승인완료된 캠페인만 사용 가능합니다.";
        }
        
        return NextResponse.json(
          { success: false, message: errorMessage },
          { status: 400 }
        );
      }

      // 상태 업데이트
      const { error: updateError } = await supabase
        .from("campaigns")
        .update({ 
          status: status,
          updated_at: new Date().toISOString()
        })
        .eq("id", campaignId)
        .eq("user_id", userId);

      if (updateError) {
        console.error("캠페인 상태 변경 오류:", updateError);
        return NextResponse.json(
          { success: false, message: "캠페인 상태 변경에 실패했습니다." },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "캠페인 상태가 성공적으로 변경되었습니다.",
        data: {
          id: campaignId,
          status: status,
        }
      });
    }

    // 일반 필드 수정 처리 (name 포함 모든 캠페인 정보)
    if (Object.keys(updateData).length > 0 || name) {
      // 캠페인 존재 확인 및 소유자 확인
      const { data: campaign, error: campaignError } = await supabase
        .from("campaigns")
        .select("*")
        .eq("id", campaignId)
        .eq("user_id", userId) // 본인의 캠페인만 수정 가능
        .single();

      if (campaignError || !campaign) {
        return NextResponse.json(
          { success: false, message: "캠페인을 찾을 수 없거나 수정 권한이 없습니다." },
          { status: 404 }
        );
      }

      // 승인 완료된 캠페인은 수정 불가
      if (campaign.status === "APPROVED") {
        return NextResponse.json(
          { success: false, message: "승인 완료된 캠페인은 수정할 수 없습니다." },
          { status: 403 }
        );
      }

      // 업데이트할 데이터 준비
      interface CampaignUpdateData {
        name?: string;
        description?: string;
        budget?: number;
        total_recipients?: number;
        schedule_start_date?: string;
        schedule_end_date?: string;
        desired_recipients?: string;
        target_age_groups?: string[];
        target_locations_detailed?: Array<{ city: string; districts: string[] } | string>;
        gender_ratio?: { male: number; female: number };
        card_amount_max?: number;
        card_time_start?: string;
        card_time_end?: string;
        campaign_industry_id?: number | null;
        unit_cost?: number;
        estimated_total_cost?: number;
        expert_review_requested?: boolean;
        expert_review_notes?: string;
        template_id?: number | null;
        updated_at?: string;
        [key: string]: unknown; // 추가 필드 허용
      }

      const finalUpdateData: CampaignUpdateData = { ...updateData };

      // custom_industry_name은 campaigns 테이블이 아닌 custom_campaign_industries 테이블에 저장
      // 따라서 finalUpdateData에서 제거
      delete finalUpdateData.custom_industry_name;

      // 이름 처리
      if (name) {
        if (typeof name !== "string" || !name.trim()) {
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

        finalUpdateData.name = name.trim();
      }

      // 캠페인 단가 자동 계산
      const newBudget = finalUpdateData.budget || campaign.budget;
      const newTotalRecipients = finalUpdateData.total_recipients || campaign.total_recipients;

      if (newBudget && newTotalRecipients) {
        finalUpdateData.unit_cost = Math.ceil(newBudget / newTotalRecipients);
      }

      // 업데이트 시간 설정
      finalUpdateData.updated_at = new Date().toISOString();

      // 캠페인 업데이트
      const { data: updatedCampaign, error: updateError } = await supabase
        .from("campaigns")
        .update(finalUpdateData)
        .eq("id", campaignId)
        .eq("user_id", userId) // 추가 보안 확인
        .select("*")
        .single();

      if (updateError) {
        console.error("캠페인 수정 오류:", updateError);
        return NextResponse.json(
          { success: false, message: "캠페인 수정에 실패했습니다." },
          { status: 500 }
        );
      }

      // 커스텀 업종 처리 (업종 ID가 14번인 경우)
      const oldIndustryId = campaign.campaign_industry_id;
      const newIndustryId = finalUpdateData.campaign_industry_id !== undefined
        ? finalUpdateData.campaign_industry_id
        : oldIndustryId;

      // 업종이 14번에서 다른 업종으로 변경된 경우: 커스텀 업종 삭제
      if (oldIndustryId === 14 && newIndustryId !== 14) {
        await supabase
          .from('custom_campaign_industries')
          .delete()
          .eq('campaign_id', campaignId);
      }

      // 업종이 14번으로 변경되었거나 14번 유지 중인 경우
      if (newIndustryId === 14) {
        // 커스텀 업종명이 제공되지 않았다면 에러 (신규 생성 시)
        if (oldIndustryId !== 14 && !finalCustomIndustryName) {
          return NextResponse.json(
            { success: false, message: "기타 업종을 선택하셨습니다. 업종명을 입력해주세요." },
            { status: 400 }
          );
        }

        // 커스텀 업종명이 제공된 경우 업데이트/삽입
        if (finalCustomIndustryName !== undefined && finalCustomIndustryName !== null) {
          if (!finalCustomIndustryName.trim()) {
            return NextResponse.json(
              { success: false, message: "기타 업종을 선택하셨습니다. 업종명을 입력해주세요." },
              { status: 400 }
            );
          }

          // 기존 커스텀 업종이 있는지 확인
          const { data: existingCustom } = await supabase
            .from('custom_campaign_industries')
            .select('id')
            .eq('campaign_id', campaignId)
            .single();

          if (existingCustom) {
            // 업데이트
            const { error: updateError } = await supabase
              .from('custom_campaign_industries')
              .update({ custom_name: finalCustomIndustryName.trim() })
              .eq('campaign_id', campaignId);

            if (updateError) {
              console.error('커스텀 업종 업데이트 오류:', updateError);
            }
          } else {
            // 신규 삽입
            const { error: insertError } = await supabase
              .from('custom_campaign_industries')
              .insert({
                campaign_id: campaignId,
                custom_name: finalCustomIndustryName.trim()
              });

            if (insertError) {
              console.error('커스텀 업종 삽입 오류:', insertError);
            }
          }
        }
      }

      return NextResponse.json({
        success: true,
        message: "캠페인이 성공적으로 수정되었습니다.",
        campaign: updatedCampaign
      });
    }

    // 아무것도 수정할 것이 없는 경우
    return NextResponse.json(
      { success: false, message: "수정할 데이터가 없습니다." },
      { status: 400 }
    );
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

    // 인증 검증
    const authResult = validateAuthWithSuccess(request);
    if (!authResult.isValid) {
      return authResult.errorResponse!;
    }

    const userId = authResult.userInfo!.userId.toString();

    // 캠페인 조회 (템플릿 정보 및 업종 정보와 함께)
    const { data: campaign, error: campaignError } = await supabase
      .from("campaigns")
      .select(`
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

    // custom_campaign_industries 배열을 custom_industry_name 문자열로 변환
    const customIndustryName = campaign.custom_campaign_industries?.[0]?.custom_name || null;
    const formattedCampaign = {
      ...campaign,
      custom_industry_name: customIndustryName,
    };

    return NextResponse.json({
      success: true,
      campaign: formattedCampaign,
    });
  } catch (error) {
    console.error("캠페인 조회 API 오류:", error);
    return NextResponse.json(
      { success: false, message: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
