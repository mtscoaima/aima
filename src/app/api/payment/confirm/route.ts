import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

/**
 * 사용자의 광고머니 잔액 계산
 * - 완료된 거래 내역(completed)만 집계
 * - charge: 충전 (리워드 제외)
 * - usage: 사용 (포인트 제외)
 * - refund: 환불
 * - penalty: 차감
 * - reserve/unreserve: 예약 (잔액에 영향 없음)
 */
async function calculateCreditBalance(userId: number): Promise<number> {
  try {
    const { data: transactions, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "completed")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("트랜잭션 조회 오류:", error);
      return 0;
    }

    let balance = 0;

    for (const transaction of transactions || []) {
      const metadata = transaction.metadata as Record<string, string | number | boolean> | null;

      if (transaction.type === "charge") {
        if (!metadata?.isReward) {
          balance += transaction.amount;
        }
      } else if (transaction.type === "usage") {
        if (metadata?.transactionType !== "point") {
          balance -= transaction.amount;
        }
      } else if (transaction.type === "refund") {
        balance += transaction.amount;
      } else if (transaction.type === "penalty") {
        balance -= transaction.amount;
      }
    }

    return Math.max(0, balance);
  } catch (error) {
    console.error("광고머니 잔액 계산 중 오류:", error);
    return 0;
  }
}



export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paymentKey, orderId, amount, paymentData } = body;

    if (!paymentKey || !orderId || !amount) {
      return NextResponse.json(
        { error: "필수 파라미터가 누락되었습니다." },
        { status: 400 }
      );
    }

    let finalPaymentData = paymentData;

    if (!finalPaymentData) {
      finalPaymentData = {
        resultCode: "0000",
        resultMsg: "정상처리",
        tid: paymentKey,
        orderId: orderId,
        amount: amount.toString(),
        method: "nicepay",
        applDate: new Date().toISOString().slice(0, 10).replace(/-/g, ""),
        applTime: new Date().toISOString().slice(11, 19).replace(/:/g, ""),
      };
    }

    const adMoney = amount;
    const description = "광고머니 충전";

    try {
      let customerEmail = null;

      if (paymentData?.checkout?.customer?.email) {
        customerEmail = paymentData.checkout.customer.email;
      } else if (paymentData?.customer?.email) {
        customerEmail = paymentData.customer.email;
      } else if (paymentData?.customerEmail) {
        customerEmail = paymentData.customerEmail;
      } else if (paymentData?.receipt?.customerEmail) {
        customerEmail = paymentData.receipt.customerEmail;
      } else if (paymentData?.buyerEmail) {
        customerEmail = paymentData.buyerEmail;
      } else if (paymentData?.custEmail) {
        customerEmail = paymentData.custEmail;
      }

      let userIdFromOrderId = null;
      if (!customerEmail && orderId) {
        const orderIdParts = orderId.split("_");
        if (orderIdParts.length >= 3 && orderIdParts[0] === "credit") {
          userIdFromOrderId = orderIdParts[2];
        }
      }

      let userData = null;
      let userError = null;

      if (
        customerEmail &&
        customerEmail !== "unknown@example.com" &&
        customerEmail !== "customer@example.com"
      ) {
        const result = await supabase
          .from("users")
          .select("id, email, name")
          .eq("email", customerEmail)
          .single();

        userData = result.data;
        userError = result.error;
      }

      if (!userData && userIdFromOrderId && userIdFromOrderId !== "unknown") {
        const result = await supabase
          .from("users")
          .select("id, email, name")
          .eq("id", userIdFromOrderId)
          .single();

        userData = result.data;
        userError = result.error;
      }

      if (userError || !userData) {
        console.error("사용자 조회 실패:", userError);
        return NextResponse.json(
          {
            error: "사용자 정보를 찾을 수 없습니다.",
            details: userError?.message || "사용자 조회 실패",
          },
          { status: 404 }
        );
      }

      const userId = userData.id;

      const { error: testError } = await supabase
        .from("users")
        .select("count", { count: "exact", head: true });

      if (testError) {
        throw new Error(`users 테이블 접근 실패: ${testError.message}`);
      }

      // 2. transactions 테이블 확인
      const { error: transactionsTestError } = await supabase
        .from("transactions")
        .select("count", { count: "exact", head: true });

      if (transactionsTestError) {
        console.error(transactionsTestError);
        throw new Error(
          `transactions 테이블 접근 실패: ${transactionsTestError.message}`
        );
      }

      const { data: existingTransaction, error: existingError } = await supabase
        .from("transactions")
        .select("*")
        .eq("reference_id", paymentKey)
        .eq("user_id", userId)
        .eq("type", "charge")
        .single();

      let transaction;

      if (existingTransaction && !existingError) {
        transaction = existingTransaction;

        const newBalance = await calculateCreditBalance(userId);

        return NextResponse.json({
          success: true,
          payment: finalPaymentData,
          message: "이미 처리된 결제입니다.",
          creditInfo: {
            userId,
            adMoney: existingTransaction.amount,
            newBalance,
            description: existingTransaction.description,
            transaction: existingTransaction,
          },
        });
      } else {
        const transactionData = {
          user_id: userId,
          type: "charge" as const,
          amount: adMoney,
          description: description,
          reference_id: paymentKey,
          metadata: {
            paymentKey,
            orderId,
            paymentAmount: amount,
            paymentMethod: finalPaymentData.method || "nicepay",
            adMoney: adMoney,
          },
          status: "completed" as const,
        };

        const { data: newTransaction, error: transactionError } = await supabase
          .from("transactions")
          .insert(transactionData)
          .select()
          .single();

        if (transactionError) {
          throw new Error(
            `광고머니 충전에 실패했습니다: ${transactionError.message}`
          );
        }

        transaction = newTransaction;
      }

      const newBalance = await calculateCreditBalance(userId);

      const responseData = {
        success: true,
        payment: finalPaymentData,
        message: "결제가 성공적으로 완료되었습니다.",
        creditInfo: {
          userId,
          adMoney,
          newBalance,
          description,
          transaction,
        },
      };

      return NextResponse.json(responseData);
    } catch (creditError) {
      console.error("광고머니 충전 처리 오류:", creditError);

      return NextResponse.json({
        success: true,
        payment: finalPaymentData,
        message:
          "결제는 성공했으나 광고머니 충전에 문제가 발생했습니다. 관리자에게 문의하세요.",
        error:
          creditError instanceof Error
            ? creditError.message
            : "광고머니 충전 오류",
        paymentKey,
        orderId,
        amount,
      });
    }
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "서버 오류가 발생했습니다.",
        message: error instanceof Error ? error.message : "알 수 없는 오류",
      },
      { status: 500 }
    );
  }
}
