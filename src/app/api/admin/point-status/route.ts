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

// 사용자 상태 결정 함수
function getUserDisplayStatus(user: any): string {
  // is_active가 false면 정지
  if (user.is_active === false) {
    return "정지";
  }
  
  // approval_status 기반 판단
  if (user.approval_status) {
    switch (user.approval_status.toLowerCase()) {
      case "approved":
        return "정상";
      case "pending": 
        return "대기";
      case "rejected":
        return "거부";
      case "suspended":
        return "정지";
      default:
        return "대기";
    }
  }
  
  // 기본값
  return "대기";
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

// 포인트 관련 트랜잭션 계산
async function calculateUserPoints(userId: number) {
  try {
    // 포인트 충전 트랜잭션 (metadata.isReward가 true인 것만)
    const { data: chargeTransactions, error: chargeError } = await supabase
      .from("transactions")
      .select("amount, metadata")
      .eq("user_id", userId)
      .eq("type", "charge")
      .eq("status", "completed");

    if (chargeError) {
      console.error("포인트 충전 트랜잭션 조회 오류:", chargeError);
      return { pointBalance: 0, totalPointCharged: 0, totalPointUsed: 0 };
    }

    // 포인트 트랜잭션만 필터링 (metadata.isReward가 true인 것만)
    let totalPointCharged = 0;
    if (chargeTransactions) {
      for (const transaction of chargeTransactions) {
        const metadata = transaction.metadata as TransactionMetadata;
        if (metadata && metadata.isReward === true) {
          totalPointCharged += transaction.amount;
        }
      }
    }

    // 포인트 사용 트랜잭션 (metadata.transactionType이 "point"인 것만)
    const { data: usageTransactions, error: usageError } = await supabase
      .from("transactions")
      .select("amount, metadata")
      .eq("user_id", userId)
      .eq("type", "usage")
      .eq("status", "completed");

    let totalPointUsed = 0;
    if (!usageError && usageTransactions) {
      for (const transaction of usageTransactions) {
        const metadata = transaction.metadata as TransactionMetadata;
        if (metadata && metadata.transactionType === "point") {
          totalPointUsed += transaction.amount;
        }
      }
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
      .select("created_at, metadata")
      .eq("user_id", userId)
      .eq("status", "completed")
      .order("created_at", { ascending: false });

    if (error || !lastActivity) {
      return "";
    }

    // 포인트 관련 트랜잭션 찾기
    for (const transaction of lastActivity) {
      const metadata = transaction.metadata as TransactionMetadata;
      if (metadata && (metadata.isReward === true || metadata.transactionType === "point")) {
        return transaction.created_at;
      }
    }

    return "";
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
        is_active,
        email_verified,
        role,
        created_at,
        company_info
      `)
      .eq("role", "USER");

    // 검색 조건 적용
    if (search) {
      query = query.or(`name.ilike.%${search}%,username.ilike.%${search}%`);
    }

    // 상태 필터 적용 - 복잡한 상태 로직 때문에 데이터 가져온 후 필터링

    // 전체 사용자 조회 (상태 필터링은 나중에 처리)
    const { data: allUsers, error: allUsersError } = await supabase
      .from("users")
      .select(`
        id,
        username,
        name,
        email,
        phone_number,
        approval_status,
        is_active,
        email_verified,
        role,
        created_at,
        company_info
      `)
      .eq("role", "USER");

    if (allUsersError) {
      console.error("사용자 조회 오류:", allUsersError);
      return NextResponse.json(
        { error: "사용자 정보 조회에 실패했습니다." },
        { status: 500 }
      );
    }

    // 검색 필터링
    let filteredUsers = allUsers || [];
    if (search) {
      const searchLower = search.toLowerCase();
      filteredUsers = filteredUsers.filter(user => 
        user.name?.toLowerCase().includes(searchLower) ||
        user.username?.toLowerCase().includes(searchLower)
      );
    }

    // 상태 필터링
    if (status !== "all") {
      filteredUsers = filteredUsers.filter(user => {
        const displayStatus = getUserDisplayStatus(user);
        return displayStatus === status;
      });
    }

    // 페이지네이션 적용
    const totalCount = filteredUsers.length;
    const totalPages = Math.ceil(totalCount / limit);
    const paginatedUsers = filteredUsers.slice(offset, offset + limit);

    // 각 사용자별 포인트 정보 계산
    const usersWithPoints = await Promise.all(
      paginatedUsers.map(async (user) => {
        const pointData = await calculateUserPoints(user.id);
        const lastActivity = await getLastPointActivity(user.id);
        
        // 실제 데이터베이스 필드 기반 상태 결정
        const displayStatus = getUserDisplayStatus(user);

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
        total: totalCount,
        page,
        limit,
        totalPages,
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