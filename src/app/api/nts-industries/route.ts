import { NextRequest, NextResponse } from "next/server";
import payload from "@/public/data/nts/index.json";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const qYear = searchParams.get("year"); // "2023" 등

  const years = (payload as any).years as string[];
  const dataByYear = (payload as any).dataByYear as Record<string, any>;

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
}