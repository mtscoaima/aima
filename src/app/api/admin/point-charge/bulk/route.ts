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

// 일괄 포인트 충전 (POST)
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
    const { userIds, amount, description, reason } = body;

    // 입력 검증
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: "대상 사용자를 선택해주세요." },
        { status: 400 }
      );
    }

    if (!amount || !description || !reason) {
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

    // 대상 사용자들 존재 확인
    const { data: targetUsers, error: usersError } = await supabase
      .from("users")
      .select("id, name, username")
      .in("id", userIds.map(id => parseInt(id)));

    if (usersError || !targetUsers || targetUsers.length === 0) {
      return NextResponse.json(
        { error: "대상 사용자를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    if (targetUsers.length !== userIds.length) {
      return NextResponse.json(
        { error: "일부 사용자를 찾을 수 없습니다." },
        { status: 400 }
      );
    }

    const results = [];
    const errors = [];

    // 각 사용자별로 포인트 충전 처리
    for (const user of targetUsers) {
      try {
        // 포인트 충전 트랜잭션 생성
        const transactionData = {
          user_id: user.id,
          type: "charge",
          amount: amount,
          description: description,
          reference_id: `admin_bulk_point_charge_${Date.now()}_${user.id}`,
          metadata: {
            transactionType: "point",
            pointType: "admin_bulk_charge",
            chargedBy: "admin",
            adminUserId: adminUserId,
            reason: reason,
            isReward: true, // 포인트로 구분하기 위한 플래그
            bulkChargeId: `bulk_${Date.now()}`, // 일괄 충전 식별자
          },
          status: "completed",
        };

        const { data: newTransaction, error: insertError } = await supabase
          .from("transactions")
          .insert(transactionData)
          .select()
          .single();

        if (insertError) {
          console.error(`사용자 ${user.id} 포인트 충전 오류:`, insertError);
          errors.push({
            userId: user.id,
            username: user.username,
            name: user.name,
            error: "트랜잭션 생성 실패",
          });
          continue;
        }

        // 충전 후 사용자의 총 포인트 계산
        const { data: userTransactions, error: balanceError } = await supabase
          .from("transactions")
          .select("amount, type")
          .eq("user_id", user.id)
          .eq("status", "completed");

        let newBalance = 0;
        if (!balanceError && userTransactions) {
          newBalance = userTransactions
            .filter(t => t.type === "charge")
            .reduce((sum, t) => sum + t.amount, 0);
        }

        results.push({
          userId: user.id,
          username: user.username,
          name: user.name,
          success: true,
          newBalance: newBalance,
          transactionId: newTransaction.id,
        });

      } catch (error) {
        console.error(`사용자 ${user.id} 포인트 충전 중 오류:`, error);
        errors.push({
          userId: user.id,
          username: user.username,
          name: user.name,
          error: "처리 중 오류 발생",
        });
      }
    }

    // 결과 반환
    const successCount = results.length;
    const totalCount = userIds.length;

    if (successCount === 0) {
      return NextResponse.json({
        success: false,
        message: "모든 사용자의 포인트 충전에 실패했습니다.",
        results: [],
        errors: errors,
      }, { status: 500 });
    }

    if (errors.length > 0) {
      return NextResponse.json({
        success: true,
        message: `${totalCount}명 중 ${successCount}명의 사용자에게 포인트 충전이 완료되었습니다. (${errors.length}명 실패)`,
        results: results,
        errors: errors,
        totalCharged: successCount * amount,
      });
    }

    return NextResponse.json({
      success: true,
      message: `${totalCount}명의 사용자에게 각각 ${amount.toLocaleString()}포인트가 충전되었습니다.`,
      results: results,
      errors: [],
      totalCharged: totalCount * amount,
    });

  } catch (error) {
    console.error("일괄 포인트 충전 오류:", error);
    return NextResponse.json(
      { error: "일괄 포인트 충전에 실패했습니다." },
      { status: 500 }
    );
  }
}