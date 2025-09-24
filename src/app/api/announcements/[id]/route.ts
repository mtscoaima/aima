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
    const { title, content, isImportant } = await request.json();
    const { id } = await params;

    if (!title || !content) {
      return NextResponse.json(
        { error: "제목과 내용이 필요합니다." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("announcements")
      .update({
        title,
        content,
        is_important: isImportant || false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating announcement:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json(
        { error: "공지사항을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 형식 변환
    const formattedAnnouncement = {
      id: data.id,
      title: data.title,
      content: data.content,
      createdAt: new Date(data.created_at).toISOString().split("T")[0],
      isImportant: data.is_important,
    };

    return NextResponse.json(formattedAnnouncement);
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "서버 내부 오류가 발생했습니다." },
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

    const { error } = await supabase
      .from("announcements")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting announcement:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: "공지사항이 성공적으로 삭제되었습니다." });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "서버 내부 오류가 발생했습니다." },
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
      .from("announcements")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching announcement:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json(
        { error: "공지사항을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 형식 변환
    const formattedAnnouncement = {
      id: data.id,
      title: data.title,
      content: data.content,
      createdAt: new Date(data.created_at).toISOString().split("T")[0],
      isImportant: data.is_important,
    };

    return NextResponse.json(formattedAnnouncement);
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "서버 내부 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
