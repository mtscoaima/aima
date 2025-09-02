// 도시명 매핑 (영어 -> 한글)
export const cityMap: { [key: string]: string } = {
  'seoul': '서울',
  'busan': '부산', 
  'daegu': '대구',
  'incheon': '인천',
  'gwangju': '광주',
  'daejeon': '대전',
  'ulsan': '울산',
  'sejong': '세종',
  'gyeonggi': '경기',
  'gangwon': '강원',
  'chungbuk': '충북',
  'chungnam': '충남',
  'jeonbuk': '전북',
  'jeonnam': '전남',
  'gyeongbuk': '경북',
  'gyeongnam': '경남',
  'jeju': '제주'
};

// 구/군/시 매핑 (영어 -> 한글)
export const districtMap: { [key: string]: string } = {
  // 공통
  'all': '전체',
  
  // 서울특별시 (25개 구)
  'gangnam': '강남구',
  'gangdong': '강동구', 
  'gangbuk': '강북구',
  'gangseo': '강서구',
  'gwanak': '관악구',
  'gwangjin': '광진구',
  'guro': '구로구',
  'geumcheon': '금천구',
  'nowon': '노원구',
  'dobong': '도봉구',
  'dongdaemun': '동대문구',
  'dongjak': '동작구',
  'mapo': '마포구',
  'seodaemun': '서대문구',
  'seocho': '서초구',
  'seongdong': '성동구',
  'seongbuk': '성북구',
  'songpa': '송파구',
  'yangcheon': '양천구',
  'yeongdeungpo': '영등포구',
  'yongsan': '용산구',
  'eunpyeong': '은평구',
  'jongno': '종로구',
  'jung': '중구',
  'jungnang': '중랑구',

  // 부산광역시 (16개 구/군)
  'busanjin': '부산진구',
  'dong': '동구',
  'nam': '남구',
  'buk': '북구',
  'saha': '사하구',
  'sasang': '사상구',
  'seo': '서구',
  'yeonje': '연제구',
  'haeundae': '해운대구',
  'suyeong': '수영구',
  'geumjeong': '금정구',
  'gijang': '기장군',
  'dongnae': '동래구',
  'yeongdo': '영도구',

  // 대구광역시 (8개 구/군)
  'jung_daegu': '중구',
  'dong_daegu': '동구',
  'seo_daegu': '서구',
  'nam_daegu': '남구',
  'buk_daegu': '북구',
  'suseong': '수성구',
  'dalseo': '달서구',
  'dalseong': '달성군',

  // 인천광역시 (10개 구/군)
  'jung_incheon': '중구',
  'dong_incheon': '동구',
  'michuhol': '미추홀구',
  'yeonsu': '연수구',
  'namdong': '남동구',
  'bupyeong': '부평구',
  'gyeyang': '계양구',
  'seo_incheon': '서구',
  'ganghwa': '강화군',
  'ongjin': '옹진군',

  // 광주광역시 (5개 구)
  'dong_gwangju': '동구',
  'seo_gwangju': '서구',
  'nam_gwangju': '남구',
  'buk_gwangju': '북구',
  'gwangsan': '광산구',

  // 대전광역시 (5개 구)
  'jung_daejeon': '중구',
  'dong_daejeon': '동구',
  'seo_daejeon': '서구',
  'yuseong': '유성구',
  'daedeok': '대덕구',

  // 울산광역시 (5개 구/군)
  'jung_ulsan': '중구',
  'nam_ulsan': '남구',
  'dong_ulsan': '동구',
  'buk_ulsan': '북구',
  'ulju': '울주군',

  // 세종특별자치시
  'sejong_city': '세종시',

  // 경기도 (31개 시/군)
  'suwon': '수원시',
  'seongnam': '성남시',
  'goyang': '고양시',
  'yongin': '용인시',
  'bucheon': '부천시',
  'ansan': '안산시',
  'anyang': '안양시',
  'namyangju': '남양주시',
  'hwaseong': '화성시',
  'pyeongtaek': '평택시',
  'uijeongbu': '의정부시',
  'siheung': '시흥시',
  'paju': '파주시',
  'gwangmyeong': '광명시',
  'gunpo': '군포시',
  'osan': '오산시',
  'hanam': '하남시',
  'icheon': '이천시',
  'anseong': '안성시',
  'gimpo': '김포시',
  'yangju': '양주시',
  'dongducheon': '동두천시',
  'gwacheon': '과천시',
  'guri': '구리시',
  'pocheon': '포천시',
  'yeoncheon': '연천군',
  'gapyeong': '가평군',
  'yangpyeong': '양평군',
  'uiwang': '의왕시',
  'gwangju_gyeonggi': '광주시',
  'yeoju': '여주시',

  // 강원도 (19개 시/군)
  'chuncheon': '춘천시',
  'wonju': '원주시',
  'gangneung': '강릉시',
  'donghae': '동해시',
  'taebaek': '태백시',
  'sokcho': '속초시',
  'samcheok': '삼척시',
  'hongcheon': '홍천군',
  'hoengseong': '횡성군',
  'yeongwol': '영월군',
  'pyeongchang': '평창군',
  'jeongseon': '정선군',
  'cheorwon': '철원군',
  'hwacheon': '화천군',
  'yanggu': '양구군',
  'inje': '인제군',
  'goseong_gangwon': '고성군',
  'yangyang': '양양군',

  // 충청북도 (11개 시/군)
  'cheongju': '청주시',
  'chungju': '충주시',
  'jecheon': '제천시',
  'boeun': '보은군',
  'okcheon': '옥천군',
  'yeongdong': '영동군',
  'jeungpyeong': '증평군',
  'jincheon': '진천군',
  'goesan': '괴산군',
  'eumseong': '음성군',
  'danyang': '단양군',

  // 충청남도 (15개 시/군)
  'cheonan': '천안시',
  'gongju': '공주시',
  'boryeong': '보령시',
  'asan': '아산시',
  'seosan': '서산시',
  'nonsan': '논산시',
  'gyeryong': '계룡시',
  'dangjin': '당진시',
  'geumsan': '금산군',
  'buyeo': '부여군',
  'seocheon': '서천군',
  'cheongyang': '청양군',
  'hongseong': '홍성군',
  'yesan': '예산군',
  'taean': '태안군',

  // 전라북도 (14개 시/군)
  'jeonju': '전주시',
  'gunsan': '군산시',
  'iksan': '익산시',
  'jeongeup': '정읍시',
  'namwon': '남원시',
  'gimje': '김제시',
  'wanju': '완주군',
  'jinan': '진안군',
  'muju': '무주군',
  'jangsu': '장수군',
  'imsil': '임실군',
  'sunchang': '순창군',
  'gochang': '고창군',
  'buan': '부안군',

  // 전라남도 (22개 시/군)
  'mokpo': '목포시',
  'yeosu': '여수시',
  'suncheon': '순천시',
  'naju': '나주시',
  'gwangyang': '광양시',
  'damyang': '담양군',
  'gokseong': '곡성군',
  'gurye': '구례군',
  'goheung': '고흥군',
  'boseong': '보성군',
  'hwasun': '화순군',
  'jangheung': '장흥군',
  'gangjin': '강진군',
  'haenam': '해남군',
  'yeongam': '영암군',
  'muan': '무안군',
  'hampyeong': '함평군',
  'yeonggwang': '영광군',
  'jangseong': '장성군',
  'wando': '완도군',
  'jindo': '진도군',
  'sinan': '신안군',

  // 경상북도 (23개 시/군)
  'pohang': '포항시',
  'gyeongju': '경주시',
  'gimcheon': '김천시',
  'andong': '안동시',
  'gumi': '구미시',
  'yeongju': '영주시',
  'yeongcheon': '영천시',
  'sangju': '상주시',
  'mungyeong': '문경시',
  'gyeongsan': '경산시',
  'gunwi': '군위군',
  'uiseong': '의성군',
  'cheongsong': '청송군',
  'yeongyang': '영양군',
  'yeongdeok': '영덕군',
  'cheongdo': '청도군',
  'goryeong': '고령군',
  'seongju': '성주군',
  'chilgok': '칠곡군',
  'yecheon': '예천군',
  'bonghwa': '봉화군',
  'uljin': '울진군',
  'ulleung': '울릉군',

  // 경상남도 (18개 시/군)
  'changwon': '창원시',
  'jinju': '진주시',
  'tongyeong': '통영시',
  'sacheon': '사천시',
  'gimhae': '김해시',
  'miryang': '밀양시',
  'geoje': '거제시',
  'yangsan': '양산시',
  'uiryeong': '의령군',
  'haman': '함안군',
  'changnyeong': '창녕군',
  'goseong_gyeongnam': '고성군',
  'namhae': '남해군',
  'hadong': '하동군',
  'sancheong': '산청군',
  'hamyang': '함양군',
  'geochang': '거창군',
  'hapcheon': '합천군',

  // 제주특별자치도 (2개 시)
  'jeju_city': '제주시',
  'seogwipo': '서귀포시'
};

