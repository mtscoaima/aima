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

    // URL 쿼리 파라미터 파싱
    const { searchParams } = new URL(request.url);
    const userType = searchParams.get("userType") || "전체";
    const company = searchParams.get("company") || "전체";
    const searchType = searchParams.get("searchType") || "사용자ID";
    const searchTerm = searchParams.get("searchTerm") || "";
    const status = searchParams.get("status") || "전체";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    // 기본 쿼리 빌더
    let query = supabase
      .from("users")
      .select(
        `id, username, name, email, phone_number, company_info, created_at, updated_at, 
         last_login_at, approval_status, is_active, role`,
        { count: "exact" }
      );

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
        query = query.ilike("username", `%${searchTerm}%`);
      } else if (searchType === "사용자이름") {
        query = query.ilike("name", `%${searchTerm}%`);
      } else if (searchType === "가입일") {
        // 날짜 검색 (YYYY-MM-DD 형식)
        query = query.gte("created_at", `${searchTerm}T00:00:00`)
                     .lte("created_at", `${searchTerm}T23:59:59`);
      }
    }

    // 페이징
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    // 정렬
    query = query.order("created_at", { ascending: false });

    const { data, error: dbError, count } = await query;

    if (dbError) {
      console.error("Supabase error:", dbError);
      return NextResponse.json(
        { message: "사용자 조회 중 오류가 발생했습니다.", success: false },
        { status: 500 }
      );
    }

    // 데이터 변환
    const usersWithProcessedData = (data || []).map((user) => {
      const company_info = user.company_info as any;
      
      return {
        id: user.id,
        userId: user.username || user.id.toString(), // 실제 로그인 username 사용
        name: user.name,
        company: company_info?.companyName || "",
        userType: company_info ? "기업" : "개인",
        email: user.email,
        phone: user.phone_number,
        status: user.is_active 
          ? (user.approval_status === "APPROVED" ? "정상" : 
             user.approval_status === "REJECTED" ? "거부" : "대기")
          : "정지",
        grade: "일반", // 추후 등급 시스템 구현 시 수정
        role: user.role || "USER",
        joinDate: user.created_at?.split('T')[0] || "",
        updateDate: user.updated_at?.split('T')[0] || "",
        lastLogin: user.last_login_at ? 
          new Date(user.last_login_at).toLocaleString('ko-KR') : "-",
        approval_status: user.approval_status || "PENDING",
      };
    });

    // 통계 계산
    const { data: statsData } = await supabase
      .from("users")
      .select("approval_status, is_active, company_info, role", { count: "exact" });

    const stats = {
      total: count || 0,
      individual: statsData?.filter(u => !u.company_info).length || 0,
      business: statsData?.filter(u => u.company_info).length || 0,
      active: statsData?.filter(u => u.is_active && u.approval_status === "APPROVED").length || 0,
      suspended: statsData?.filter(u => !u.is_active).length || 0,
      pending: statsData?.filter(u => u.approval_status === "PENDING").length || 0,
      rejected: statsData?.filter(u => u.approval_status === "REJECTED").length || 0,
    };

    const totalPages = Math.ceil((count || 0) / limit);

    return NextResponse.json({
      users: usersWithProcessedData,
      stats,
      pagination: {
        total: count || 0,
        page,
        limit,
        totalPages,
      },
      success: true,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { message: "서버 오류가 발생했습니다.", success: false },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // 관리자 권한 확인
    const {
      isValid,
      error: authError,
      userId: adminId,
    } = await verifyAdminToken(request);
    if (!isValid) {
      return NextResponse.json(
        { message: authError || "관리자 권한이 필요합니다.", success: false },
        { status: 403 }
      );
    }

    const requestData = await request.json();
    const { userId, ...updateData } = requestData;

    if (!userId) {
      return NextResponse.json(
        { message: "사용자 ID가 필요합니다.", success: false },
        { status: 400 }
      );
    }

    // 현재 사용자 정보 조회
    const { data: currentUser, error: currentUserError } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (currentUserError || !currentUser) {
      console.error("Current user query error:", currentUserError);
      return NextResponse.json(
        { message: "사용자 정보 조회 중 오류가 발생했습니다.", success: false },
        { status: 500 }
      );
    }

    // 업데이트할 데이터 준비
    const updateFields: any = {
      updated_at: new Date().toISOString(),
    };

    // 기본 정보 업데이트
    if (updateData.username) updateFields.username = updateData.username;
    if (updateData.name) updateFields.name = updateData.name;
    if (updateData.email) updateFields.email = updateData.email;
    if (updateData.phone) updateFields.phone_number = updateData.phone;
    if (updateData.role && ['USER', 'SALESPERSON', 'ADMIN'].includes(updateData.role)) {
      updateFields.role = updateData.role;
    }
    if (updateData.status !== undefined) {
      // 상태 변환
      if (updateData.status === "정상") {
        updateFields.is_active = true;
        updateFields.approval_status = "APPROVED";
      } else if (updateData.status === "정지") {
        updateFields.is_active = false;
      } else if (updateData.status === "대기") {
        updateFields.approval_status = "PENDING";
      } else if (updateData.status === "거부") {
        updateFields.approval_status = "REJECTED";
      }
    }

    // 기업 정보 업데이트
    if (updateData.company !== undefined || updateData.userType !== undefined) {
      if (updateData.userType === "개인") {
        updateFields.company_info = null;
      } else if (updateData.userType === "기업" && updateData.company) {
        const existingCompanyInfo = currentUser.company_info || {};
        updateFields.company_info = {
          ...existingCompanyInfo,
          companyName: updateData.company,
        };
      }
    }

    // 승인 상태 변경 시 로그 기록
    if (updateFields.approval_status && currentUser.approval_status !== updateFields.approval_status) {
      const { data: adminUser } = await supabase
        .from("users")
        .select("name, email")
        .eq("id", adminId)
        .single();

      updateFields.approval_log = {
        changed_by: adminUser?.name || adminUser?.email,
        changed_by_email: adminUser?.email,
        changed_at: new Date().toISOString(),
        previous_status: currentUser.approval_status || "PENDING",
        new_status: updateFields.approval_status,
        admin_id: adminId,
      };
    }

    // 데이터베이스 업데이트
    const { error: updateError } = await supabase
      .from("users")
      .update(updateFields)
      .eq("id", userId);

    if (updateError) {
      console.error("Supabase update error:", updateError);
      return NextResponse.json(
        { message: "회원 정보 업데이트 중 오류가 발생했습니다.", success: false },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "회원 정보가 성공적으로 업데이트되었습니다.",
      success: true,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { message: "서버 오류가 발생했습니다.", success: false },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // 관리자 권한 확인
    const { isValid, error: authError } = await verifyAdminToken(request);
    if (!isValid) {
      return NextResponse.json(
        { message: authError || "관리자 권한이 필요합니다.", success: false },
        { status: 403 }
      );
    }

    const {
      username,
      name,
      email,
      phone,
      userType,
      company,
      password = "temp123!", // 임시 비밀번호
      role = "USER"
    } = await request.json();

    // role 유효성 검사
    if (!['USER', 'SALESPERSON', 'ADMIN'].includes(role)) {
      return NextResponse.json(
        { message: "유효하지 않은 권한입니다.", success: false },
        { status: 400 }
      );
    }

    // 필수 필드 검증
    if (!username || !name || !email || !phone) {
      return NextResponse.json(
        { message: "사용자ID, 이름, 이메일, 연락처는 필수 입력 사항입니다.", success: false },
        { status: 400 }
      );
    }

    // 사용자ID 중복 확인
    const { data: existingUsername } = await supabase
      .from("users")
      .select("id")
      .eq("username", username)
      .single();

    if (existingUsername) {
      return NextResponse.json(
        { message: "이미 존재하는 사용자ID입니다.", success: false },
        { status: 400 }
      );
    }

    // 이메일 중복 확인
    const { data: existingEmail } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (existingEmail) {
      return NextResponse.json(
        { message: "이미 존재하는 이메일입니다.", success: false },
        { status: 400 }
      );
    }

    // 비밀번호 해시
    const bcrypt = require("bcryptjs");
    const hashedPassword = await bcrypt.hash(password, 10);

    // 회사 정보 생성
    const companyInfo = userType === "기업" && company ? {
      companyName: company,
    } : null;

    // 새 사용자 생성
    const now = new Date().toISOString();
    const { data: newUser, error: insertError } = await supabase
      .from("users")
      .insert({
        username,
        name,
        email,
        password: hashedPassword,
        phone_number: phone,
        role,
        approval_status: "APPROVED", // 관리자가 생성하는 경우 즉시 승인
        is_active: true,
        email_verified: true,
        company_info: companyInfo,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Database insert error:", insertError);
      return NextResponse.json(
        { message: "회원 등록 중 오류가 발생했습니다.", success: false },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "회원이 성공적으로 등록되었습니다.",
      user: newUser,
      success: true,
    });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { message: "서버 오류가 발생했습니다.", success: false },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // 관리자 권한 확인
    const { isValid, error: authError } = await verifyAdminToken(request);
    if (!isValid) {
      return NextResponse.json(
        { message: authError || "관리자 권한이 필요합니다.", success: false },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { message: "사용자 ID가 필요합니다.", success: false },
        { status: 400 }
      );
    }

    // 사용자 존재 확인
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, role")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { message: "사용자를 찾을 수 없습니다.", success: false },
        { status: 404 }
      );
    }

    // ADMIN 역할은 삭제 불가
    if (user.role === "ADMIN") {
      return NextResponse.json(
        { message: "관리자 계정은 삭제할 수 없습니다.", success: false },
        { status: 400 }
      );
    }

    // 사용자 삭제
    const { error: deleteError } = await supabase
      .from("users")
      .delete()
      .eq("id", userId);

    if (deleteError) {
      console.error("Delete error:", deleteError);
      return NextResponse.json(
        { message: "회원 삭제 중 오류가 발생했습니다.", success: false },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "회원이 성공적으로 삭제되었습니다.",
      success: true,
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { message: "서버 오류가 발생했습니다.", success: false },
      { status: 500 }
    );
  }
}
