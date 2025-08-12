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
  agreeTerms?: boolean;
  agreePrivacy?: boolean;
  agreeMarketing?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    // FormData 파싱
    const formData = await request.formData();

    // 기본 정보 추출
    const userType = formData.get("userType") as string;
    const username = formData.get("username") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const name = formData.get("name") as string;
    const phoneNumber = formData.get("phoneNumber") as string;
    const birthDate = formData.get("birthDate") as string;

    // 본인인증 정보 추출
    const verificationId = formData.get("verificationId") as string;
    const ci = formData.get("ci") as string;

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

    // 소셜 로그인 정보
    const socialLoginType = formData.get("socialLoginType") as string;
    const socialUserId = formData.get("socialUserId") as string;

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

    // 본인인증 검증은 현재 UI에서 지원하지 않음
    // 추후 필요시 구현 예정

    if (!userType || (userType !== "general" && userType !== "salesperson")) {
      fieldErrors.push({
        field: "userType",
        message: "회원 유형을 선택해주세요.",
      });
    }

    if (!username || !username.trim()) {
      fieldErrors.push({
        field: "username",
        message: "아이디를 입력해주세요.",
      });
    } else if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      fieldErrors.push({
        field: "username",
        message:
          "아이디는 영문, 숫자, 언더스코어만 사용하여 3-20자로 입력하세요.",
      });
    }

    if (!email || !email.includes("@")) {
      fieldErrors.push({
        field: "email",
        message: "유효한 이메일 주소를 입력해주세요.",
      });
    }

    if (!password) {
      fieldErrors.push({
        field: "password",
        message: "비밀번호를 입력해주세요.",
      });
    } else {
      // 비밀번호 검증 로직 (간단화된 버전)
      if (password.length < 8) {
        fieldErrors.push({
          field: "password",
          message: "비밀번호는 최소 8자 이상이어야 합니다.",
        });
      } else if (password.length > 20) {
        fieldErrors.push({
          field: "password",
          message: "비밀번호는 최대 20자까지 입력 가능합니다.",
        });
      } else {
        // 영문, 숫자, 특수기호 조합 검증
        const hasLetter = /[a-zA-Z]/.test(password);
        const hasNumber = /\d/.test(password);
        const hasSpecialChar = /[~!@#$%^&*()_\-=+[{\]}'"\\;:/?.>,<]/.test(
          password
        );

        if (!(hasLetter && hasNumber && hasSpecialChar)) {
          fieldErrors.push({
            field: "password",
            message: "영문, 숫자, 특수기호를 모두 포함해야 합니다.",
          });
        }

        // 동일한 문자 4개 이상 검증
        if (/(.)\1{3,}/.test(password)) {
          fieldErrors.push({
            field: "password",
            message: "동일한 문자가 4개 이상 연속으로 사용될 수 없습니다.",
          });
        }

        // 연속된 문자 4개 이상 검증
        for (let i = 0; i <= password.length - 4; i++) {
          const slice = password.slice(i, i + 4);
          let isConsecutive = true;

          for (let j = 1; j < slice.length; j++) {
            if (slice.charCodeAt(j) !== slice.charCodeAt(j - 1) + 1) {
              isConsecutive = false;
              break;
            }
          }

          if (isConsecutive) {
            fieldErrors.push({
              field: "password",
              message: "연속된 문자가 4개 이상 사용될 수 없습니다.",
            });
            break;
          }
        }
      }
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

    // 일반회원 파일 검증 (선택사항으로 변경)
    // 파일 업로드는 현재 UI에서 지원하지 않으므로 필수 체크 제거

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

    // 아이디 중복 확인
    const { data: existingUsername, error: usernameCheckError } = await supabase
      .from("users")
      .select("username")
      .eq("username", username)
      .maybeSingle();

    if (usernameCheckError) {
      console.error("Username check error:", usernameCheckError);
      const errorResponse: ErrorResponse = {
        message: "아이디 확인 중 오류가 발생했습니다",
        error: `Database Error: ${usernameCheckError.message}`,
        status: 500,
        timestamp: getKSTISOString(),
        path: "/api/users/signup-with-files",
      };
      return NextResponse.json(errorResponse, { status: 500 });
    }

    if (existingUsername) {
      const errorResponse: ErrorResponse = {
        message: "아이디 중복",
        error: "string",
        status: 409,
        timestamp: getKSTISOString(),
        path: "/api/users/signup-with-files",
        fieldErrors: [
          { field: "username", message: "이미 사용 중인 아이디입니다." },
        ],
      };
      return NextResponse.json(errorResponse, { status: 409 });
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

    // 현재 데이터베이스 스키마에 맞게 기본 정보만 사용

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
        username,
        email,
        password: hashedPassword,
        name,
        phone_number: phoneNumber,
        birth_date: birthDate,
        ci: ci || null,
        role: userRole,
        is_active: true,
        created_at: now,
        updated_at: now,
        email_verified: false,
        referral_code: referralCode,
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

    // 추천인 정보 처리 (추천인 코드가 있는 경우)
    if (referrerCode) {
      try {
        // 추천인 정보 검증 (추천인 코드만으로 검증)
        const { data: referrer, error: referrerError } = await supabase
          .from("users")
          .select("id, name, referral_code, role, is_active")
          .eq("referral_code", referrerCode)
          .eq("is_active", true)
          .eq("role", "SALESPERSON")
          .single();

        if (!referrerError && referrer) {
          // referrals 테이블에 추천 관계 저장
          const { error: referralInsertError } = await supabase
            .from("referrals")
            .insert({
              referrer_id: referrer.id,
              referred_user_id: newUser.id,
              referral_code: referrerCode,
              status: "ACTIVE", // 추천 관계 상태
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

    // 파일 업로드는 현재 UI에서 지원하지 않음
    // 추후 필요시 구현 예정

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
      agreeTerms: agreeTerms,
      agreePrivacy: agreePrivacy,
      agreeMarketing: agreeMarketing,
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
