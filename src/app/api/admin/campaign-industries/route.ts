import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: 전체 업종 목록 조회 (관리자용)
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('campaign_industries')
      .select('*')
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

// POST: 새 업종 추가
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { order_number, name, is_active = true } = body;

    if (!order_number || !name) {
      return NextResponse.json({ error: '순서와 이름은 필수입니다.' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('campaign_industries')
      .insert([{ order_number, name, is_active }])
      .select()
      .single();

    if (error) {
      console.error('업종 생성 오류:', error);
      return NextResponse.json({ error: '업종 생성에 실패했습니다.' }, { status: 500 });
    }

    return NextResponse.json({ industry: data }, { status: 201 });
  } catch (error) {
    console.error('업종 생성 API 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
