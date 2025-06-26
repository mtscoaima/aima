import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

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

// 트랜잭션 타입 정의
type TransactionType = "charge" | "usage" | "refund" | "penalty";

// JWT 토큰에서 사용자 ID 추출
function getUserIdFromToken(request: NextRequest): number | null {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    return decoded.userId;
  } catch (error) {
    console.error("JWT 토큰 검증 실패:", error);
    return null;
  }
}

// 트랜잭션 목록 조회 (GET)
export async function GET(request: NextRequest) {
  try {
    // JWT 토큰에서 사용자 ID 추출
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json(
        { error: "인증 토큰이 필요합니다." },
        { status: 401 }
      );
    }

    // URL 파라미터 추출
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Supabase에서 트랜잭션 조회
    const { data: transactions, error: transactionError } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (transactionError) {
      console.error("트랜잭션 조회 오류:", transactionError);
      return NextResponse.json(
        { error: "트랜잭션 조회에 실패했습니다." },
        { status: 500 }
      );
    }

    // 전체 트랜잭션 개수 조회
    const { count, error: countError } = await supabase
      .from("transactions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    if (countError) {
      console.error("트랜잭션 개수 조회 오류:", countError);
    }

    // 현재 잔액 조회
    const { data: balanceData, error: balanceError } = await supabase
      .from("user_balances")
      .select("current_balance")
      .eq("user_id", userId)
      .single();

    if (balanceError && balanceError.code !== "PGRST116") {
      console.error("잔액 조회 오류:", balanceError);
    }

    const currentBalance = balanceData?.current_balance || 0;

    return NextResponse.json({
      transactions: transactions || [],
      currentBalance,
      total: count || 0,
    });
  } catch (error) {
    console.error("트랜잭션 조회 오류:", error);
    return NextResponse.json(
      { error: "트랜잭션 조회에 실패했습니다." },
      { status: 500 }
    );
  }
}

// 새 트랜잭션 생성 (POST)
export async function POST(request: NextRequest) {
  try {
    // JWT 토큰에서 사용자 ID 추출
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json(
        { error: "인증 토큰이 필요합니다." },
        { status: 401 }
      );
    }

    // 요청 본문 파싱
    const body = await request.json();
    const { type, amount, description, reference_id, metadata } = body;

    // 입력 검증
    if (!type || !amount || !description) {
      return NextResponse.json(
        { error: "필수 필드가 누락되었습니다." },
        { status: 400 }
      );
    }

    if (!["charge", "usage", "refund", "penalty"].includes(type)) {
      return NextResponse.json(
        { error: "유효하지 않은 트랜잭션 타입입니다." },
        { status: 400 }
      );
    }

    if (typeof amount !== "number" || isNaN(amount) || amount === 0) {
      return NextResponse.json(
        { error: "유효하지 않은 금액입니다." },
        { status: 400 }
      );
    }

    // 현재 잔액 조회
    const { data: balanceData, error: balanceError } = await supabase
      .from("user_balances")
      .select("current_balance")
      .eq("user_id", userId)
      .single();

    if (balanceError && balanceError.code !== "PGRST116") {
      console.error("잔액 조회 오류:", balanceError);
      return NextResponse.json(
        { error: "잔액 조회에 실패했습니다." },
        { status: 500 }
      );
    }

    const currentBalance = balanceData?.current_balance || 0;

    // 잔액 부족 검증 (사용/차감 트랜잭션인 경우)
    if (
      (type === "usage" || type === "penalty") &&
      currentBalance < Math.abs(amount)
    ) {
      return NextResponse.json(
        {
          error: `잔액이 부족합니다. 현재 잔액: ${currentBalance.toLocaleString()}, 요청 금액: ${Math.abs(
            amount
          ).toLocaleString()}`,
        },
        { status: 400 }
      );
    }

    // 트랜잭션 데이터 준비
    const transactionData = {
      user_id: userId,
      type: type as TransactionType,
      amount: Math.abs(amount), // 항상 양수로 저장
      description,
      reference_id,
      metadata: metadata || {},
      status: "completed" as const,
    };

    // Supabase에 트랜잭션 삽입 (트리거가 자동으로 잔액 업데이트)
    const { data: newTransaction, error: insertError } = await supabase
      .from("transactions")
      .insert(transactionData)
      .select()
      .single();

    if (insertError) {
      console.error("트랜잭션 생성 오류:", insertError);
      return NextResponse.json(
        { error: "트랜잭션 생성에 실패했습니다." },
        { status: 500 }
      );
    }

    // 업데이트된 잔액 조회
    const { data: updatedBalanceData, error: updatedBalanceError } =
      await supabase
        .from("user_balances")
        .select("current_balance")
        .eq("user_id", userId)
        .single();

    if (updatedBalanceError) {
      console.error("업데이트된 잔액 조회 오류:", updatedBalanceError);
    }

    const newBalance = updatedBalanceData?.current_balance || currentBalance;

    return NextResponse.json({
      transaction: newTransaction,
      newBalance,
    });
  } catch (error) {
    console.error("트랜잭션 생성 오류:", error);
    return NextResponse.json(
      { error: "트랜잭션 생성에 실패했습니다." },
      { status: 500 }
    );
  }
}
