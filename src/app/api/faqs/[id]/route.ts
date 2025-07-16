import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { question, answer, category, displayOrder, isActive } =
      await request.json();
    const { id } = await params;

    if (!question || !answer) {
      return NextResponse.json(
        { error: "Question and answer are required" },
        { status: 400 }
      );
    }

    // 기존 FAQ 정보 조회
    const { data: existingFaq, error: fetchError } = await supabase
      .from("faqs")
      .select("display_order")
      .eq("id", id)
      .single();

    if (fetchError) {
      console.error("Error fetching existing FAQ:", fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!existingFaq) {
      return NextResponse.json({ error: "FAQ not found" }, { status: 404 });
    }

    const oldOrder = existingFaq.display_order;
    const newOrder = displayOrder;

    // 순서가 변경된 경우에만 순서 조정 로직 실행
    if (oldOrder !== newOrder) {
      if (newOrder > oldOrder) {
        // 순서를 뒤로 이동하는 경우: oldOrder+1 ~ newOrder 범위의 FAQ들을 -1씩 감소
        const { data: faqsToUpdate, error: fetchError } = await supabase
          .from("faqs")
          .select("id, display_order")
          .gt("display_order", oldOrder)
          .lte("display_order", newOrder)
          .neq("id", id);

        if (fetchError) {
          console.error("Error fetching FAQs for order update:", fetchError);
          return NextResponse.json(
            { error: fetchError.message },
            { status: 500 }
          );
        }

        if (faqsToUpdate && faqsToUpdate.length > 0) {
          for (const faq of faqsToUpdate) {
            const { error: updateError } = await supabase
              .from("faqs")
              .update({ display_order: faq.display_order - 1 })
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
      } else {
        // 순서를 앞으로 이동하는 경우: newOrder ~ oldOrder-1 범위의 FAQ들을 +1씩 증가
        const { data: faqsToUpdate, error: fetchError } = await supabase
          .from("faqs")
          .select("id, display_order")
          .gte("display_order", newOrder)
          .lt("display_order", oldOrder)
          .neq("id", id);

        if (fetchError) {
          console.error("Error fetching FAQs for order update:", fetchError);
          return NextResponse.json(
            { error: fetchError.message },
            { status: 500 }
          );
        }

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
      }
    }

    // FAQ 업데이트
    const { data, error } = await supabase
      .from("faqs")
      .update({
        question,
        answer,
        category: category || "",
        display_order: displayOrder,
        is_active: isActive,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating FAQ:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "FAQ not found" }, { status: 404 });
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

    return NextResponse.json(formattedFaq);
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 삭제할 FAQ의 순서 정보 조회
    const { data: faqToDelete, error: fetchError } = await supabase
      .from("faqs")
      .select("display_order")
      .eq("id", id)
      .single();

    if (fetchError) {
      console.error("Error fetching FAQ to delete:", fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!faqToDelete) {
      return NextResponse.json({ error: "FAQ not found" }, { status: 404 });
    }

    const deletedOrder = faqToDelete.display_order;

    // FAQ 삭제
    const { error: deleteError } = await supabase
      .from("faqs")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("Error deleting FAQ:", deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    // 삭제된 FAQ의 순서보다 큰 순서를 가진 FAQ들을 조회
    const { data: faqsToUpdate, error: fetchUpdateError } = await supabase
      .from("faqs")
      .select("id, display_order")
      .gt("display_order", deletedOrder)
      .order("display_order", { ascending: true });

    if (fetchUpdateError) {
      console.error("Error fetching FAQs for order update:", fetchUpdateError);
      return NextResponse.json(
        { error: fetchUpdateError.message },
        { status: 500 }
      );
    }

    // 해당 FAQ들의 순서를 -1씩 감소
    if (faqsToUpdate && faqsToUpdate.length > 0) {
      for (const faq of faqsToUpdate) {
        const { error: updateError } = await supabase
          .from("faqs")
          .update({ display_order: faq.display_order - 1 })
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

    return NextResponse.json({ message: "FAQ deleted successfully" });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data, error } = await supabase
      .from("faqs")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching FAQ:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "FAQ not found" }, { status: 404 });
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

    return NextResponse.json(formattedFaq);
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
