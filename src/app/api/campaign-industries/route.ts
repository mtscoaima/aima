import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('campaign_industries')
      .select('id, order_number, name')
      .eq('is_active', true)
      .order('order_number');

    if (error) {
      console.error('업종 조회 오류:', error);
      return NextResponse.json({ error: '업종 데이터를 불러올 수 없습니다.' }, { status: 500 });
    }

    return NextResponse.json({ industries: data });
  } catch (error) {
    console.error('업종 API 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
