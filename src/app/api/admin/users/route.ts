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

// Validation helpers
function isValidEmail(email: unknown): boolean {
  if (typeof email !== 'string') return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function isValidBizNumber(biz: unknown): boolean {
  if (typeof biz !== 'string') return false;
  const s = biz.replace(/[^0-9]/g, '');
  if (s.length !== 10) return false;
  const multipliers = [1,3,7,1,3,7,1,3,5];
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += Number(s[i]) * multipliers[i];
  }
  sum += Math.floor((Number(s[8]) * 5) / 10);
  const check = (10 - (sum % 10)) % 10;
  return check === Number(s[9]);
}

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
        `id, username, name, email, phone_number, company_info, tax_invoice_info, 
         documents, approval_log, created_at, updated_at, last_login_at, 
         approval_status, is_active, role, grade`,
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
      const company_info = user.company_info as Record<string, unknown> | null;
      const tax_invoice_info = user.tax_invoice_info as Record<string, unknown> | null;
      const approval_log = user.approval_log as Record<string, unknown> | null;
      
      return {
        id: user.id,
        userId: user.username || user.id.toString(), // 실제 로그인 username 사용
        name: user.name,
        company: company_info?.companyName || "",
        userType: company_info ? "기업" : "개인",
        email: user.email,
        phone_number: user.phone_number,
        status: user.is_active 
          ? (user.approval_status === "APPROVED" ? "정상" : 
             user.approval_status === "REJECTED" ? "거부" : "대기")
          : "정지",
        grade: user.grade || "일반",
        role: user.role || "USER",
        joinDate: user.created_at?.split('T')[0] || "",
        updateDate: user.updated_at?.split('T')[0] || "",
        lastLogin: user.last_login_at ? 
          new Date(user.last_login_at).toLocaleString('ko-KR') : "-",
        approval_status: user.approval_status || "PENDING",
        // 추가된 필드들
        company_info: company_info,
        tax_invoice_info: tax_invoice_info,
        documents: user.documents,
        approval_log: approval_log,
        // 상세 정보를 위한 추가 필드들
        representativeName: company_info?.ceoName || "",
        companyAddress: company_info?.companyAddress || "",
        approvalDate: approval_log?.changed_at ? new Date(approval_log.changed_at as string).toLocaleString('ko-KR') : "",
        approver: approval_log?.changed_by || "",
        rejectionReason: approval_log?.rejection_reason || "",
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
    const updateFields: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };


    // 기본 정보 업데이트
    if (updateData.username && updateData.username !== currentUser.username) {
      updateFields.username = updateData.username;
    }
    if (updateData.name && updateData.name !== currentUser.name) {
      updateFields.name = updateData.name;
    }
    if (updateData.email && updateData.email !== currentUser.email) {
      updateFields.email = updateData.email;
    }
    if (updateData.phone && updateData.phone !== currentUser.phone_number) {
      updateFields.phone_number = updateData.phone;
    }
    if (updateData.role && ['USER', 'SALESPERSON', 'ADMIN'].includes(updateData.role) && updateData.role !== currentUser.role) {
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

    // 기업 정보 업데이트 (간단 변경: 회사명만)
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

    // 사전 유효성 검사 (기업 상세/세금계산서)
    if (updateData.companyInfo && typeof updateData.companyInfo === 'object') {
      const ci = updateData.companyInfo as Record<string, unknown>;
      if (ci.businessNumber !== undefined && ci.businessNumber !== null) {
        if (!isValidBizNumber(String(ci.businessNumber))) {
          return NextResponse.json(
            { message: "유효하지 않은 사업자등록번호입니다.", success: false },
            { status: 400 }
          );
        }
      }
    }

    if (updateData.taxInvoiceInfo && typeof updateData.taxInvoiceInfo === 'object') {
      const ti = updateData.taxInvoiceInfo as Record<string, unknown>;
      if (ti.email !== undefined && ti.email !== null) {
        const email = String(ti.email).trim();
        if (email && !isValidEmail(email)) {
          return NextResponse.json(
            { message: "유효하지 않은 이메일 형식입니다.", success: false },
            { status: 400 }
          );
        }
      }
    }

    // 기업 상세 정보 업데이트 (객체 병합)
    if (updateData.companyInfo && typeof updateData.companyInfo === 'object') {
      const existingCompanyInfo = (currentUser.company_info as Record<string, unknown>) || {};
      updateFields.company_info = {
        ...existingCompanyInfo,
        ...(updateData.companyInfo as Record<string, unknown>),
      };
    }

    // 세금계산서 담당자 정보 업데이트 (객체 병합)
    if (updateData.taxInvoiceInfo && typeof updateData.taxInvoiceInfo === 'object') {
      const existingTaxInfo = (currentUser.tax_invoice_info as Record<string, unknown>) || {};
      updateFields.tax_invoice_info = {
        ...existingTaxInfo,
        ...(updateData.taxInvoiceInfo as Record<string, unknown>),
      };
    }

    // 승인 상태 직접 변경 허용 (APPROVED/PENDING/REJECTED)
    if (
      typeof updateData.approval_status === 'string' &&
      ["APPROVED", "PENDING", "REJECTED"].includes(updateData.approval_status)
    ) {
      updateFields.approval_status = updateData.approval_status;
      // 승인 시 계정 활성화 동기화
      if (updateData.approval_status === "APPROVED") {
        updateFields.is_active = true;
      }
    }

    // 승인 상태 변경 시 로그 기록
    if (updateFields.approval_status && currentUser.approval_status !== updateFields.approval_status) {
      const { data: adminUser } = await supabase
        .from("users")
        .select("name, email")
        .eq("id", adminId)
        .single();

      const approvalLogData: Record<string, unknown> = {
        changed_by: adminUser?.name || adminUser?.email,
        changed_by_email: adminUser?.email,
        changed_at: new Date().toISOString(),
        previous_status: currentUser.approval_status || "PENDING",
        new_status: updateFields.approval_status,
        admin_id: adminId,
      };

      // 반려사유가 있는 경우 추가
      if (updateData.rejection_reason && updateFields.approval_status === "REJECTED") {
        approvalLogData.rejection_reason = updateData.rejection_reason;
      }

      updateFields.approval_log = approvalLogData;
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
    const bcrypt = await import("bcryptjs");
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

    // 관련된 데이터 먼저 삭제 또는 처리
    try {
      // 1. referrals 테이블에서 해당 사용자와 관련된 레코드 확인 및 삭제
      const { error: referralsCheckError } = await supabase
        .from("referrals")
        .select("id, referrer_id, referred_user_id")
        .or(`referrer_id.eq.${userId},referred_user_id.eq.${userId}`);

      if (referralsCheckError) {
        console.error("Error checking referrals:", referralsCheckError);
      } 

      // referrer_id로 참조하는 레코드 삭제
      const { error: deleteReferrerError } = await supabase
        .from("referrals")
        .delete()
        .eq("referrer_id", userId);

      if (deleteReferrerError) {
        console.error("Error deleting referrer records:", deleteReferrerError);
      }

      // referred_user_id로 참조하는 레코드 삭제
      const { error: deleteReferredError } = await supabase
        .from("referrals")
        .delete()
        .eq("referred_user_id", userId);

      if (deleteReferredError) {
        console.error("Error deleting referred records:", deleteReferredError);
      }

      // 2. rewards 테이블에서 해당 사용자와 관련된 레코드 삭제 (있는 경우)
      await supabase
        .from("rewards")
        .delete()
        .eq("user_id", userId);

      // 3. 기타 관련 테이블들 처리 (필요한 경우)
      // transactions, notifications 등은 CASCADE DELETE가 설정되어 있거나
      // 사용자 삭제 시 유지해야 할 수도 있으므로 확인 필요

    } catch (relationError) {
      console.error("Error deleting related records:", relationError);
      // 관련 레코드 삭제 실패는 경고만 하고 계속 진행
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
