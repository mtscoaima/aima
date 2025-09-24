import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("faqs")
      .select("display_order")
      .order("display_order", { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error("Error fetching max FAQ order:", error);
      // FAQ가 없는 경우 0을 반환
      if (error.code === "PGRST116") {
        return NextResponse.json({ maxOrder: 0 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ maxOrder: data?.display_order || 0 });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "서버 내부 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
