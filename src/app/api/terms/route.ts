import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

// 약관 타입 정의
const VALID_TERM_TYPES = [
  'SERVICE_TERMS',
  'PRIVACY_POLICY',
  'MARKETING_CONSENT'
] as const;

type TermType = typeof VALID_TERM_TYPES[number];

interface TermsData {
  id: number;
  term_type: string;
  title: string;
  content: string;
  version: string;
  description: string | null;
  is_active: boolean;
  required: boolean;
  created_at: string;
  updated_at: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as TermType;

    // 타입 검증
    if (!type) {
      return NextResponse.json(
        {
          success: false,
          error: "약관 타입이 필요합니다. type 파라미터를 제공해주세요.",
          validTypes: VALID_TERM_TYPES
        },
        { status: 400 }
      );
    }

    if (!VALID_TERM_TYPES.includes(type)) {
      return NextResponse.json(
        {
          success: false,
          error: `유효하지 않은 약관 타입입니다: ${type}`,
          validTypes: VALID_TERM_TYPES
        },
        { status: 400 }
      );
    }

    // 활성화된 약관 조회
    const { data, error } = await supabase
      .from("terms_agreements")
      .select("*")
      .eq("term_type", type)
      .eq("is_active", true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // 데이터를 찾을 수 없는 경우
        return NextResponse.json(
          {
            success: false,
            error: `${type} 약관을 찾을 수 없습니다.`
          },
          { status: 404 }
        );
      }

      console.error("약관 조회 오류:", error);
      return NextResponse.json(
        {
          success: false,
          error: "약관 조회에 실패했습니다."
        },
        { status: 500 }
      );
    }

    // 캐시 헤더 설정 (24시간)
    const response = NextResponse.json({
      success: true,
      data: data as TermsData
    });

    // 캐시 설정: 24시간 캐싱, 재검증은 1시간마다
    response.headers.set('Cache-Control', 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=3600');
    response.headers.set('CDN-Cache-Control', 'public, max-age=86400');

    return response;

  } catch (error) {
    console.error("약관 조회 API 오류:", error);
    return NextResponse.json(
      {
        success: false,
        error: "서버 오류가 발생했습니다."
      },
      { status: 500 }
    );
  }
}

// 모든 활성 약관 조회 (옵션)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { types } = body;

    // 여러 약관을 한 번에 조회하는 경우
    if (types && Array.isArray(types)) {
      const validTypes = types.filter(type => VALID_TERM_TYPES.includes(type));

      if (validTypes.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: "유효한 약관 타입이 없습니다.",
            validTypes: VALID_TERM_TYPES
          },
          { status: 400 }
        );
      }

      const { data, error } = await supabase
        .from("terms_agreements")
        .select("*")
        .in("term_type", validTypes)
        .eq("is_active", true)
        .order("term_type");

      if (error) {
        console.error("다중 약관 조회 오류:", error);
        return NextResponse.json(
          {
            success: false,
            error: "약관 조회에 실패했습니다."
          },
          { status: 500 }
        );
      }

      const response = NextResponse.json({
        success: true,
        data: data as TermsData[]
      });

      // 캐시 설정
      response.headers.set('Cache-Control', 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=3600');

      return response;
    }

    // 모든 활성 약관 조회
    const { data, error } = await supabase
      .from("terms_agreements")
      .select("*")
      .eq("is_active", true)
      .order("term_type");

    if (error) {
      console.error("전체 약관 조회 오류:", error);
      return NextResponse.json(
        {
          success: false,
          error: "약관 조회에 실패했습니다."
        },
        { status: 500 }
      );
    }

    const response = NextResponse.json({
      success: true,
      data: data as TermsData[]
    });

    // 캐시 설정
    response.headers.set('Cache-Control', 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=3600');

    return response;

  } catch (error) {
    console.error("약관 조회 API 오류:", error);
    return NextResponse.json(
      {
        success: false,
        error: "서버 오류가 발생했습니다."
      },
      { status: 500 }
    );
  }
}