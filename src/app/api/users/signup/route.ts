import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createClient } from "@supabase/supabase-js";
import { getKSTISOString } from "@/lib/utils";

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
  global: {
    headers: {
      "Content-Type": "application/json",
    },
  },
});

interface SignupRequest {
  email: string;
  password: string;
  name: string;
  phoneNumber: string;
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
}

export async function POST(request: NextRequest) {
  try {
    const body: SignupRequest = await request.json();
    const {
      email,
      password,
      name,
      phoneNumber,
      companyName,
      ceoName,
      businessNumber,
      companyAddress,
      companyAddressDetail,
      companyPhone,
      toll080Number,
      customerServiceNumber,
      taxInvoiceEmail,
      taxInvoiceManager,
      taxInvoiceContact,
      agreeMarketing,
      agreeTerms,
      agreePrivacy,
    } = body;

    console.log("Signup request received:", {
      email,
      name,
      phoneNumber,
      companyName,
      businessNumber,
    });

    // 환경 변수 확인
    console.log("Environment variables check:");
    console.log(
      "SUPABASE_URL:",
      process.env.NEXT_PUBLIC_SUPABASE_URL ? "✓ Set" : "✗ Not set"
    );
    console.log("SUPABASE_SERVICE_KEY:", "✓ Set (using service key)");
    console.log("Using key type:", "SERVICE_ROLE_KEY");

    // Supabase 연결 및 스키마 테스트
    console.log("Testing Supabase connection and schema access...");

    // 먼저 간단한 테이블 존재 확인
    const { data: tableCheck, error: tableError } = await supabase
      .from("users")
      .select("count", { count: "exact", head: true });

    if (tableError) {
      console.error("Table access test failed:", {
        code: tableError.code,
        message: tableError.message,
        details: tableError.details,
        hint: tableError.hint,
      });
    } else {
      console.log("Table access test successful, count:", tableCheck);
    }

    // 입력 값 검증
    const fieldErrors: Array<{ field: string; message: string }> = [];

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

    if (fieldErrors.length > 0) {
      const errorResponse: ErrorResponse = {
        message: "잘못된 요청 (유효성 검증 실패)",
        error: "string",
        status: 400,
        timestamp: getKSTISOString(),
        path: "/api/users/signup",
        fieldErrors,
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // 이메일 중복 확인 (단순화)
    console.log("Checking for existing email:", email);

    let { data: existingUser, error: checkError } = await supabase
      .from("users")
      .select("email")
      .eq("email", email)
      .maybeSingle();

    // Supabase ORM이 실패하면 직접 REST API 호출
    if (checkError && checkError.code === "PGRST106") {
      console.log("Supabase ORM failed, trying direct REST API...");

      try {
        const response = await fetch(
          `${supabaseUrl}/rest/v1/users?email=eq.${encodeURIComponent(
            email
          )}&select=email`,
          {
            method: "GET",
            headers: {
              apikey: supabaseKey,
              Authorization: `Bearer ${supabaseKey}`,
              "Content-Type": "application/json",
              Prefer: "return=minimal",
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          existingUser = data && data.length > 0 ? data[0] : null;
          checkError = null;
          console.log("Direct REST API call successful");
        } else {
          console.error(
            "Direct REST API call failed:",
            response.status,
            response.statusText
          );
        }
      } catch (restError) {
        console.error("Direct REST API call error:", restError);
      }
    }

    if (checkError) {
      console.error("Email check error:", checkError);

      // 테이블이 존재하지 않는 경우
      if (
        checkError.code === "PGRST106" ||
        checkError.message.includes("schema")
      ) {
        const errorResponse: ErrorResponse = {
          message: "데이터베이스 테이블이 존재하지 않습니다",
          error: `users 테이블을 먼저 생성해주세요. Supabase 대시보드 → SQL Editor에서 테이블 생성 SQL을 실행하세요. Error: ${checkError.message}`,
          status: 500,
          timestamp: getKSTISOString(),
          path: "/api/users/signup",
        };
        return NextResponse.json(errorResponse, { status: 500 });
      }

      const errorResponse: ErrorResponse = {
        message: "이메일 확인 중 오류가 발생했습니다",
        error: `Database Error: ${checkError.message}`,
        status: 500,
        timestamp: getKSTISOString(),
        path: "/api/users/signup",
      };
      return NextResponse.json(errorResponse, { status: 500 });
    }

    if (existingUser) {
      console.log("Email already exists:", email);
      const errorResponse: ErrorResponse = {
        message: "이메일 중복",
        error: "string",
        status: 409,
        timestamp: getKSTISOString(),
        path: "/api/users/signup",
        fieldErrors: [
          { field: "email", message: "이미 사용 중인 이메일입니다." },
        ],
      };
      return NextResponse.json(errorResponse, { status: 409 });
    }

    // 비밀번호 해싱
    console.log("Hashing password...");
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 사용자 생성
    console.log("Creating new user...");
    const now = getKSTISOString();
    console.log("Setting last_login_at to:", now);

    // 기업 정보 JSON 객체 생성
    const companyInfo = companyName
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

    // 세금계산서 정보 JSON 객체 생성
    const taxInvoiceInfo = taxInvoiceEmail
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

    const { data: newUser, error: insertError } = await supabase
      .from("users")
      .insert({
        email,
        password: hashedPassword,
        name,
        phone_number: phoneNumber,
        role: "USER",
        is_active: true,
        created_at: now,
        updated_at: now,
        last_login_at: now,
        email_verified: false,
        // JSON 객체로 저장
        company_info: companyInfo,
        tax_invoice_info: taxInvoiceInfo,
        documents: null, // 파일은 별도 API에서 업로드
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
        path: "/api/users/signup",
      };
      return NextResponse.json(errorResponse, { status: 500 });
    }

    console.log("User created successfully:", newUser.id);

    // 성공 응답
    const successResponse: SuccessResponse = {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      phoneNumber: newUser.phone_number,
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
    };

    return NextResponse.json(successResponse, { status: 201 });
  } catch (error) {
    console.error("Signup error:", error);
    const errorResponse: ErrorResponse = {
      message: "서버 내부 오류",
      error: error instanceof Error ? error.message : "Unknown error",
      status: 500,
      timestamp: getKSTISOString(),
      path: "/api/users/signup",
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
