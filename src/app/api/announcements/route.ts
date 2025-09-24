import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;

    // 전체 개수 가져오기
    const { count, error: countError } = await supabase
      .from("announcements")
      .select("*", { count: "exact", head: true });

    if (countError) {
      console.error("Error counting announcements:", countError);
      return NextResponse.json({ error: countError.message }, { status: 500 });
    }

    // 페이지네이션된 데이터 가져오기
    const { data: announcements, error } = await supabase
      .from("announcements")
      .select("*")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Error fetching announcements:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 데이터 형식을 프론트엔드에서 기대하는 형식으로 변환
    const formattedAnnouncements =
      announcements?.map((announcement) => ({
        id: announcement.id,
        title: announcement.title,
        content: announcement.content,
        createdAt: new Date(announcement.created_at)
          .toISOString()
          .split("T")[0], // YYYY-MM-DD 형식
        isImportant: announcement.is_important,
      })) || [];

    const totalPages = Math.ceil((count || 0) / limit);

    return NextResponse.json({
      announcements: formattedAnnouncements,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: count || 0,
        limit,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "서버 내부 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { title, content, isImportant } = await request.json();

    if (!title || !content) {
      return NextResponse.json(
        { error: "제목과 내용이 필요합니다." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("announcements")
      .insert([
        {
          title,
          content,
          is_important: isImportant || false,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error creating announcement:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 형식 변환
    const formattedAnnouncement = {
      id: data.id,
      title: data.title,
      content: data.content,
      createdAt: new Date(data.created_at).toISOString().split("T")[0],
      isImportant: data.is_important,
    };

    return NextResponse.json(formattedAnnouncement, { status: 201 });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "서버 내부 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
