import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createClient } from "@supabase/supabase-js";
import { getKSTISOString, generateReferralCode } from "@/lib/utils";

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

interface UploadedFile {
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
}

interface ErrorResponse {
  message: string;
  error: string;
  status: number;
  timestamp: string;
  path: string;
  fieldErrors?: Array<{
    field: string;
    message: string;
  }>;
}

interface SuccessResponse {
  id: number;
  email: string;
  name: string;
  phoneNumber: string;
  userType: string;
  role: string;
  createdAt: string;
  updatedAt: string;
  companyName?: string;
  ceoName?: string;
  businessNumber?: string;
  companyAddress?: string;
  companyAddressDetail?: string;
  companyPhone?: string;
  toll080Number?: string;
  customerServiceNumber?: string;
  taxInvoiceEmail?: string;
  taxInvoiceManager?: string;
  taxInvoiceContact?: string;
  agreeMarketing?: boolean;
  agreeTerms?: boolean;
  agreePrivacy?: boolean;
  agreementInfo?: {
    terms: boolean;
    privacy: boolean;
    marketing: boolean;
    agreedAt: string;
  };
  documents?: { [key: string]: UploadedFile };
}

export async function POST(request: NextRequest) {
  try {
    // FormData 파싱
    const formData = await request.formData();

    // 기본 정보 추출
    const userType = formData.get("userType") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const name = formData.get("name") as string;
    const phoneNumber = formData.get("phoneNumber") as string;

    // 기업 정보 추출
    const companyName = formData.get("companyName") as string;
    const ceoName = formData.get("ceoName") as string;
    const businessNumber = formData.get("businessNumber") as string;
    const companyAddress = formData.get("companyAddress") as string;
    const companyAddressDetail = formData.get("companyAddressDetail") as string;
    const companyPhone = formData.get("companyPhone") as string;
    const toll080Number = formData.get("toll080Number") as string;
    const customerServiceNumber = formData.get(
      "customerServiceNumber"
    ) as string;

    // 세금계산서 정보 추출
    const taxInvoiceEmail = formData.get("taxInvoiceEmail") as string;
    const taxInvoiceManager = formData.get("taxInvoiceManager") as string;
    const taxInvoiceContact = formData.get("taxInvoiceContact") as string;

    // 마케팅 동의
    const agreeMarketing = formData.get("agreeMarketing") === "true";

    // 약관 동의
    const agreeTerms = formData.get("agreeTerms") === "true";
    const agreePrivacy = formData.get("agreePrivacy") === "true";

    // 파일 추출
    const businessRegistration = formData.get(
      "businessRegistration"
    ) as File | null;
    const employmentCertificate = formData.get(
      "employmentCertificate"
    ) as File | null;

    // 입력 값 검증
    const fieldErrors: Array<{ field: string; message: string }> = [];

    if (!userType || (userType !== "general" && userType !== "salesperson")) {
      fieldErrors.push({
        field: "userType",
        message: "회원 유형을 선택해주세요.",
      });
    }

    if (!email || !email.includes("@")) {
      fieldErrors.push({
        field: "email",
        message: "유효한 이메일 주소를 입력해주세요.",
      });
    }

    if (!password || password.length < 6) {
      fieldErrors.push({
        field: "password",
        message: "비밀번호는 최소 6자 이상이어야 합니다.",
      });
    }

    if (!name || name.trim().length === 0) {
      fieldErrors.push({ field: "name", message: "이름을 입력해주세요." });
    }

    if (!phoneNumber || phoneNumber.trim().length === 0) {
      fieldErrors.push({
        field: "phoneNumber",
        message: "전화번호를 입력해주세요.",
      });
    }

    // 파일 유형 및 크기 검증 함수
    const validateFile = (file: File, fieldName: string) => {
      const allowedTypes = [
        "application/pdf",
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
      ];

      if (!allowedTypes.includes(file.type)) {
        fieldErrors.push({
          field: fieldName,
          message:
            "PDF 또는 이미지 파일(JPG, PNG, GIF, WEBP)만 업로드 가능합니다.",
        });
      }

      // 파일 크기 검증 (10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        fieldErrors.push({
          field: fieldName,
          message: "파일 크기는 10MB 이하여야 합니다.",
        });
      }
    };

    // 일반회원인 경우에만 파일 검증
    if (userType === "general") {
      // 필수 파일 검증
      if (!businessRegistration) {
        fieldErrors.push({
          field: "businessRegistration",
          message: "사업자등록증을 업로드해주세요.",
        });
      }
    }

    // 일반회원인 경우에만 파일 유형 및 크기 검증
    if (userType === "general") {
      if (businessRegistration) {
        validateFile(businessRegistration, "businessRegistration");
      }

      if (employmentCertificate) {
        validateFile(employmentCertificate, "employmentCertificate");
      }
    }

    if (fieldErrors.length > 0) {
      const errorResponse: ErrorResponse = {
        message: "잘못된 요청 (유효성 검증 실패)",
        error: "string",
        status: 400,
        timestamp: getKSTISOString(),
        path: "/api/users/signup-with-files",
        fieldErrors,
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // 이메일 중복 확인
    const { data: existingUser, error: checkError } = await supabase
      .from("users")
      .select("email")
      .eq("email", email)
      .maybeSingle();

    if (checkError) {
      console.error("Email check error:", checkError);
      const errorResponse: ErrorResponse = {
        message: "이메일 확인 중 오류가 발생했습니다",
        error: `Database Error: ${checkError.message}`,
        status: 500,
        timestamp: getKSTISOString(),
        path: "/api/users/signup-with-files",
      };
      return NextResponse.json(errorResponse, { status: 500 });
    }

    if (existingUser) {
      const errorResponse: ErrorResponse = {
        message: "이메일 중복",
        error: "string",
        status: 409,
        timestamp: getKSTISOString(),
        path: "/api/users/signup-with-files",
        fieldErrors: [
          { field: "email", message: "이미 사용 중인 이메일입니다." },
        ],
      };
      return NextResponse.json(errorResponse, { status: 409 });
    }

    // 비밀번호 해싱
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 사용자 생성
    const now = getKSTISOString();

    // 기업 정보 JSON 객체 생성 (일반회원인 경우에만)
    const companyInfo =
      userType === "general" && companyName
        ? {
            companyName,
            ceoName,
            businessNumber,
            companyAddress,
            companyAddressDetail,
            companyPhone,
            toll080Number,
            customerServiceNumber,
          }
        : null;

    // 세금계산서 정보 JSON 객체 생성 (일반회원인 경우에만)
    const taxInvoiceInfo =
      userType === "general" && taxInvoiceEmail
        ? {
            email: taxInvoiceEmail,
            manager: taxInvoiceManager,
            contact: taxInvoiceContact,
          }
        : null;

    // 약관 동의 정보 JSON 객체 생성
    const agreementInfo = {
      terms: agreeTerms || false,
      privacy: agreePrivacy || false,
      marketing: agreeMarketing || false,
      agreedAt: getKSTISOString(),
    };

    // userType에 따른 role 및 approval_status 설정
    const userRole = userType === "salesperson" ? "SALESPERSON" : "USER";
    const approvalStatus = userType === "salesperson" ? "APPROVED" : "PENDING";

    // 영업사원인 경우 추천 코드 생성
    let referralCode = null;
    if (userType === "salesperson") {
      // 임시 사용자 ID를 사용하여 추천 코드 생성 (실제 ID는 삽입 후 얻음)
      const tempUserId = Date.now() % 100000; // 임시 ID 생성
      referralCode = generateReferralCode(tempUserId);

      // 중복 검증
      let attempts = 0;
      while (attempts < 10) {
        const { data: existingCode } = await supabase
          .from("users")
          .select("id")
          .eq("referral_code", referralCode)
          .maybeSingle();

        if (!existingCode) break;

        // 중복이면 새로 생성
        referralCode = generateReferralCode(tempUserId + attempts);
        attempts++;
      }
    }

    const { data: newUser, error: insertError } = await supabase
      .from("users")
      .insert({
        email,
        password: hashedPassword,
        name,
        phone_number: phoneNumber,
        role: userRole,
        approval_status: approvalStatus, // 영업사원은 승인됨, 일반사원은 승인 대기
        is_active: true,
        created_at: now,
        updated_at: now,
        last_login_at: now,
        email_verified: false,
        referral_code: referralCode, // 영업사원인 경우 추천 코드 저장
        // JSON 객체로 저장
        company_info: companyInfo,
        tax_invoice_info: taxInvoiceInfo,
        documents: null, // 파일 업로드 후 업데이트
        agreement_info: agreementInfo,
        agree_marketing: agreeMarketing,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Database insert error:", insertError);
      const errorResponse: ErrorResponse = {
        message: "사용자 생성 중 오류가 발생했습니다",
        error: `Database Error: ${insertError.message}`,
        status: 500,
        timestamp: getKSTISOString(),
        path: "/api/users/signup-with-files",
      };
      return NextResponse.json(errorResponse, { status: 500 });
    }

    // 영업사원인 경우 실제 사용자 ID로 추천 코드 재생성 및 업데이트
    if (userType === "salesperson" && newUser) {
      const finalReferralCode = generateReferralCode(newUser.id);

      // 중복 검증 후 업데이트
      let finalAttempts = 0;
      let uniqueReferralCode = finalReferralCode;

      while (finalAttempts < 10) {
        const { data: existingCode } = await supabase
          .from("users")
          .select("id")
          .eq("referral_code", uniqueReferralCode)
          .neq("id", newUser.id) // 자신 제외
          .maybeSingle();

        if (!existingCode) break;

        uniqueReferralCode = generateReferralCode(newUser.id + finalAttempts);
        finalAttempts++;
      }

      // 최종 추천 코드로 업데이트
      await supabase
        .from("users")
        .update({ referral_code: uniqueReferralCode })
        .eq("id", newUser.id);

      // 응답용 데이터 업데이트
      newUser.referral_code = uniqueReferralCode;
    }

    // 파일 업로드 처리 (일반회원인 경우에만)
    const documents: { [key: string]: UploadedFile } = {};

    if (userType === "general") {
      try {
        // 사업자등록증 업로드
        if (businessRegistration) {
          const fileExt = businessRegistration.name.split(".").pop();
          const fileName = `business_registration_${Date.now()}.${fileExt}`;
          const filePath = `documents/${newUser.id}/${fileName}`;

          // 파일을 ArrayBuffer로 변환
          const fileBuffer = await businessRegistration.arrayBuffer();

          const { error: uploadError } = await supabase.storage
            .from("user-documents")
            .upload(filePath, fileBuffer, {
              cacheControl: "3600",
              upsert: false,
              contentType: businessRegistration.type,
            });

          if (uploadError) {
            console.error("사업자등록증 업로드 실패:", uploadError);
          } else {
            const { data: urlData } = supabase.storage
              .from("user-documents")
              .getPublicUrl(filePath);

            documents.businessRegistration = {
              fileName: businessRegistration.name,
              fileUrl: urlData.publicUrl,
              uploadedAt: getKSTISOString(),
            };
          }
        }

        // 재직증명서 업로드
        if (employmentCertificate) {
          const fileExt = employmentCertificate.name.split(".").pop();
          const fileName = `employment_certificate_${Date.now()}.${fileExt}`;
          const filePath = `documents/${newUser.id}/${fileName}`;

          // 파일을 ArrayBuffer로 변환
          const fileBuffer = await employmentCertificate.arrayBuffer();

          const { error: uploadError } = await supabase.storage
            .from("user-documents")
            .upload(filePath, fileBuffer, {
              cacheControl: "3600",
              upsert: false,
              contentType: employmentCertificate.type,
            });

          if (uploadError) {
            console.error("재직증명서 업로드 실패:", uploadError);
          } else {
            const { data: urlData } = supabase.storage
              .from("user-documents")
              .getPublicUrl(filePath);

            documents.employmentCertificate = {
              fileName: employmentCertificate.name,
              fileUrl: urlData.publicUrl,
              uploadedAt: getKSTISOString(),
            };
          }
        }

        // 문서 정보가 있으면 사용자 레코드 업데이트
        if (Object.keys(documents).length > 0) {
          const { error: updateError } = await supabase
            .from("users")
            .update({
              documents: documents,
              updated_at: getKSTISOString(),
            })
            .eq("id", newUser.id);

          if (updateError) {
            console.error("문서 정보 업데이트 실패:", updateError);
          }
        }
      } catch (fileError) {
        console.error("파일 업로드 중 오류:", fileError);
        // 파일 업로드 실패해도 회원가입은 성공으로 처리
      }
    }

    // 성공 응답
    const successResponse: SuccessResponse = {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      phoneNumber: newUser.phone_number,
      userType: userType,
      role: newUser.role,
      createdAt: newUser.created_at,
      updatedAt: newUser.updated_at,
      companyName: newUser.company_info?.companyName,
      ceoName: newUser.company_info?.ceoName,
      businessNumber: newUser.company_info?.businessNumber,
      companyAddress: newUser.company_info?.companyAddress,
      companyAddressDetail: newUser.company_info?.companyAddressDetail,
      companyPhone: newUser.company_info?.companyPhone,
      toll080Number: newUser.company_info?.toll080Number,
      customerServiceNumber: newUser.company_info?.customerServiceNumber,
      taxInvoiceEmail: newUser.tax_invoice_info?.email,
      taxInvoiceManager: newUser.tax_invoice_info?.manager,
      taxInvoiceContact: newUser.tax_invoice_info?.contact,
      agreeMarketing: newUser.agree_marketing,
      agreeTerms: newUser.agreement_info?.terms,
      agreePrivacy: newUser.agreement_info?.privacy,
      agreementInfo: newUser.agreement_info,
      documents: Object.keys(documents).length > 0 ? documents : undefined,
    };

    return NextResponse.json(successResponse, { status: 201 });
  } catch (error) {
    console.error("Signup with files error:", error);
    const errorResponse: ErrorResponse = {
      message: "서버 내부 오류",
      error: error instanceof Error ? error.message : "Unknown error",
      status: 500,
      timestamp: getKSTISOString(),
      path: "/api/users/signup-with-files",
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
