import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const topLevelCode = searchParams.get('top_level_code');

    if (topLevelCode) {
      // 특정 상위 업종의 세부 업종들 조회
      const { data, error } = await supabase
        .from('industries')
        .select('code, name')
        .eq('top_level_code', topLevelCode)
        .eq('is_active', true)
        .order('display_order');

      if (error) {
        console.error('업종 조회 오류:', error);
        return NextResponse.json({ error: '업종 데이터를 불러올 수 없습니다.' }, { status: 500 });
      }

      const industries = [
        { value: 'all', label: '전체' },
        ...data.map(item => ({
          value: item.code,
          label: item.name
        }))
      ];

      // Also return raw data for direct code/name matching
      return NextResponse.json({ industries, rawData: data });
    } else {
      // 상위 업종들 조회
      const { data, error } = await supabase
        .from('top_level_industries')
        .select('code, name')
        .eq('is_active', true)
        .order('display_order');

      if (error) {
        console.error('상위 업종 조회 오류:', error);
        return NextResponse.json({ error: '업종 데이터를 불러올 수 없습니다.' }, { status: 500 });
      }

      const topLevelIndustries = [
        { value: 'all', label: '전체' },
        ...data.map(item => ({
          value: item.code,
          label: item.name
        }))
      ];

      // Also return raw data for direct code/name matching
      return NextResponse.json({ topLevelIndustries, rawData: data });
    }
  } catch (error) {
    console.error('업종 API 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}