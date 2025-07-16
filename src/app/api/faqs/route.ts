import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const { data: faqs, error } = await supabase
      .from("faqs")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (error) {
      console.error("Error fetching FAQs:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 데이터 형식을 프론트엔드에서 기대하는 형식으로 변환
    const formattedFaqs =
      faqs?.map((faq) => ({
        id: faq.id,
        question: faq.question,
        answer: faq.answer,
        category: faq.category || "",
        displayOrder: faq.display_order,
      })) || [];

    return NextResponse.json(formattedFaqs);
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
