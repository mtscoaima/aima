import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateAuthAndAdminWithSuccess } from '@/utils/authUtils';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: 커스텀 업종 통계 조회
export async function GET(request: NextRequest) {
  try {
    // 관리자 권한 확인
    const authResult = validateAuthAndAdminWithSuccess(request);
    if (!authResult.isValid) {
      return authResult.errorResponse!;
    }

    // 쿼리 파라미터 추출
    const { searchParams } = new URL(request.url);
    const sortBy = searchParams.get('sortBy') || 'count'; // 'name' | 'count' | 'lastUsed'
    const sortOrder = searchParams.get('sortOrder') || 'desc'; // 'asc' | 'desc'

    // 커스텀 업종별 사용 횟수 및 최근 사용일 조회
    const { data, error } = await supabase
      .from('custom_campaign_industries')
      .select('custom_name, created_at');

    if (error) {
      console.error('커스텀 업종 조회 오류:', error);
      return NextResponse.json({ error: '커스텀 업종 데이터를 불러올 수 없습니다.' }, { status: 500 });
    }

    // 업종명별로 그룹화하여 통계 생성
    const stats = new Map<string, { count: number; lastUsed: string }>();

    data.forEach((item) => {
      const existing = stats.get(item.custom_name);
      if (existing) {
        existing.count += 1;
        if (new Date(item.created_at) > new Date(existing.lastUsed)) {
          existing.lastUsed = item.created_at;
        }
      } else {
        stats.set(item.custom_name, {
          count: 1,
          lastUsed: item.created_at
        });
      }
    });

    // Map을 배열로 변환
    const customIndustries = Array.from(stats.entries())
      .map(([name, { count, lastUsed }]) => ({
        name,
        count,
        lastUsed
      }));

    // 정렬 적용
    customIndustries.sort((a, b) => {
      let comparison = 0;

      if (sortBy === 'name') {
        // 한글 로케일 기준 정렬
        comparison = a.name.localeCompare(b.name, 'ko-KR');
      } else if (sortBy === 'count') {
        comparison = a.count - b.count;
      } else if (sortBy === 'lastUsed') {
        comparison = new Date(a.lastUsed).getTime() - new Date(b.lastUsed).getTime();
      }

      // 정렬 순서 적용
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return NextResponse.json({ customIndustries });
  } catch (error) {
    console.error('커스텀 업종 API 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

// POST: 커스텀 업종을 정식 업종으로 승격 (다중 업종 통합 지원)
export async function POST(request: NextRequest) {
  try {
    // 관리자 권한 확인
    const authResult = validateAuthAndAdminWithSuccess(request);
    if (!authResult.isValid) {
      return authResult.errorResponse!;
    }

    const body = await request.json();

    // 하위 호환성: customName (단일) 또는 customNames (다중) 지원
    let customNames: string[];
    let newIndustryName: string;

    if (body.customNames && Array.isArray(body.customNames)) {
      // 다중 업종 승격
      customNames = body.customNames;
      newIndustryName = body.newIndustryName || body.customNames[0];
    } else if (body.customName) {
      // 단일 업종 승격 (하위 호환성)
      customNames = [body.customName];
      newIndustryName = body.customName;
    } else {
      return NextResponse.json({ error: '업종명은 필수입니다.' }, { status: 400 });
    }

    const { orderNumber, isActive = true } = body;

    if (!orderNumber || customNames.length === 0 || !newIndustryName?.trim()) {
      return NextResponse.json({ error: '필수 항목이 누락되었습니다.' }, { status: 400 });
    }

    // 1. campaign_industries에 새 정식 업종 추가
    const { data: newIndustry, error: insertError } = await supabase
      .from('campaign_industries')
      .insert([{
        order_number: orderNumber,
        name: newIndustryName.trim(),
        is_active: isActive
      }])
      .select()
      .single();

    if (insertError) {
      console.error('정식 업종 생성 오류:', insertError);
      return NextResponse.json({ error: '정식 업종 생성에 실패했습니다.' }, { status: 500 });
    }

    // 2. 선택된 모든 커스텀 업종을 사용한 캠페인들 찾기
    const { data: customRecords, error: findError } = await supabase
      .from('custom_campaign_industries')
      .select('campaign_id')
      .in('custom_name', customNames);

    if (findError) {
      console.error('커스텀 업종 레코드 조회 오류:', findError);
      // 계속 진행 (정식 업종은 이미 생성됨)
    }

    let updatedCount = 0;

    if (customRecords && customRecords.length > 0) {
      // 중복 제거
      const campaignIds = [...new Set(customRecords.map(r => r.campaign_id))];
      updatedCount = campaignIds.length;

      // 3. 해당 캠페인들의 campaign_industry_id를 14 → 새 ID로 업데이트
      const { error: updateError } = await supabase
        .from('campaigns')
        .update({ campaign_industry_id: newIndustry.id })
        .in('id', campaignIds)
        .eq('campaign_industry_id', 14); // 14번(기타)인 것만 업데이트

      if (updateError) {
        console.error('캠페인 업종 업데이트 오류:', updateError);
        return NextResponse.json({ error: '캠페인 업종 업데이트에 실패했습니다.' }, { status: 500 });
      }

      // 4. custom_campaign_industries에서 해당 레코드 삭제
      const { error: deleteError } = await supabase
        .from('custom_campaign_industries')
        .delete()
        .in('custom_name', customNames);

      if (deleteError) {
        console.error('커스텀 업종 레코드 삭제 오류:', deleteError);
        return NextResponse.json({ error: '커스텀 업종 레코드 삭제에 실패했습니다.' }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      message: `${customNames.length}개의 커스텀 업종이 "${newIndustryName}"으로 승격되었습니다.`,
      industry: newIndustry,
      updatedCampaigns: updatedCount
    });
  } catch (error) {
    console.error('커스텀 업종 승격 API 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
