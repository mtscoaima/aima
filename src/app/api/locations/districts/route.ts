import { NextRequest, NextResponse } from 'next/server';
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
 * 시/군/구 목록 조회 API
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city');

    // 파라미터 검증
    if (!city) {
      return NextResponse.json(
        { error: '시/도 파라미터가 필요합니다.' },
        { status: 400 }
      );
    }

    const regionsData = loadRegionsData();

    if (!regionsData) {
      return NextResponse.json(
        { error: '지역 데이터를 찾을 수 없습니다.' },
        { status: 500 }
      );
    }

    // 해당 시/도의 시/군/구 목록 조회
    const districts = regionsData.districts[city];

    if (!districts) {
      return NextResponse.json(
        { error: `'${city}'에 해당하는 지역을 찾을 수 없습니다.` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      city,
      districts,
      metadata: {
        total: districts.length,
        updatedAt: regionsData.updatedAt,
        version: regionsData.metadata.version,
        dataSource: regionsData.metadata.dataSource
      }
    });

  } catch (error) {
    console.error('시/군/구 목록 조회 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}