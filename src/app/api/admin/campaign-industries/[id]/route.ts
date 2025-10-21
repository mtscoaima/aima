import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// PUT: 업종 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { order_number, name, is_active } = body;

    const updateData: Record<string, any> = {};
    if (order_number !== undefined) updateData.order_number = order_number;
    if (name !== undefined) updateData.name = name;
    if (is_active !== undefined) updateData.is_active = is_active;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: '수정할 데이터가 없습니다.' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('campaign_industries')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('업종 수정 오류:', error);
      return NextResponse.json({ error: '업종 수정에 실패했습니다.' }, { status: 500 });
    }

    return NextResponse.json({ industry: data });
  } catch (error) {
    console.error('업종 수정 API 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

// DELETE: 업종 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { error } = await supabase
      .from('campaign_industries')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('업종 삭제 오류:', error);
      return NextResponse.json({ error: '업종 삭제에 실패했습니다.' }, { status: 500 });
    }

    return NextResponse.json({ message: '업종이 삭제되었습니다.' });
  } catch (error) {
    console.error('업종 삭제 API 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
