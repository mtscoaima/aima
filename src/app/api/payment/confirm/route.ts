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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paymentKey, orderId, amount } = body;

    if (!paymentKey || !orderId || !amount) {
      return NextResponse.json(
        { error: "필수 파라미터가 누락되었습니다." },
        { status: 400 }
      );
    }

    // 토스페이먼츠 결제 승인 API 호출
    const secretKey = process.env.TOSS_SECRET_KEY || "";
    const encodedSecretKey = Buffer.from(secretKey + ":").toString("base64");

    const requestBody = {
      paymentKey,
      orderId,
      amount,
    };

    const response = await fetch(
      "https://api.tosspayments.com/v1/payments/confirm",
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${encodedSecretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      }
    );

    const paymentData = await response.json();

    if (!response.ok) {
      console.error(
        "🔍 [DEBUG] 토스페이먼츠 결제 승인 실패:",
        paymentData.message
      );

      return NextResponse.json(
        {
          error: "결제 승인에 실패했습니다.",
          message: paymentData.message || "알 수 없는 오류",
          code: paymentData.code,
        },
        { status: response.status }
      );
    }

    let creditAmount = 0;
    let packageName = "크레딧 충전";

    // 패키지 정보를 orderId나 결제 금액으로 추정 (1원당 1크레딧)
    const packageMap: Record<number, { credits: number; name: string }> = {
      10000: { credits: 10000, name: "크레딧 10,000개 패키지" },
      28000: { credits: 28000, name: "크레딧 28,000개 패키지" },
      45000: { credits: 45000, name: "크레딧 45,000개 패키지" },
      50000: { credits: 50000, name: "크레딧 50,000개 패키지" },
      85000: { credits: 85000, name: "크레딧 85,000개 패키지" },
    };

    const packageInfo = packageMap[amount];
    if (packageInfo) {
      creditAmount = packageInfo.credits;
      packageName = packageInfo.name;
    } else {
      // 기본 계산: 1원당 1크레딧
      creditAmount = amount;
    }

    try {
      // 결제 정보에서 사용자 정보 추출
      // 토스페이먼츠 결제 데이터에서 고객 정보 찾기
      let customerEmail = null;

      // 다양한 경로에서 이메일 추출 시도
      if (paymentData.checkout?.customer?.email) {
        customerEmail = paymentData.checkout.customer.email;
      } else if (paymentData.customer?.email) {
        customerEmail = paymentData.customer.email;
      } else if (paymentData.customerEmail) {
        customerEmail = paymentData.customerEmail;
      } else if (paymentData.receipt?.customerEmail) {
        customerEmail = paymentData.receipt.customerEmail;
      }

      // 이메일이 없는 경우 orderId에서 사용자 정보 추출 시도
      let userIdFromOrderId = null;
      if (!customerEmail && orderId) {
        // orderId 형식: credit_timestamp_userId_randomstring
        const orderIdParts = orderId.split("_");
        if (orderIdParts.length >= 3 && orderIdParts[0] === "credit") {
          userIdFromOrderId = orderIdParts[2]; // userId 부분
        }
      }

      // 사용자 조회 (이메일 또는 orderId에서 추출한 ID로)
      let userData = null;
      let userError = null;

      // 1. 이메일로 사용자 조회 시도
      if (customerEmail && customerEmail !== "unknown@example.com") {
        const result = await supabase
          .from("users")
          .select("id, email, name")
          .eq("email", customerEmail)
          .single();

        userData = result.data;
        userError = result.error;
      }

      // 2. 이메일로 찾지 못한 경우 orderId에서 추출한 ID로 조회
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
        console.error("🔍 [DEBUG] 최종 에러:", userError);
        // 사용자를 찾을 수 없어도 결제는 성공으로 처리하고 수동으로 크레딧 추가
        return NextResponse.json({
          success: true,
          payment: paymentData,
          message: "결제가 완료되었습니다. 크레딧은 수동으로 추가됩니다.",
          warning: "사용자 정보를 찾을 수 없어 수동 처리가 필요합니다.",
          debugInfo: {
            customerEmail,
            userIdFromOrderId,
            orderId,
            paymentKey,
          },
        });
      }

      const userId = userData.id;

      const { error: testError } = await supabase
        .from("users")
        .select("count", { count: "exact", head: true });

      if (testError) {
        console.error("🔍 [DEBUG] users 테이블 접근 실패:", testError);
        throw new Error(`users 테이블 접근 실패: ${testError.message}`);
      }

      // 2. transactions 테이블 확인
      const { error: transactionsTestError } = await supabase
        .from("transactions")
        .select("count", { count: "exact", head: true });

      if (transactionsTestError) {
        console.error(
          "🔍 [DEBUG] transactions 테이블 접근 실패:",
          transactionsTestError
        );
        throw new Error(
          `transactions 테이블 접근 실패: ${transactionsTestError.message}`
        );
      }

      // 3. user_balances 테이블 확인
      const { error: balancesTestError } = await supabase
        .from("user_balances")
        .select("count", { count: "exact", head: true });

      if (balancesTestError) {
        console.error(
          "🔍 [DEBUG] user_balances 테이블 접근 실패:",
          balancesTestError
        );
      }

      // 크레딧 충전 트랜잭션 생성
      const transactionData = {
        user_id: userId,
        type: "charge" as const,
        amount: creditAmount,
        description: `${packageName} 충전`,
        reference_id: paymentKey,
        metadata: {
          paymentKey,
          orderId,
          paymentAmount: amount,
          packagePrice: amount, // 충전 내역에서 사용
          paymentMethod: paymentData.method || "toss",
          packageName,
          totalCredits: creditAmount,
        },
        status: "completed" as const,
      };

      const { data: transaction, error: transactionError } = await supabase
        .from("transactions")
        .insert(transactionData)
        .select()
        .single();

      if (transactionError) {
        console.error("🔍 [DEBUG] 크레딧 트랜잭션 생성 실패:", {
          error: transactionError,
          code: transactionError.code,
          message: transactionError.message,
          details: transactionError.details,
          hint: transactionError.hint,
        });
        throw new Error(
          `크레딧 충전에 실패했습니다: ${transactionError.message}`
        );
      }

      // 최종 잔액 조회
      const { data: finalBalance, error: balanceError } = await supabase
        .from("user_balances")
        .select("current_balance")
        .eq("user_id", userId)
        .single();

      if (balanceError) {
        console.error("🔍 [DEBUG] 최종 잔액 조회 실패:", balanceError);
      }

      const newBalance = finalBalance?.current_balance || 0;

      return NextResponse.json({
        success: true,
        payment: paymentData,
        message: "결제가 성공적으로 완료되었습니다.",
        creditInfo: {
          userId,
          creditAmount,
          totalCredits: creditAmount,
          newBalance,
          packageName,
          transaction,
        },
      });
    } catch (creditError) {
      console.error("🔍 [DEBUG] 크레딧 충전 처리 중 오류:", creditError);

      // 크레딧 충전 실패해도 결제는 성공했으므로 성공으로 응답
      // 수동으로 크레딧을 추가할 수 있도록 정보 제공
      return NextResponse.json({
        success: true,
        payment: paymentData,
        message: "결제가 완료되었습니다. 크레딧은 수동으로 추가됩니다.",
        warning: "자동 크레딧 충전에 실패했습니다.",
        manualCreditInfo: {
          creditAmount,
          totalCredits: creditAmount,
          packageName,
          paymentKey,
          orderId,
          amount,
        },
      });
    }
  } catch (error) {
    console.error("🔍 [DEBUG] 결제 승인 처리 중 오류:", error);
    console.error("🔍 [DEBUG] 에러 타입:", typeof error);
    console.error(
      "🔍 [DEBUG] 에러 메시지:",
      error instanceof Error ? error.message : String(error)
    );
    console.error(
      "🔍 [DEBUG] 에러 스택:",
      error instanceof Error ? error.stack : "No stack trace"
    );

    return NextResponse.json(
      {
        error: "서버 오류가 발생했습니다.",
        message: error instanceof Error ? error.message : "알 수 없는 오류",
      },
      { status: 500 }
    );
  }
}
