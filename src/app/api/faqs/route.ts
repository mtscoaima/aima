import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get("include_inactive") === "true";
    const page = searchParams.get("page");
    const limit = searchParams.get("limit");

    // 페이지네이션이 요청된 경우
    const usePagination = page !== null || limit !== null;

    let query = supabase
      .from("faqs")
      .select("*")
      .order("display_order", { ascending: true });

    if (!includeInactive) {
      query = query.eq("is_active", true);
    }

    if (usePagination) {
      const pageNum = parseInt(page || "1");
      const limitNum = parseInt(limit || "10");
      const offset = (pageNum - 1) * limitNum;

      // 전체 개수 가져오기
      let countQuery = supabase
        .from("faqs")
        .select("*", { count: "exact", head: true });

      if (!includeInactive) {
        countQuery = countQuery.eq("is_active", true);
      }

      const { count, error: countError } = await countQuery;

      if (countError) {
        console.error("Error counting FAQs:", countError);
        return NextResponse.json(
          { error: countError.message },
          { status: 500 }
        );
      }

      // 페이지네이션 적용
      const { data: faqs, error } = await query.range(
        offset,
        offset + limitNum - 1
      );

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
          isActive: faq.is_active,
          createdAt: new Date(faq.created_at).toISOString().split("T")[0],
          updatedAt: new Date(faq.updated_at).toISOString().split("T")[0],
        })) || [];

      const totalPages = Math.ceil((count || 0) / limitNum);

      return NextResponse.json({
        faqs: formattedFaqs,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalItems: count || 0,
          limit: limitNum,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1,
        },
      });
    } else {
      // 페이지네이션이 요청되지 않은 경우 - 이전 방식대로 배열만 반환
      const { data: faqs, error } = await query;

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
          isActive: faq.is_active,
          createdAt: new Date(faq.created_at).toISOString().split("T")[0],
          updatedAt: new Date(faq.updated_at).toISOString().split("T")[0],
        })) || [];

      return NextResponse.json(formattedFaqs);
    }
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const {
      question,
      answer,
      category,
      displayOrder,
      isActive = true,
    } = await request.json();

    if (!question || !answer) {
      return NextResponse.json(
        { error: "Question and answer are required" },
        { status: 400 }
      );
    }

    const finalDisplayOrder = displayOrder || 0;

    // 입력된 순서 이후의 모든 FAQ들을 조회
    const { data: faqsToUpdate, error: fetchError } = await supabase
      .from("faqs")
      .select("id, display_order")
      .gte("display_order", finalDisplayOrder)
      .order("display_order", { ascending: true });

    if (fetchError) {
      console.error("Error fetching FAQs for order update:", fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    // 순서가 중복되는 경우, 해당 순서 이후의 모든 FAQ 순서를 +1씩 증가
    if (faqsToUpdate && faqsToUpdate.length > 0) {
      for (const faq of faqsToUpdate) {
        const { error: updateError } = await supabase
          .from("faqs")
          .update({ display_order: faq.display_order + 1 })
          .eq("id", faq.id);

        if (updateError) {
          console.error("Error updating FAQ display order:", updateError);
          return NextResponse.json(
            { error: updateError.message },
            { status: 500 }
          );
        }
      }
    }

    // 새 FAQ 삽입
    const { data, error } = await supabase
      .from("faqs")
      .insert([
        {
          question,
          answer,
          category: category || "",
          display_order: finalDisplayOrder,
          is_active: isActive,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error creating FAQ:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 형식 변환
    const formattedFaq = {
      id: data.id,
      question: data.question,
      answer: data.answer,
      category: data.category || "",
      displayOrder: data.display_order,
      isActive: data.is_active,
      createdAt: new Date(data.created_at).toISOString().split("T")[0],
      updatedAt: new Date(data.updated_at).toISOString().split("T")[0],
    };

    return NextResponse.json(formattedFaq, { status: 201 });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
