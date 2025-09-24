import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const qYear = searchParams.get("year"); // "2023" 등

    // JSON 파일 읽기
    const jsonPath = path.join(process.cwd(), "public", "data", "nts", "index.json");
    const jsonData = await fs.readFile(jsonPath, "utf8");
    const payload = JSON.parse(jsonData);

    const years = payload.years as string[];
    const dataByYear = payload.dataByYear as Record<string, { year: string; groups: Array<{ group: string; items: Array<{ code: string; name: string; label?: string; ksic?: string }> }> }>;

    // 요청된 연도가 있고 데이터에 존재하면 해당 연도, 없으면 최신 연도 기본
    const year = qYear && dataByYear[qYear] ? qYear : years[years.length - 1];
    const data = dataByYear[year];

    return NextResponse.json(
      { years, ...data }, // { years: [...], year: "2023", groups: [...] }
      {
        headers: {
          "Cache-Control": "max-age=86400, stale-while-revalidate=604800"
        }
      }
    );
  } catch (error) {
    console.error("Failed to load NTS industry data:", error);
    return NextResponse.json(
      { error: "Failed to load industry data" },
      { status: 500 }
    );
  }
}