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

// 포인트 관련 트랜잭션 계산
async function calculateUserPoints(userId: number) {
  try {
    // 포인트 충전 트랜잭션 (리워드 트랜잭션)
    const { data: chargeTransactions, error: chargeError } = await supabase
      .from("transactions")
      .select("amount")
      .eq("user_id", userId)
      .eq("type", "charge")
      .eq("status", "completed");

    if (chargeError) {
      console.error("포인트 충전 트랜잭션 조회 오류:", chargeError);
      return { pointBalance: 0, totalPointCharged: 0, totalPointUsed: 0 };
    }

    // 리워드 트랜잭션만 필터링 (metadata에서 isReward가 true이거나 description에 리워드가 포함된 것)
    let totalPointCharged = 0;
    if (chargeTransactions) {
      for (const transaction of chargeTransactions) {
        // 모든 charge 트랜잭션을 포인트로 간주 (실제로는 metadata 확인 필요)
        totalPointCharged += transaction.amount;
      }
    }

    // 포인트 사용 트랜잭션 (향후 point_usage 타입으로 분리 예정)
    const { data: usageTransactions, error: usageError } = await supabase
      .from("transactions")
      .select("amount")
      .eq("user_id", userId)
      .eq("type", "usage")
      .eq("status", "completed");

    let totalPointUsed = 0;
    if (!usageError && usageTransactions) {
      // 현재는 일반 사용과 포인트 사용을 구분하기 어려우므로 0으로 설정
      // 추후 point_usage 타입 도입 시 수정 필요
      totalPointUsed = 0;
    }

    const pointBalance = totalPointCharged - totalPointUsed;

    return {
      pointBalance: Math.max(0, pointBalance),
      totalPointCharged,
      totalPointUsed,
    };
  } catch (error) {
    console.error("포인트 계산 오류:", error);
    return { pointBalance: 0, totalPointCharged: 0, totalPointUsed: 0 };
  }
}

// 사용자별 마지막 포인트 활동 조회
async function getLastPointActivity(userId: number): Promise<string> {
  try {
    const { data: lastActivity, error } = await supabase
      .from("transactions")
      .select("created_at")
      .eq("user_id", userId)
      .eq("type", "charge")
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error || !lastActivity) {
      return "";
    }

    return lastActivity.created_at;
  } catch (error) {
    return "";
  }
}

// 사용자 목록과 포인트 현황 조회 (GET)
export async function GET(request: NextRequest) {
  try {
    // JWT 토큰에서 사용자 정보 추출
    const userInfo = getUserInfoFromToken(request);
    if (!userInfo || userInfo.role !== "ADMIN") {
      return NextResponse.json(
        { error: "관리자 권한이 필요합니다." },
        { status: 403 }
      );
    }

    // URL 파라미터 추출
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "all";

    const offset = (page - 1) * limit;

    // 기본 쿼리 구성 - 일반회원만 조회
    let query = supabase
      .from("users")
      .select(`
        id,
        username,
        name,
        email,
        phone_number,
        approval_status,
        role,
        created_at,
        company_info
      `)
      .eq("role", "USER");

    // 검색 조건 적용
    if (search) {
      query = query.or(`name.ilike.%${search}%,username.ilike.%${search}%`);
    }

    // 상태 필터 적용
    if (status !== "all") {
      // 상태 매핑 (UI의 한국어 상태를 DB의 영어 상태로 변환)
      let dbStatus = status;
      switch (status) {
        case "정상":
          dbStatus = "approved";
          break;
        case "정지":
          dbStatus = "suspended";
          break;
        case "대기":
          dbStatus = "pending";
          break;
        case "거부":
          dbStatus = "rejected";
          break;
      }
      query = query.eq("approval_status", dbStatus);
    }

    // 총 개수 조회를 위한 쿼리 구성 - 일반회원만 조회
    let countQuery = supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("role", "USER");
    
    if (search) {
      countQuery = countQuery.or(`name.ilike.%${search}%,username.ilike.%${search}%`);
    }
    
    if (status !== "all") {
      let dbStatus = status;
      switch (status) {
        case "정상":
          dbStatus = "approved";
          break;
        case "정지":
          dbStatus = "suspended";
          break;
        case "대기":
          dbStatus = "pending";
          break;
        case "거부":
          dbStatus = "rejected";
          break;
      }
      countQuery = countQuery.eq("approval_status", dbStatus);
    }
    
    const { count: totalCount, error: countError } = await countQuery;

    if (countError) {
      console.error("사용자 수 조회 오류:", countError);
    }

    // 페이지네이션 적용하여 사용자 조회
    const { data: users, error: usersError } = await query
      .range(offset, offset + limit - 1)
      .order("created_at", { ascending: false });

    if (usersError) {
      console.error("사용자 조회 오류:", usersError);
      return NextResponse.json(
        { error: "사용자 정보 조회에 실패했습니다." },
        { status: 500 }
      );
    }

    // 각 사용자별 포인트 정보 계산
    const usersWithPoints = await Promise.all(
      (users || []).map(async (user) => {
        const pointData = await calculateUserPoints(user.id);
        const lastActivity = await getLastPointActivity(user.id);
        
        // 상태 매핑 (DB의 영어 상태를 UI의 한국어 상태로 변환)
        let displayStatus = user.approval_status;
        switch (user.approval_status) {
          case "approved":
            displayStatus = "정상";
            break;
          case "suspended":
            displayStatus = "정지";
            break;
          case "pending":
            displayStatus = "대기";
            break;
          case "rejected":
            displayStatus = "거부";
            break;
          default:
            displayStatus = "대기"; // 기본값
            break;
        }

        // 회사 정보에서 회원 타입 결정
        const userType = user.company_info && 
          (user.company_info as any)?.companyName ? "기업" : "개인";

        return {
          id: user.id.toString(),
          username: user.username || "",
          name: user.name,
          email: user.email,
          phone: user.phone_number || "",
          userType,
          company: user.company_info ? (user.company_info as any)?.companyName : undefined,
          status: displayStatus,
          role: user.role,
          joinDate: user.created_at,
          pointBalance: pointData.pointBalance,
          totalPointCharged: pointData.totalPointCharged,
          totalPointUsed: pointData.totalPointUsed,
          lastPointActivity: lastActivity,
        };
      })
    );

    return NextResponse.json({
      success: true,
      users: usersWithPoints,
      pagination: {
        total: totalCount || 0,
        page,
        limit,
        totalPages: Math.ceil((totalCount || 0) / limit),
      },
    });
  } catch (error) {
    console.error("포인트 현황 조회 오류:", error);
    return NextResponse.json(
      { error: "포인트 현황 조회에 실패했습니다." },
      { status: 500 }
    );
  }
}