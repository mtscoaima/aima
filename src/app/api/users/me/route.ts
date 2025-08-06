import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";
import { getKSTISOString } from "@/lib/utils";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// 서버 사이드에서는 서비스 역할 키 사용
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// 서비스 키 사용
const supabaseKey = supabaseServiceKey;

const supabase = createClient(supabaseUrl, supabaseKey, {
  db: {
    schema: "public",
  },
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

interface UpdateUserRequest {
  username?: string;
  name?: string;
  email?: string;
  phoneNumber?: string; // 휴대폰 번호 필드 추가
  // 기업정보 필드들
  companyName?: string;
  representativeName?: string;
  businessNumber?: string;
  address?: string;
  phoneNumberCompany?: string;
  customerServiceNumber?: string;
  businessType?: string;
  faxNumber?: string;
  homepage?: string;
  approval_status?: string;
  // 약관 및 마케팅 동의 필드들
  agreeTerms?: boolean;
  agreePrivacy?: boolean;
  smsMarketingConsent?: boolean;
  emailMarketingConsent?: boolean;
}

export async function GET(request: NextRequest) {
  try {
    // Authorization 헤더에서 토큰 추출
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          message: "인증되지 않은 사용자",
          error: "Unauthorized",
          status: 401,
          timestamp: getKSTISOString(),
          path: "/api/users/me",
        },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7); // "Bearer " 제거

    // JWT 토큰 검증
    let decoded: {
      userId: string;
      email: string;
      name: string;
      phoneNumber: string;
      role: string;
    };
    try {
      decoded = jwt.verify(token, JWT_SECRET) as {
        userId: string;
        email: string;
        name: string;
        phoneNumber: string;
        role: string;
      };
    } catch {
      return NextResponse.json(
        {
          message: "유효하지 않은 토큰",
          error: "Invalid token",
          status: 401,
          timestamp: getKSTISOString(),
          path: "/api/users/me",
        },
        { status: 401 }
      );
    }

    // 토큰에서 사용자 ID 추출
    const userId = decoded.userId;
    if (!userId) {
      return NextResponse.json(
        {
          message: "토큰에 사용자 정보가 없습니다",
          error: "Invalid token payload",
          status: 401,
          timestamp: getKSTISOString(),
          path: "/api/users/me",
        },
        { status: 401 }
      );
    }

    // Supabase에서 사용자 정보 조회
    const { data: user, error: userError } = await supabase
      .from("users")
      .select(
        "id, email, username, name, phone_number, role, created_at, updated_at, last_login_at, is_active, company_info, tax_invoice_info, documents, approval_status, agree_terms, agree_privacy, agree_sms_marketing, agree_email_marketing, agreed_at, kakao_user_id, naver_user_id, google_user_id, payment_mode"
      )
      .eq("id", userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        {
          message: "사용자를 찾을 수 없습니다",
          error: "User not found",
          status: 404,
          timestamp: getKSTISOString(),
          path: "/api/users/me",
        },
        { status: 404 }
      );
    }

    // 계정 활성화 상태 확인
    if (!user.is_active) {
      return NextResponse.json(
        {
          message: "비활성화된 계정입니다",
          error: "Account deactivated",
          status: 401,
          timestamp: getKSTISOString(),
          path: "/api/users/me",
        },
        { status: 401 }
      );
    }

    // documents가 있는 경우 signed URL로 변환
    let processedDocuments = user.documents;
    if (user.documents) {
      try {
        processedDocuments = { ...user.documents };

        // 사업자등록증 URL 처리
        if (processedDocuments.businessRegistration?.fileUrl) {
          const url = processedDocuments.businessRegistration.fileUrl;
          let filePath = null;

          // 다양한 Supabase Storage URL 형식 처리
          if (url.includes("/storage/v1/object/public/user-documents/")) {
            filePath = url.split(
              "/storage/v1/object/public/user-documents/"
            )[1];
          } else if (url.includes("/storage/v1/object/sign/user-documents/")) {
            filePath = url
              .split("/storage/v1/object/sign/user-documents/")[1]
              .split("?")[0];
          } else if (url.startsWith("documents/")) {
            filePath = url;
          } else if (url.includes("user-documents/")) {
            // URL에서 user-documents/ 이후 부분 추출
            const parts = url.split("user-documents/");
            if (parts.length > 1) {
              filePath = parts[1].split("?")[0]; // 쿼리 파라미터 제거
            }
          }

          if (filePath) {
            // Public URL 생성 시도
            const { data: publicData } = supabase.storage
              .from("user-documents")
              .getPublicUrl(filePath);

            if (publicData?.publicUrl) {
              processedDocuments.businessRegistration.fileUrl =
                publicData.publicUrl;
            }
          }
        }

        // 재직증명서 URL 처리
        if (processedDocuments.employmentCertificate?.fileUrl) {
          const url = processedDocuments.employmentCertificate.fileUrl;
          let filePath = null;

          if (url.includes("/storage/v1/object/public/user-documents/")) {
            filePath = url.split(
              "/storage/v1/object/public/user-documents/"
            )[1];
          } else if (url.includes("/storage/v1/object/sign/user-documents/")) {
            filePath = url
              .split("/storage/v1/object/sign/user-documents/")[1]
              .split("?")[0];
          } else if (url.startsWith("documents/")) {
            filePath = url;
          } else if (url.includes("user-documents/")) {
            const parts = url.split("user-documents/");
            if (parts.length > 1) {
              filePath = parts[1].split("?")[0];
            }
          }

          if (filePath) {
            const { data: publicData } = supabase.storage
              .from("user-documents")
              .getPublicUrl(filePath);

            if (publicData?.publicUrl) {
              processedDocuments.employmentCertificate.fileUrl =
                publicData.publicUrl;
            }
          }
        }
      } catch (urlError) {
        console.error("URL 처리 중 오류:", urlError);
        // URL 처리 실패해도 원본 documents 반환
      }
    }

    // 사용자 정보 반환
    return NextResponse.json({
      id: user.id,
      email: user.email,
      username: user.username || user.email, // username이 없으면 email 사용
      name: user.name,
      phoneNumber: user.phone_number,
      role: user.role,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      lastLoginAt: user.last_login_at,
      approval_status: user.approval_status,
      agreeTerms: user.agree_terms || false,
      agreePrivacy: user.agree_privacy || false,
      smsMarketingConsent: user.agree_sms_marketing || false,
      emailMarketingConsent: user.agree_email_marketing || false,
      agreedAt: user.agreed_at,
      payment_mode: user.payment_mode,
      // SNS 연동 정보 추가
      kakao_user_id: user.kakao_user_id,
      naver_user_id: user.naver_user_id,
      google_user_id: user.google_user_id,
      companyInfo: user.company_info,
      taxInvoiceInfo: user.tax_invoice_info,
      documents:
        processedDocuments ||
        (user.documents
          ? null
          : {
              // 테스트용 이미지 (실제 documents가 없는 경우에만)
              businessRegistration: {
                fileName: "사업자등록증_테스트.jpg",
                fileUrl: "https://picsum.photos/800/600?random=1",
                uploadedAt: "2024-01-15",
              },
              employmentCertificate: {
                fileName: "재직증명서_테스트.jpg",
                fileUrl: "https://picsum.photos/800/600?random=2",
                uploadedAt: "2024-01-15",
              },
            }),
    });
  } catch (error) {
    console.error("User info API Error:", error);
    return NextResponse.json(
      {
        message: "서버 오류가 발생했습니다.",
        error: "Internal Server Error",
        status: 500,
        timestamp: getKSTISOString(),
        path: "/api/users/me",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Authorization 헤더에서 토큰 추출
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          message: "인증되지 않은 사용자",
          error: "Unauthorized",
          status: 401,
          timestamp: getKSTISOString(),
          path: "/api/users/me",
        },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7); // "Bearer " 제거

    // JWT 토큰 검증
    let decoded: {
      userId: string;
      email: string;
      name: string;
      phoneNumber: string;
      role: string;
    };
    try {
      decoded = jwt.verify(token, JWT_SECRET) as {
        userId: string;
        email: string;
        name: string;
        phoneNumber: string;
        role: string;
      };
    } catch {
      return NextResponse.json(
        {
          message: "유효하지 않은 토큰",
          error: "Invalid token",
          status: 401,
          timestamp: getKSTISOString(),
          path: "/api/users/me",
        },
        { status: 401 }
      );
    }

    // 토큰에서 사용자 ID 추출
    const userId = decoded.userId;
    if (!userId) {
      return NextResponse.json(
        {
          message: "토큰에 사용자 정보가 없습니다",
          error: "Invalid token payload",
          status: 401,
          timestamp: getKSTISOString(),
          path: "/api/users/me",
        },
        { status: 401 }
      );
    }

    // 요청 본문 파싱
    const updateData: UpdateUserRequest = await request.json();

    // 업데이트할 데이터 준비
    const updateFields: Record<string, unknown> = {
      updated_at: getKSTISOString(),
    };

    // 기본 정보 업데이트
    if (updateData.username) updateFields.username = updateData.username;
    if (updateData.name) updateFields.name = updateData.name;
    if (updateData.email) updateFields.email = updateData.email;
    if (updateData.phoneNumber)
      updateFields.phone_number = updateData.phoneNumber;
    // 약관 동의 업데이트
    if (updateData.agreeTerms !== undefined) {
      updateFields.agree_terms = updateData.agreeTerms;
    }

    if (updateData.agreePrivacy !== undefined) {
      updateFields.agree_privacy = updateData.agreePrivacy;
    }

    // 새로운 분리된 마케팅 동의 필드들 처리
    if (updateData.smsMarketingConsent !== undefined) {
      updateFields.agree_sms_marketing = updateData.smsMarketingConsent;
    }

    if (updateData.emailMarketingConsent !== undefined) {
      updateFields.agree_email_marketing = updateData.emailMarketingConsent;
    }

    // 기업 정보 중 하나라도 있으면 company_info 업데이트
    const hasCompanyData = [
      updateData.companyName,
      updateData.representativeName,
      updateData.businessNumber,
      updateData.address,
      updateData.phoneNumberCompany,
      updateData.customerServiceNumber,
      updateData.businessType,
      updateData.faxNumber,
      updateData.homepage,
    ].some((value) => value !== undefined);

    if (hasCompanyData) {
      // 기존 company_info 가져오기
      const { data: currentUser } = await supabase
        .from("users")
        .select("company_info")
        .eq("id", userId)
        .single();

      const currentCompanyInfo = currentUser?.company_info || {};

      // 새로운 정보로 업데이트
      const updatedCompanyInfo = {
        ...currentCompanyInfo,
        // 필드명 매핑 수정
        companyName: updateData.companyName || currentCompanyInfo.companyName,
        ceoName: updateData.representativeName || currentCompanyInfo.ceoName,
        businessNumber:
          updateData.businessNumber || currentCompanyInfo.businessNumber,
        companyAddress: updateData.address || currentCompanyInfo.companyAddress,
        companyPhone:
          updateData.phoneNumberCompany || currentCompanyInfo.companyPhone,
        customerServiceNumber:
          updateData.customerServiceNumber ||
          currentCompanyInfo.customerServiceNumber,
        businessType:
          updateData.businessType || currentCompanyInfo.businessType,
        faxNumber: updateData.faxNumber || currentCompanyInfo.faxNumber,
        homepage: updateData.homepage || currentCompanyInfo.homepage,
      };

      updateFields.company_info = updatedCompanyInfo;

      // 기업정보 수정 시 승인 상태를 PENDING으로 변경
      updateFields.approval_status = "PENDING";
    }

    // 명시적으로 approval_status가 전달된 경우에만 업데이트
    if (updateData.approval_status !== undefined) {
      updateFields.approval_status = updateData.approval_status;
    }

    // 사용자 정보 업데이트
    const { data: updatedUser, error: updateError } = await supabase
      .from("users")
      .update(updateFields)
      .eq("id", userId)
      .select("id, email, name, phone_number, role, created_at, updated_at")
      .single();

    if (updateError) {
      console.error("User update error:", updateError);
      return NextResponse.json(
        {
          message: "사용자 정보 업데이트 중 오류가 발생했습니다",
          error: `Database Error: ${updateError.message}`,
          status: 500,
          timestamp: getKSTISOString(),
          path: "/api/users/me",
        },
        { status: 500 }
      );
    }

    // 성공 응답
    return NextResponse.json(
      {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        phoneNumber: updatedUser.phone_number,
        role: updatedUser.role,
        createdAt: updatedUser.created_at,
        updatedAt: updatedUser.updated_at,
        message: "사용자 정보가 성공적으로 업데이트되었습니다",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update user info error:", error);
    return NextResponse.json(
      {
        message: "서버 내부 오류",
        error: error instanceof Error ? error.message : "Unknown error",
        status: 500,
        timestamp: getKSTISOString(),
        path: "/api/users/me",
      },
      { status: 500 }
    );
  }
}
