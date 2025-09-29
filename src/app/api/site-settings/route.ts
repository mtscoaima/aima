import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: 공개 사이트 설정 조회 (인증 불필요)
export async function GET() {
  try {
    // 시스템 설정에서 site_settings만 조회
    const { data: settings, error } = await supabase
      .from("system_settings")
      .select("site_settings")
      .limit(1)
      .single();

    if (error) {
      console.error("사이트 설정 조회 오류:", error);
      // 기본값 반환
      return NextResponse.json({
        success: true,
        data: {
          minimum_campaign_price: "200000",
          default_daily_limit: "50000",
        },
      });
    }

    // site_settings JSON 파싱
    let siteSettings;
    try {
      siteSettings = typeof settings.site_settings === 'string'
        ? JSON.parse(settings.site_settings)
        : settings.site_settings;
    } catch (parseError) {
      console.error("사이트 설정 파싱 오류:", parseError);
      // 기본값 반환
      return NextResponse.json({
        success: true,
        data: {
          minimum_campaign_price: "200000",
          default_daily_limit: "50000",
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        minimum_campaign_price: siteSettings?.minimum_campaign_price || "200000",
        default_daily_limit: siteSettings?.default_daily_limit || "50000",
        site_name: siteSettings?.site_name || "MTS Message",
        contact_email: siteSettings?.contact_email || "support@mtsmessage.com",
        contact_phone: siteSettings?.contact_phone || "1588-0000",
      },
    });
  } catch (error) {
    console.error("사이트 설정 조회 중 오류:", error);
    // 오류 시 기본값 반환
    return NextResponse.json({
      success: true,
      data: {
        minimum_campaign_price: "200000",
        default_daily_limit: "50000",
      },
    });
  }
}