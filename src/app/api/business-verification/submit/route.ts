import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";

// 서버 사이드에서는 서비스 역할 키 사용
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

interface BusinessVerificationData {
  businessType: string;
  businessName: string;
  representativeName: string;
  businessNumber: string;
  roadAddress: string;
  detailAddress: string;
  businessCategory: string;
  businessType2: string;
  managerName: string;
  managerPhone: string;
  managerEmail: string;
  businessDocumentFile?: {
    name: string;
    size: number;
    type: string;
    data: string; // base64 encoded
  };
  employmentDocumentFile?: {
    name: string;
    size: number;
    type: string;
    data: string; // base64 encoded
  };
  hasExistingBusinessDocument?: boolean;
  hasExistingEmploymentDocument?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    // JWT 토큰에서 사용자 ID 추출
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "인증 토큰이 필요합니다." },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    let userId: string;

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
        userId: string;
        email: string;
        name: string;
        phoneNumber: string;
        role: string;
      };
      userId = decoded.userId;
    } catch (error) {
      console.error("JWT 검증 실패:", error);
      return NextResponse.json(
        { error: "유효하지 않은 토큰입니다." },
        { status: 401 }
      );
    }

    const data: BusinessVerificationData = await request.json();

    // 기존 사용자 데이터 조회 (기존 문서 정보 확인용)
    const { data: existingUser, error: fetchError } = await supabase
      .from("users")
      .select("documents")
      .eq("id", userId)
      .single();

    if (fetchError) {
      console.error("기존 사용자 데이터 조회 실패:", fetchError);
      return NextResponse.json(
        { error: "사용자 정보 조회에 실패했습니다." },
        { status: 500 }
      );
    }

    const existingDocuments = existingUser?.documents || {};

    // 1. 기업 정보 구성 (기존 시스템과 호환되는 필드명 사용)
    const companyInfo = {
      businessType: data.businessType,
      companyName: data.businessName, // businessName → companyName
      ceoName: data.representativeName, // representativeName → ceoName
      businessNumber: data.businessNumber,
      companyAddress: `${data.roadAddress} ${data.detailAddress}`.trim(), // address → companyAddress
      roadAddress: data.roadAddress,
      detailAddress: data.detailAddress,
      businessCategory: data.businessCategory,
      businessType2: data.businessType2,
      submittedAt: new Date().toISOString(),
    };

    // 2. 세금계산서 담당자 정보 구성
    const taxInvoiceInfo = {
      managerName: data.managerName,
      managerPhone: data.managerPhone,
      managerEmail: data.managerEmail,
      submittedAt: new Date().toISOString(),
    };

    // 3. 문서 정보 구성 (기존 문서 고려)
    const documents = {
      businessRegistration: data.businessDocumentFile
        ? {
            // 새로운 파일이 있는 경우
            fileName: data.businessDocumentFile.name,
            fileSize: data.businessDocumentFile.size,
            fileType: data.businessDocumentFile.type,
            fileData: data.businessDocumentFile.data, // base64 데이터 저장
            fileUrl: `data:${data.businessDocumentFile.type};base64,${data.businessDocumentFile.data}`,
            uploadedAt: new Date().toISOString(),
            status: "uploaded",
          }
        : data.hasExistingBusinessDocument &&
          existingDocuments.businessRegistration
        ? {
            // 기존 문서 유지
            ...existingDocuments.businessRegistration,
            status: "existing",
          }
        : null,
      employmentCertificate: data.employmentDocumentFile
        ? {
            // 새로운 파일이 있는 경우
            fileName: data.employmentDocumentFile.name,
            fileSize: data.employmentDocumentFile.size,
            fileType: data.employmentDocumentFile.type,
            fileData: data.employmentDocumentFile.data, // base64 데이터 저장
            fileUrl: `data:${data.employmentDocumentFile.type};base64,${data.employmentDocumentFile.data}`,
            uploadedAt: new Date().toISOString(),
            status: "uploaded",
          }
        : data.hasExistingEmploymentDocument &&
          existingDocuments.employmentCertificate
        ? {
            // 기존 문서 유지
            ...existingDocuments.employmentCertificate,
            status: "existing",
          }
        : null,
    };

    // 4. 승인 로그 추가
    const approvalLog = {
      submittedAt: new Date().toISOString(),
      status: "PENDING",
      submittedData: {
        companyInfo,
        taxInvoiceInfo,
        documents: {
          businessRegistration: documents.businessRegistration
            ? documents.businessRegistration.fileName
            : null,
          employmentCertificate: documents.employmentCertificate
            ? documents.employmentCertificate.fileName
            : null,
        },
      },
    };

    // 5. Users 테이블 업데이트
    const { data: updateResult, error: updateError } = await supabase
      .from("users")
      .update({
        company_info: companyInfo,
        tax_invoice_info: taxInvoiceInfo,
        documents: documents,
        approval_status: "PENDING",
        approval_log: approvalLog,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select();

    if (updateError) {
      console.error("사용자 정보 업데이트 실패:", updateError);
      return NextResponse.json(
        { error: "사업자 인증 정보 저장에 실패했습니다." },
        { status: 500 }
      );
    }

    if (!updateResult || updateResult.length === 0) {
      return NextResponse.json(
        { error: "사용자를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 6. 관리자에게 알림 전송
    try {
      const userName =
        updateResult[0].name || updateResult[0].email || "사용자";

      const notificationData = {
        recipient_role: "ADMIN",
        sender_user_id: parseInt(userId),
        title: "새로운 사업자 인증 신청",
        message: `${userName}님이 사업자 인증을 신청했습니다. 검토가 필요합니다.`,
        type: "BUSINESS_VERIFICATION",
        action_url: `/admin/member-approval?tab=verification&user_id=${userId}`,
      };

      const { error: notificationError } = await supabase
        .from("notifications")
        .insert(notificationData);

      if (notificationError) {
        console.error("관리자 알림 전송 실패:", notificationError);
        // 알림 전송 실패는 전체 프로세스를 중단하지 않음
      }
    } catch (notificationErr) {
      console.error("알림 전송 중 오류:", notificationErr);
      // 알림 전송 실패는 전체 프로세스를 중단하지 않음
    }

    return NextResponse.json({
      success: true,
      message:
        "사업자 인증 신청이 완료되었습니다. 관리자 승인까지 영업일 1~3일 소요됩니다.",
      data: {
        userId: userId,
        status: "PENDING",
        submittedAt: approvalLog.submittedAt,
      },
    });
  } catch (error) {
    console.error("사업자 인증 제출 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