/**
 * 위치 정보를 한글로 변환하는 함수
 * @param locations - target_locations_detailed 배열
 * @returns 한글로 변환된 위치 문자열
 */
export const formatLocations = (locations: Array<{ city: string; districts: string[] } | string>): string => {
  if (!locations || locations.length === 0) {
    return '전국';
  }

  return locations.map((loc) => {
    if (typeof loc === 'string') {
      return loc === 'all' ? '전국' : cityMap[loc.toLowerCase()] || loc;
    } else if (typeof loc === 'object' && loc.city && loc.districts) {
      const cityName = cityMap[loc.city.toLowerCase()] || loc.city;
      const districtNames = loc.districts.map((district: string) => {
        if (district === 'all') return '전체';
        return districtMap[district.toLowerCase()] || district;
      });
      
      // 도/시 구분하여 표시
      if (districtNames.includes('전체')) {
        return `${cityName} 전체`;
      } else {
        return `${cityName} ${districtNames.join(', ')}`;
      }
    }
    return '';
  }).filter(Boolean).join(', ');
};

/**
 * 단일 도시명을 한글로 변환
 */
export const getCityName = (cityCode: string): string => {
  return cityMap[cityCode.toLowerCase()] || cityCode;
};

/**
 * 단일 구/군명을 한글로 변환  
 */
export const getDistrictName = (districtCode: string): string => {
  return districtMap[districtCode.toLowerCase()] || districtCode;
};