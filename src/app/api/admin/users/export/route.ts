import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  db: {
    schema: "public",
  },
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// 관리자 권한 확인
async function verifyAdminToken(request: NextRequest): Promise<{
  isValid: boolean;
  userId?: string;
  error?: string;
}> {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return { isValid: false, error: "Authorization 헤더가 없습니다." };
    }

    const token = authHeader.substring(7);
    if (!token) {
      return { isValid: false, error: "토큰이 없습니다." };
    }

    let decoded: { userId: string };
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    } catch (jwtError) {
      console.error("JWT verification failed:", jwtError);
      return { isValid: false, error: "유효하지 않은 토큰입니다." };
    }

    if (!decoded.userId) {
      return { isValid: false, error: "토큰에 사용자 ID가 없습니다." };
    }

    // Supabase에서 사용자 정보 조회하여 role 및 활성 상태 확인
    const { data: user, error } = await supabase
      .from("users")
      .select("id, role, is_active")
      .eq("id", decoded.userId)
      .single();

    if (error) {
      console.error("Database query error:", error);
      return { isValid: false, error: "사용자 조회 중 오류가 발생했습니다." };
    }

    if (!user) {
      return { isValid: false, error: "사용자를 찾을 수 없습니다." };
    }

    if (!user.is_active) {
      return { isValid: false, error: "비활성화된 계정입니다." };
    }

    if (user.role !== "ADMIN") {
      return { isValid: false, error: "관리자 권한이 필요합니다." };
    }

    return { isValid: true, userId: decoded.userId };
  } catch (error) {
    console.error("Token verification error:", error);
    return { isValid: false, error: "권한 확인 중 오류가 발생했습니다." };
  }
}

// CSV escape 함수
function escapeCSV(value: string): string {
  if (!value) return "";
  // 쉼표, 따옴표, 줄바꿈이 포함된 경우 따옴표로 감싸고 내부 따옴표는 두 번 표시
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET(request: NextRequest) {
  try {
    // 관리자 권한 확인
    const { isValid, error: authError } = await verifyAdminToken(request);
    if (!isValid) {
      return NextResponse.json(
        { message: authError || "관리자 권한이 필요합니다.", success: false },
        { status: 403 }
      );
    }

    // URL 쿼리 파라미터 파싱 (필터링용)
    const { searchParams } = new URL(request.url);
    const userType = searchParams.get("userType") || "전체";
    const company = searchParams.get("company") || "전체";
    const searchType = searchParams.get("searchType") || "사용자ID";
    const searchTerm = searchParams.get("searchTerm") || "";
    const status = searchParams.get("status") || "전체";

    // 기본 쿼리 빌더
    let query = supabase
      .from("users")
      .select(`
        id, name, email, phone_number, company_info, created_at, updated_at, 
        last_login_at, approval_status, is_active, role
      `)
      .eq("role", "USER");

    // 상태 필터링
    if (status !== "전체") {
      if (status === "정상") {
        query = query.eq("is_active", true).eq("approval_status", "APPROVED");
      } else if (status === "정지") {
        query = query.eq("is_active", false);
      } else if (status === "대기") {
        query = query.eq("approval_status", "PENDING");
      } else if (status === "거부") {
        query = query.eq("approval_status", "REJECTED");
      }
    }

    // 회원유형 필터링
    if (userType !== "전체") {
      if (userType === "개인") {
        query = query.is("company_info", null);
      } else if (userType === "기업") {
        query = query.not("company_info", "is", null);
      }
    }

    // 기업명 필터링
    if (company !== "전체") {
      query = query.contains("company_info", { companyName: company });
    }

    // 검색어 필터링
    if (searchTerm) {
      if (searchType === "사용자ID") {
        query = query.ilike("email", `%${searchTerm}%`);
      } else if (searchType === "사용자이름") {
        query = query.ilike("name", `%${searchTerm}%`);
      } else if (searchType === "등록일") {
        query = query.gte("created_at", `${searchTerm}T00:00:00`)
                     .lte("created_at", `${searchTerm}T23:59:59`);
      }
    }

    // 정렬
    query = query.order("created_at", { ascending: false });

    const { data, error: dbError } = await query;

    if (dbError) {
      console.error("Supabase error:", dbError);
      return NextResponse.json(
        { message: "데이터 조회 중 오류가 발생했습니다.", success: false },
        { status: 500 }
      );
    }

    // CSV 헤더
    const headers = [
      "사용자ID",
      "사용자명",
      "기업명",
      "회원유형",
      "이메일",
      "연락처",
      "상태",
      "등급",
      "가입일",
      "수정일",
      "최종로그인",
      "승인상태"
    ];

    // CSV 데이터 생성
    const csvRows = [headers.join(",")];

    (data || []).forEach((user) => {
      const company_info = user.company_info as any;
      
      const row = [
        escapeCSV(user.email), // 사용자ID
        escapeCSV(user.name), // 사용자명
        escapeCSV(company_info?.companyName || ""), // 기업명
        escapeCSV(company_info ? "기업" : "개인"), // 회원유형
        escapeCSV(user.email), // 이메일
        escapeCSV(user.phone_number || ""), // 연락처
        escapeCSV(
          user.is_active 
            ? (user.approval_status === "APPROVED" ? "정상" : 
               user.approval_status === "REJECTED" ? "거부" : "대기")
            : "정지"
        ), // 상태
        escapeCSV("일반"), // 등급 (추후 구현)
        escapeCSV(user.created_at?.split('T')[0] || ""), // 가입일
        escapeCSV(user.updated_at?.split('T')[0] || ""), // 수정일
        escapeCSV(
          user.last_login_at ? 
            new Date(user.last_login_at).toLocaleString('ko-KR') : "-"
        ), // 최종로그인
        escapeCSV(user.approval_status || "PENDING"), // 승인상태
      ];
      
      csvRows.push(row.join(","));
    });

    const csvContent = csvRows.join("\n");
    
    // BOM 추가 (한글 인코딩을 위해)
    const BOM = "\uFEFF";
    const csvWithBOM = BOM + csvContent;

    // 파일명 생성 (현재 날짜 포함)
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const filename = `회원목록_${dateStr}.csv`;

    // Response 헤더 설정
    const response = new NextResponse(csvWithBOM, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
        "Cache-Control": "no-cache",
      },
    });

    return response;
  } catch (error) {
    console.error("Error exporting users:", error);
    return NextResponse.json(
      { message: "서버 오류가 발생했습니다.", success: false },
      { status: 500 }
    );
  }
}
