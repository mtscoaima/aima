import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getKSTISOString, generateReferralCode } from "@/lib/utils";

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
  global: {
    headers: {
      "Content-Type": "application/json",
    },
  },
});

interface ErrorResponse {
  message: string;
  error: string;
  status: number;
  timestamp: string;
  path: string;
  fieldErrors?: Array<{ field: string; message: string }>;
}

interface UploadedFile {
  url: string;
  name: string;
  size: number;
  type: string;
}

export async function POST(request: NextRequest) {
  try {
    // FormData 파싱 (파일 업로드 지원)
    const formData = await request.formData();

    // 카카오 기본 정보 추출
    const email = formData.get("email") as string;
    const name = formData.get("name") as string;
    const phoneNumber = formData.get("phoneNumber") as string;

    // 사용자 유형
    const userType = formData.get("userType") as string;

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

    // 추천인 정보
    const referrerName = formData.get("referrerName") as string;
    const referrerCode = formData.get("referrerCode") as string;

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

    // 필수 필드 검증
    const fieldErrors: Array<{ field: string; message: string }> = [];

    if (!email || !email.includes("@")) {
      fieldErrors.push({
        field: "email",
        message: "유효한 이메일 주소가 필요합니다.",
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

    if (!userType) {
      fieldErrors.push({
        field: "userType",
        message: "사용자 유형을 선택해주세요.",
      });
    }

    // 약관 동의 확인
    if (!agreeTerms) {
      fieldErrors.push({
        field: "agreeTerms",
        message: "서비스 이용약관에 동의해주세요.",
      });
    }

    if (!agreePrivacy) {
      fieldErrors.push({
        field: "agreePrivacy",
        message: "개인정보 처리방침에 동의해주세요.",
      });
    }

    // 일반회원인 경우 기업 정보 필수 검증
    if (userType === "general") {
      if (!companyName || companyName.trim().length === 0) {
        fieldErrors.push({
          field: "companyName",
          message: "회사명을 입력해주세요.",
        });
      }

      if (!ceoName || ceoName.trim().length === 0) {
        fieldErrors.push({
          field: "ceoName",
          message: "대표자명을 입력해주세요.",
        });
      }

      if (!businessNumber || businessNumber.trim().length === 0) {
        fieldErrors.push({
          field: "businessNumber",
          message: "사업자등록번호를 입력해주세요.",
        });
      }

      if (!companyAddress || companyAddress.trim().length === 0) {
        fieldErrors.push({
          field: "companyAddress",
          message: "회사 주소를 입력해주세요.",
        });
      }

      if (!companyPhone || companyPhone.trim().length === 0) {
        fieldErrors.push({
          field: "companyPhone",
          message: "회사 전화번호를 입력해주세요.",
        });
      }

      // 필수 파일 검증
      if (!businessRegistration) {
        fieldErrors.push({
          field: "businessRegistration",
          message: "사업자등록증을 업로드해주세요.",
        });
      }
    }

    // 파일 유형 및 크기 검증 함수
    const validateFile = (file: File, fieldName: string) => {
      const maxSize = 10 * 1024 * 1024; // 10MB
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];

      if (file.size > maxSize) {
        fieldErrors.push({
          field: fieldName,
          message: "파일 크기는 10MB 이하여야 합니다.",
        });
      }

      if (!allowedTypes.includes(file.type)) {
        fieldErrors.push({
          field: fieldName,
          message:
            "지원하지 않는 파일 형식입니다. (JPG, PNG, GIF, PDF, DOC, DOCX만 가능)",
        });
      }
    };

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
        error: "Validation failed",
        status: 400,
        timestamp: getKSTISOString(),
        path: "/api/auth/kakao-signup",
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
      return NextResponse.json(
        {
          message: "이메일 확인 중 오류가 발생했습니다",
          error: `Database Error: ${checkError.message}`,
          status: 500,
          timestamp: getKSTISOString(),
          path: "/api/auth/kakao-signup",
        },
        { status: 500 }
      );
    }

    if (existingUser) {
      return NextResponse.json(
        {
          message: "이미 가입된 이메일입니다.",
          error: "Email already exists",
          status: 409,
          timestamp: getKSTISOString(),
          path: "/api/auth/kakao-signup",
          fieldErrors: [
            { field: "email", message: "이미 사용 중인 이메일입니다." },
          ],
        },
        { status: 409 }
      );
    }

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
      const tempUserId = Date.now() % 100000;
      referralCode = generateReferralCode(tempUserId);

      let attempts = 0;
      while (attempts < 10) {
        const { data: existingCode } = await supabase
          .from("users")
          .select("id")
          .eq("referral_code", referralCode)
          .maybeSingle();

        if (!existingCode) break;

        referralCode = generateReferralCode(tempUserId + attempts);
        attempts++;
      }
    }

    const { data: newUser, error: insertError } = await supabase
      .from("users")
      .insert({
        email,
        password: "KAKAO_USER", // 카카오 사용자는 비밀번호 없음 (구분용)
        name,
        phone_number: phoneNumber,
        role: userRole,
        approval_status: approvalStatus,
        is_active: true,
        created_at: now,
        updated_at: now,
        last_login_at: now,
        email_verified: true, // 카카오로 가입한 경우 이메일 인증됨
        referral_code: referralCode,
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
      return NextResponse.json(
        {
          message: "사용자 생성 중 오류가 발생했습니다",
          error: `Database Error: ${insertError.message}`,
          status: 500,
          timestamp: getKSTISOString(),
          path: "/api/auth/kakao-signup",
        },
        { status: 500 }
      );
    }

    // 영업사원인 경우 실제 사용자 ID로 추천 코드 재생성 및 업데이트
    if (userType === "salesperson" && newUser) {
      const finalReferralCode = generateReferralCode(newUser.id);

      let finalAttempts = 0;
      let uniqueReferralCode = finalReferralCode;

      while (finalAttempts < 10) {
        const { data: existingCode } = await supabase
          .from("users")
          .select("id")
          .eq("referral_code", uniqueReferralCode)
          .neq("id", newUser.id)
          .maybeSingle();

        if (!existingCode) break;

        uniqueReferralCode = generateReferralCode(newUser.id + finalAttempts);
        finalAttempts++;
      }

      await supabase
        .from("users")
        .update({ referral_code: uniqueReferralCode })
        .eq("id", newUser.id);

      newUser.referral_code = uniqueReferralCode;
    }

    // 추천인 정보 처리 (추천인 코드가 있는 경우)
    if (referrerCode && referrerName) {
      try {
        const { data: referrer, error: referrerError } = await supabase
          .from("users")
          .select("id, name, referral_code, role, is_active")
          .eq("referral_code", referrerCode)
          .eq("name", referrerName)
          .eq("is_active", true)
          .eq("role", "SALESPERSON")
          .single();

        if (!referrerError && referrer) {
          const { error: referralInsertError } = await supabase
            .from("referrals")
            .insert({
              referrer_id: referrer.id,
              referred_user_id: newUser.id,
              referral_code: referrerCode,
              status: "ACTIVE",
              created_at: getKSTISOString(),
            });

          if (referralInsertError) {
            console.error("추천 관계 저장 실패:", referralInsertError);
          }
        } else {
          console.error("추천인 정보 확인 실패:", referrerError);
        }
      } catch (referralError) {
        console.error("추천인 처리 중 오류:", referralError);
      }
    }

    // 파일 업로드 처리 (일반회원인 경우에만)
    const documents: { [key: string]: UploadedFile } = {};

    if (userType === "general") {
      const uploadFile = async (
        file: File,
        fileName: string
      ): Promise<UploadedFile | null> => {
        try {
          const fileExt = file.name.split(".").pop();
          const fileName_timestamped = `${fileName}_${
            newUser.id
          }_${Date.now()}.${fileExt}`;

          const { error } = await supabase.storage
            .from("documents")
            .upload(fileName_timestamped, file, {
              cacheControl: "3600",
              upsert: false,
            });

          if (error) {
            console.error(`파일 업로드 실패 (${fileName}):`, error);
            return null;
          }

          const { data: urlData } = supabase.storage
            .from("documents")
            .getPublicUrl(fileName_timestamped);

          return {
            url: urlData.publicUrl,
            name: file.name,
            size: file.size,
            type: file.type,
          };
        } catch (error) {
          console.error(`파일 업로드 중 오류 (${fileName}):`, error);
          return null;
        }
      };

      if (businessRegistration) {
        const uploadedFile = await uploadFile(
          businessRegistration,
          "business_registration"
        );
        if (uploadedFile) {
          documents.businessRegistration = uploadedFile;
        }
      }

      if (employmentCertificate) {
        const uploadedFile = await uploadFile(
          employmentCertificate,
          "employment_certificate"
        );
        if (uploadedFile) {
          documents.employmentCertificate = uploadedFile;
        }
      }

      // documents 업데이트
      if (Object.keys(documents).length > 0) {
        const { error: updateError } = await supabase
          .from("users")
          .update({ documents })
          .eq("id", newUser.id);

        if (updateError) {
          console.error("문서 정보 업데이트 실패:", updateError);
        }
      }
    }

    // 성공 응답
    return NextResponse.json(
      {
        message: "카카오 회원가입이 완료되었습니다.",
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          phoneNumber: newUser.phone_number,
          role: newUser.role,
          createdAt: newUser.created_at,
          updatedAt: newUser.updated_at,
          approval_status: newUser.approval_status,
          referralCode: newUser.referral_code,
          companyInfo: newUser.company_info,
          taxInvoiceInfo: newUser.tax_invoice_info,
          documents: newUser.documents,
          agreementInfo: newUser.agreement_info,
        },
        timestamp: getKSTISOString(),
        path: "/api/auth/kakao-signup",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("카카오 회원가입 에러:", error);
    return NextResponse.json(
      {
        message: "서버 내부 오류가 발생했습니다.",
        error: "Internal server error",
        status: 500,
        timestamp: getKSTISOString(),
        path: "/api/auth/kakao-signup",
      },
      { status: 500 }
    );
  }
}
