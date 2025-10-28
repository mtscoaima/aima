import { NextRequest, NextResponse } from 'next/server';

// 공공데이터포털 API 키 (환경변수에서 가져오기)
const SERVICE_KEY = process.env.ODCLOUD_SERVICE_KEY;

interface HolidayItem {
  dateKind: string;
  dateName: string;
  isHoliday: string;
  locdate: number;
  seq: number;
}

// 메모리 캐시 (간단한 캐싱 전략)
const cache: {
  [year: string]: {
    data: string[];
    timestamp: number;
  };
} = {};

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24시간

// Fallback 공휴일 데이터 (API 실패 시 사용)
function getFallbackHolidays(year: string): string[] {
  const holidays: { [key: string]: string[] } = {
    '2024': [
      '2024-01-01', '2024-02-09', '2024-02-10', '2024-02-11', '2024-02-12',
      '2024-03-01', '2024-04-10', '2024-05-05', '2024-05-06', '2024-05-15',
      '2024-06-06', '2024-08-15', '2024-09-16', '2024-09-17', '2024-09-18',
      '2024-10-03', '2024-10-09', '2024-12-25',
    ],
    '2025': [
      '2025-01-01', '2025-01-28', '2025-01-29', '2025-01-30',
      '2025-03-01', '2025-03-03',
      '2025-05-05', '2025-05-06', '2025-05-24',
      '2025-06-06', '2025-08-15',
      '2025-10-03', '2025-10-05', '2025-10-06', '2025-10-07', '2025-10-08', '2025-10-09',
      '2025-12-25',
    ],
    '2026': [
      '2026-01-01', '2026-02-16', '2026-02-17', '2026-02-18',
      '2026-03-01', '2026-03-02',
      '2026-05-05', '2026-05-13',
      '2026-06-06', '2026-08-15',
      '2026-09-24', '2026-09-25', '2026-09-26',
      '2026-10-03', '2026-10-05', '2026-10-09',
      '2026-12-25',
    ],
  };

  return holidays[year] || [];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year') || new Date().getFullYear().toString();
    const debug = searchParams.get('debug') === 'true';

    // 캐시 확인 (디버그 모드에서는 스킵)
    if (!debug && cache[year] && Date.now() - cache[year].timestamp < CACHE_DURATION) {
      return NextResponse.json({
        success: true,
        holidays: cache[year].data,
        source: 'cache'
      });
    }

    if (!SERVICE_KEY) {
      console.error('ODCLOUD_SERVICE_KEY not found in environment');
      console.warn('Using fallback holiday data');

      const fallbackData = getFallbackHolidays(year);

      cache[year] = {
        data: fallbackData,
        timestamp: Date.now()
      };

      return NextResponse.json({
        success: true,
        holidays: fallbackData,
        source: 'fallback',
        warning: 'API key not configured. Using fallback data.'
      });
    }

    // 공공데이터포털 API 호출
    // 주의: 이 API는 공공데이터포털에서 별도 활용신청이 필요합니다!
    // https://www.data.go.kr/data/15012690/openapi.do

    // 사업자 검증과 동일한 방식으로 API 키 인코딩
    const apiUrl = `http://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/getHoliDeInfo?serviceKey=${encodeURIComponent(SERVICE_KEY)}&solYear=${year}&numOfRows=100&_type=json`;

    console.log('Fetching holidays for year:', year);

    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      console.error('API response not OK:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error response:', errorText);
      console.error('API URL:', apiUrl.replace(encodeURIComponent(SERVICE_KEY), '***'));

      // 401 오류 시 fallback 데이터 사용
      if (response.status === 401) {
        console.warn('401 Unauthorized - API 활용신청이 필요하거나 승인 대기 중일 수 있습니다.');
        console.warn('Fallback 데이터를 사용합니다.');

        // Fallback: 연도별 공휴일 데이터
        const fallbackData = getFallbackHolidays(year);
        if (fallbackData.length > 0) {
          cache[year] = {
            data: fallbackData,
            timestamp: Date.now()
          };

          return NextResponse.json({
            success: true,
            holidays: fallbackData,
            source: 'fallback',
            warning: 'API 인증 실패로 fallback 데이터 사용. 공공데이터포털에서 API 활용신청을 확인하세요.'
          });
        }
      }

      throw new Error('Failed to fetch holidays from API');
    }

    const responseText = await response.text();
    console.log('Raw API Response (first 500 chars):', responseText.substring(0, 500));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let data: any;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse JSON:', parseError);
      throw new Error('Invalid JSON response from API');
    }

    console.log('Parsed API Response:', JSON.stringify(data, null, 2));

    // API 응답 검증
    if (!data.response) {
      console.error('No response object in API data');
      throw new Error('Invalid API response structure');
    }

    if (data.response.header?.resultCode !== '00') {
      console.error('API returned error:', data.response.header);
      throw new Error(`API Error: ${data.response.header?.resultMsg || 'Unknown error'}`);
    }

    // API 응답에서 공휴일 날짜 추출
    const holidays: string[] = [];
    const items = data.response?.body?.items?.item;

    console.log('Items from API:', items);

    if (!items || items === '') {
      console.log('No holiday items in response');
    } else if (Array.isArray(items)) {
      console.log(`Found ${items.length} holiday items (array)`);
      items.forEach((item: HolidayItem) => {
        const dateStr = item.locdate.toString();
        const formatted = `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
        console.log(`Holiday: ${item.dateName} (${item.isHoliday}) - ${formatted}`);
        holidays.push(formatted);
      });
    } else if (typeof items === 'object') {
      // 단일 항목인 경우
      console.log('Found single holiday item (object)');
      const item = items as HolidayItem;
      const dateStr = item.locdate.toString();
      const formatted = `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
      console.log(`Holiday: ${item.dateName} (${item.isHoliday}) - ${formatted}`);
      holidays.push(formatted);
    }

    console.log(`Total holidays extracted: ${holidays.length}`);

    // 캐시 저장
    cache[year] = {
      data: holidays,
      timestamp: Date.now()
    };

    return NextResponse.json({
      success: true,
      holidays,
      source: 'api',
      debug: {
        totalCount: data.response?.body?.totalCount || 0,
        itemsReceived: Array.isArray(data.response?.body?.items?.item)
          ? data.response.body.items.item.length
          : (data.response?.body?.items?.item ? 1 : 0)
      }
    });
  } catch (error) {
    console.error('Error fetching holidays:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch holiday data',
        holidays: []
      },
      { status: 500 }
    );
  }
}
