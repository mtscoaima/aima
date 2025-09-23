import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

// 정적 JSON 데이터 로드
function loadRegionsData() {
  try {
    const dataPath = path.join(process.cwd(), 'public', 'data', 'regions.json');
    const jsonData = fs.readFileSync(dataPath, 'utf-8');
    return JSON.parse(jsonData);
  } catch (error) {
    console.error('지역 데이터 로드 실패:', error);
    return null;
  }
}

/**
 * 시/도 목록 조회 API
 */
export async function GET() {
  try {
    const regionsData = loadRegionsData();

    if (!regionsData) {
      return NextResponse.json(
        { error: '지역 데이터를 찾을 수 없습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      cities: regionsData.cities,
      metadata: {
        total: regionsData.cities.length,
        updatedAt: regionsData.updatedAt,
        version: regionsData.metadata.version,
        dataSource: regionsData.metadata.dataSource
      }
    });

  } catch (error) {
    console.error('시/도 목록 조회 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}