import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// 트랜잭션 메타데이터 타입 정의
interface TransactionMetadata {
  transactionType?: string;
  pointType?: string;
  chargedBy?: string;
  adminUserId?: number;
  reason?: string;
  isReward?: boolean;
  bulkChargeId?: string;
}

// Supabase 클라이언트 생성
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  db: {
    schema: "public",
  },
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// JWT 토큰에서 사용자 정보 추출
function getUserInfoFromToken(request: NextRequest): { userId: number; role: string } | null {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; role: string };
    return { userId: decoded.userId, role: decoded.role };
  } catch (error) {
    console.error("JWT 토큰 검증 실패:", error);
    return null;
  }
}

// 개별 포인트 충전 (POST)
export async function POST(request: NextRequest) {
  try {
    // JWT 토큰에서 사용자 정보 추출
    const userInfo = getUserInfoFromToken(request);
    if (!userInfo || userInfo.role !== "ADMIN") {
      return NextResponse.json(
        { error: "관리자 권한이 필요합니다." },
        { status: 403 }
      );
    }

    const adminUserId = userInfo.userId;

    // 요청 본문 파싱
    const body = await request.json();
    const { userId, amount, description, reason } = body;

    // 입력 검증
    if (!userId || !amount || !description || !reason) {
      return NextResponse.json(
        { error: "필수 필드가 누락되었습니다." },
        { status: 400 }
      );
    }

    if (typeof amount !== "number" || amount <= 0) {
      return NextResponse.json(
        { error: "올바른 포인트 금액을 입력해주세요." },
        { status: 400 }
      );
    }

    // 대상 사용자 존재 확인
    const { data: targetUser, error: userError } = await supabase
      .from("users")
      .select("id, name, username")
      .eq("id", parseInt(userId))
      .single();

    if (userError || !targetUser) {
      return NextResponse.json(
        { error: "대상 사용자를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 포인트 충전 트랜잭션 생성
    const transactionData = {
      user_id: parseInt(userId),
      type: "charge",
      amount: amount,
      description: description,
      reference_id: `admin_point_charge_${Date.now()}`,
      metadata: {
        transactionType: "point",
        pointType: "admin_charge",
        chargedBy: "admin",
        adminUserId: adminUserId,
        reason: reason,
        isReward: true, // 포인트로 구분하기 위한 플래그
      },
      status: "completed",
    };

    const { data: newTransaction, error: insertError } = await supabase
      .from("transactions")
      .insert(transactionData)
      .select()
      .single();

    if (insertError) {
      console.error("트랜잭션 생성 오류:", insertError);
      return NextResponse.json(
        { error: "포인트 충전에 실패했습니다." },
        { status: 500 }
      );
    }

    // 충전 후 사용자의 총 포인트 계산 (포인트 트랜잭션만)
    const { data: userTransactions, error: balanceError } = await supabase
      .from("transactions")
      .select("amount, type, metadata")
      .eq("user_id", parseInt(userId))
      .eq("status", "completed");

    let newBalance = 0;
    if (!balanceError && userTransactions) {
      // 포인트 충전 계산
      const pointCharged = userTransactions
        .filter(t => {
          if (t.type === "charge") {
            const metadata = t.metadata as TransactionMetadata;
            return metadata && metadata.isReward === true;
          }
          return false;
        })
        .reduce((sum, t) => sum + t.amount, 0);

      // 포인트 사용 계산
      const pointUsed = userTransactions
        .filter(t => {
          if (t.type === "usage") {
            const metadata = t.metadata as TransactionMetadata;
            return metadata && metadata.transactionType === "point";
          }
          return false;
        })
        .reduce((sum, t) => sum + t.amount, 0);

      newBalance = pointCharged - pointUsed;
    }

    return NextResponse.json({
      success: true,
      message: `${targetUser.name}님에게 ${amount.toLocaleString()}포인트가 충전되었습니다.`,
      transaction: newTransaction,
      newBalance: newBalance,
    });

  } catch (error) {
    console.error("포인트 충전 오류:", error);
    return NextResponse.json(
      { error: "포인트 충전에 실패했습니다." },
      { status: 500 }
    );
  }
}