/**
 * Supabase 클라이언트 싱글톤
 *
 * 서버 사이드 API에서 사용하는 Supabase 클라이언트를 제공합니다.
 * Service Role Key를 사용하여 모든 권한으로 DB에 접근합니다.
 *
 * @warning 이 클라이언트는 서버 사이드 전용입니다. 클라이언트에서 절대 사용하지 마세요.
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";

let supabaseInstance: SupabaseClient | null = null;

/**
 * Supabase 클라이언트 싱글톤 인스턴스 반환
 *
 * 최초 호출 시 인스턴스를 생성하고, 이후 호출에서는 기존 인스턴스를 재사용합니다.
 *
 * @returns Supabase 클라이언트 인스턴스
 *
 * @example
 * import { getSupabaseClient } from "@/lib/apiClient";
 *
 * export async function GET(request: NextRequest) {
 *   const supabase = getSupabaseClient();
 *   const { data } = await supabase.from("users").select("*");
 *   return NextResponse.json({ data });
 * }
 */
export function getSupabaseClient(): SupabaseClient {
  if (!supabaseInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error(
        "Missing Supabase environment variables. Check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
      );
    }

    supabaseInstance = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return supabaseInstance;
}

/**
 * 테스트용: 싱글톤 인스턴스 초기화
 *
 * @internal 테스트 환경에서만 사용하세요
 */
export function resetSupabaseClient(): void {
  supabaseInstance = null;
}
