import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const jwtSecret = process.env.JWT_SECRET!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Transaction 타입 정의 (최적화됨)
export interface Transaction {
  id: string;
  user_id: number;
  type: "charge" | "usage" | "refund";
  amount: number; // 실제 변경량 (usage는 음수, charge/refund는 양수)
  balance: number; // 트랜잭션 후 잔액
  description: string;
  reference_id?: string;
  metadata?: Record<string, string | number | boolean>;
  created_at: string;
}

// JWT 토큰에서 사용자 ID 추출
interface JWTPayload {
  userId: string;
  email: string;
  name: string;
  phoneNumber: string;
  role: string;
}

function getUserIdFromToken(token: string): number | null {
  try {
    const decoded = jwt.verify(token, jwtSecret) as JWTPayload;
    return parseInt(decoded.userId);
  } catch (error) {
    console.error("JWT 토큰 검증 실패:", error);
    return null;
  }
}

// 사용자의 현재 잔액을 일지에서 계산하는 함수
async function calculateCurrentBalance(userId: number): Promise<number> {
  const { data: transactions, error } = await supabase
    .from("transactions")
    .select("amount")
    .eq("user_id", userId)
    .order("created_at", { ascending: true }); // 시간순으로 정렬

  if (error) {
    console.error("잔액 계산 오류:", error);
    return 0;
  }

  // 모든 트랜잭션의 amount를 합산하여 현재 잔액 계산
  return (
    transactions?.reduce(
      (total, transaction) => total + transaction.amount,
      0
    ) || 0
  );
}

// GET: 사용자의 트랜잭션 목록 조회
export async function GET(request: NextRequest) {
  try {
    // Authorization 헤더에서 토큰 추출
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "인증 토큰이 필요합니다." },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const userId = getUserIdFromToken(token);

    if (!userId) {
      return NextResponse.json(
        { error: "유효하지 않은 토큰입니다." },
        { status: 401 }
      );
    }

    // URL 파라미터 추출
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");
    const type = searchParams.get("type"); // charge, usage, refund

    // 쿼리 빌더 시작
    let query = supabase
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }) // 최신순으로 표시
      .range(offset, offset + limit - 1);

    // 타입 필터링
    if (type && ["charge", "usage", "refund"].includes(type)) {
      query = query.eq("type", type);
    }

    const { data: transactions, error } = await query;

    if (error) {
      console.error("트랜잭션 조회 오류:", error);
      return NextResponse.json(
        { error: "트랜잭션 조회에 실패했습니다." },
        { status: 500 }
      );
    }

    // 요구사항에 따라 일지에서 현재 잔액 계산
    const currentBalance = await calculateCurrentBalance(userId);

    return NextResponse.json({
      transactions,
      currentBalance,
      total: transactions?.length || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error("트랜잭션 조회 API 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// POST: 새 트랜잭션 생성
export async function POST(request: NextRequest) {
  try {
    // Authorization 헤더에서 토큰 추출
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "인증 토큰이 필요합니다." },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const userId = getUserIdFromToken(token);

    if (!userId) {
      return NextResponse.json(
        { error: "유효하지 않은 토큰입니다." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { type, amount, description, reference_id, metadata } = body;

    // 입력 검증 - 요구사항에 따른 엄격한 검증
    if (!type || !["charge", "usage", "refund"].includes(type)) {
      return NextResponse.json(
        { error: "유효하지 않은 트랜잭션 타입입니다." },
        { status: 400 }
      );
    }

    // 음수, 0, 문자 등 잘못된 금액 차단
    if (!amount || typeof amount !== "number" || amount <= 0 || isNaN(amount)) {
      return NextResponse.json(
        { error: "금액은 0보다 큰 숫자여야 합니다." },
        { status: 400 }
      );
    }

    if (
      !description ||
      typeof description !== "string" ||
      description.trim() === ""
    ) {
      return NextResponse.json(
        { error: "설명이 필요합니다." },
        { status: 400 }
      );
    }

    // 현재 잔액을 일지에서 계산
    const currentBalance = await calculateCurrentBalance(userId);

    // 트랜잭션 금액 계산 (usage는 음수, charge/refund는 양수)
    const transactionAmount =
      type === "usage" ? -Math.abs(amount) : Math.abs(amount);
    const newBalance = currentBalance + transactionAmount;

    // 잔액 부족 검증 (사용 시에만)
    if (type === "usage" && newBalance < 0) {
      return NextResponse.json(
        {
          error: `잔액이 부족합니다. 현재 잔액: ${currentBalance}원, 사용 요청: ${amount}원`,
        },
        { status: 400 }
      );
    }

    // 동시성 처리를 위해 현재 시간을 밀리초까지 정확히 생성
    const now = new Date();
    const preciseTimestamp = now.toISOString();

    // 트랜잭션 생성 (최적화된 필드만 사용)
    const { data: newTransaction, error: insertError } = await supabase
      .from("transactions")
      .insert({
        user_id: userId,
        type,
        amount: transactionAmount,
        balance: newBalance,
        description: description.trim(),
        reference_id,
        metadata: metadata || {},
        created_at: preciseTimestamp,
      })
      .select()
      .single();

    if (insertError) {
      console.error("트랜잭션 생성 오류:", insertError);

      // 동시성 오류 처리
      if (insertError.code === "23505") {
        // 유니크 제약조건 위반
        return NextResponse.json(
          {
            error:
              "동시에 같은 시간에 트랜잭션을 처리할 수 없습니다. 잠시 후 다시 시도해주세요.",
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: "트랜잭션 생성에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      transaction: newTransaction,
      newBalance,
      message: `${
        type === "charge" ? "충전" : type === "usage" ? "사용" : "환불"
      } 완료: ${Math.abs(transactionAmount)}원`,
    });
  } catch (error) {
    console.error("트랜잭션 생성 API 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
