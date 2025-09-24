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
 * 읍/면/동 목록 조회 API
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city');
    const district = searchParams.get('district');
    const subdistrict = searchParams.get('subdistrict'); // 경기도 수원시 장안구 같은 경우

    // 파라미터 검증
    if (!city || !district) {
      return NextResponse.json(
        { error: '시/도와 시/군/구 파라미터가 필요합니다.' },
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

    // 동 정보 조회를 위한 키 생성
    let dongKey;
    if (subdistrict) {
      // 3층 구조: 경기도_수원시_장안구
      dongKey = `${city}_${district}_${subdistrict}`;
    } else {
      // 2층 구조: 서울특별시_강남구
      dongKey = `${city}_${district}`;
    }

    let dongs = regionsData.dongs[dongKey];

    if (!dongs) {
      // 혹시 다른 키 패턴도 시도해보기
      const alternativeKeys = [
        `${city}_${district}`,
        `${city}_${district}_${subdistrict}`.replace('__', '_')
      ].filter(Boolean);

      let foundDongs = null;
      let usedKey = null;

      for (const key of alternativeKeys) {
        if (regionsData.dongs[key]) {
          foundDongs = regionsData.dongs[key];
          usedKey = key;
          break;
        }
      }

      if (!foundDongs) {
        return NextResponse.json(
          {
            error: `'${city} ${district}${subdistrict ? ' ' + subdistrict : ''}'에 해당하는 동 정보를 찾을 수 없습니다.`
          },
          { status: 404 }
        );
      }

      dongs = foundDongs;
      dongKey = usedKey;
    }

    // 'all' 옵션을 맨 앞에 추가
    const dongsWithAll = ['all', ...dongs];

    return NextResponse.json({
      city,
      district,
      subdistrict: subdistrict || null,
      dongs: dongsWithAll,
      metadata: {
        total: dongsWithAll.length,
        realTotal: dongs.length, // 'all' 제외한 실제 동 개수
        updatedAt: regionsData.updatedAt,
        version: regionsData.metadata.version,
        dataSource: regionsData.metadata.dataSource,
        dongKey
      }
    });

  } catch (error) {
    console.error('읍/면/동 목록 조회 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}