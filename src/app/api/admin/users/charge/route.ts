import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface TokenPayload {
  userId: number;
  role: 'USER' | 'SALESPERSON' | 'ADMIN';
}

export async function POST(request: NextRequest) {
  try {
    // JWT 토큰 검증
    const authorization = request.headers.get('authorization');
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, message: '인증 토큰이 없습니다.' }, { status: 401 });
    }

    const token = authorization.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;

    // 관리자 권한 확인
    if (decoded.role !== 'ADMIN') {
      return NextResponse.json({ success: false, message: '관리자 권한이 필요합니다.' }, { status: 403 });
    }

    const { userId, amount } = await request.json();

    // 입력값 검증
    if (!userId || !amount || typeof amount !== 'number') {
      return NextResponse.json({ success: false, message: '유효하지 않은 요청입니다.' }, { status: 400 });
    }

    if (amount < 10000 || amount > 1000000) {
      return NextResponse.json({ success: false, message: '충전 금액은 10,000원 이상 1,000,000원 이하여야 합니다.' }, { status: 400 });
    }

    // 충전 대상 사용자 확인
    const { data: targetUser, error: userError } = await supabase
      .from('users')
      .select('id, name')
      .eq('id', userId)
      .single();

    if (userError || !targetUser) {
      return NextResponse.json({ success: false, message: '사용자를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 트랜잭션 생성
    const transactionData = {
      user_id: parseInt(userId),
      type: 'charge',
      amount: amount,
      description: '광고머니 충전',
      reference_id: `admin_charge_${Date.now()}_${userId}`,
      metadata: {
        paymentAmount: amount,
        packagePrice: amount,
        paymentMethod: 'admin',
        packageName: `광고머니 ${amount.toLocaleString()}원 충전`
      },
      status: 'completed'
    };

    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .insert(transactionData)
      .select()
      .single();

    if (transactionError) {
      console.error('트랜잭션 생성 실패:', transactionError);
      return NextResponse.json({ success: false, message: '충전 처리 중 오류가 발생했습니다.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `${targetUser.name}님의 광고머니가 ${amount.toLocaleString()}원 충전되었습니다.`,
      transaction: transaction
    });

  } catch (error) {
    console.error('관리자 충전 API 오류:', error);
    
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ success: false, message: '유효하지 않은 토큰입니다.' }, { status: 401 });
    }

    return NextResponse.json({ success: false, message: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}