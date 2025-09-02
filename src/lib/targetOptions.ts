export interface TargetOption {
  value: string;
  label: string;
}

export interface TargetOptions {
  gender: TargetOption[];
  age: TargetOption[];
  cities: TargetOption[];
  districts: TargetOption[];
  topLevelIndustries: TargetOption[];
  industries: TargetOption[];
  cardAmounts: TargetOption[];
  timePeriods: TargetOption[];
}

// CSV 데이터 기반 도시 목록 (전체 옵션 포함)
export const citiesData: TargetOption[] = [
  { value: "all", label: "전체" },
  { value: "seoul", label: "서울특별시" },
  { value: "busan", label: "부산광역시" },
  { value: "daegu", label: "대구광역시" },
  { value: "incheon", label: "인천광역시" },
  { value: "gwangju", label: "광주광역시" },
  { value: "daejeon", label: "대전광역시" },
  { value: "ulsan", label: "울산광역시" },
  { value: "sejong", label: "세종특별자치시" },
  { value: "gyeonggi", label: "경기도" },
  { value: "gangwon", label: "강원특별자치도" },
  { value: "chungbuk", label: "충청북도" },
  { value: "chungnam", label: "충청남도" },
  { value: "jeonbuk", label: "전라북도" },
  { value: "jeonnam", label: "전라남도" },
  { value: "gyeongbuk", label: "경상북도" },
  { value: "gyeongnam", label: "경상남도" },
  { value: "jeju", label: "제주특별자치도" }
];

// CSV 데이터 기반 구/군 목록 (도시별 분류)
export const districtsData: Record<string, TargetOption[]> = {
  all: [{ value: "all", label: "전체" }],
  seoul: [
    { value: "all", label: "전체" },
    { value: "jongno", label: "종로구" },
    { value: "jung", label: "중구" },
    { value: "yongsan", label: "용산구" },
    { value: "seongdong", label: "성동구" },
    { value: "gwangjin", label: "광진구" },
    { value: "dongdaemun", label: "동대문구" },
    { value: "jungnang", label: "중랑구" },
    { value: "seongbuk", label: "성북구" },
    { value: "gangbuk", label: "강북구" },
    { value: "dobong", label: "도봉구" },
    { value: "nowon", label: "노원구" },
    { value: "eunpyeong", label: "은평구" },
    { value: "seodaemun", label: "서대문구" },
    { value: "mapo", label: "마포구" },
    { value: "yangcheon", label: "양천구" },
    { value: "gangseo", label: "강서구" },
    { value: "guro", label: "구로구" },
    { value: "geumcheon", label: "금천구" },
    { value: "yeongdeungpo", label: "영등포구" },
    { value: "dongjak", label: "동작구" },
    { value: "gwanak", label: "관악구" },
    { value: "seocho", label: "서초구" },
    { value: "gangnam", label: "강남구" },
    { value: "songpa", label: "송파구" },
    { value: "gangdong", label: "강동구" }
  ],
  busan: [
    { value: "all", label: "전체" },
    { value: "jung", label: "중구" },
    { value: "seo", label: "서구" },
    { value: "dong", label: "동구" },
    { value: "yeongdo", label: "영도구" },
    { value: "busanjin", label: "부산진구" },
    { value: "dongnae", label: "동래구" },
    { value: "nam", label: "남구" },
    { value: "buk", label: "북구" },
    { value: "haeundae", label: "해운대구" },
    { value: "saha", label: "사하구" },
    { value: "geumjeong", label: "금정구" },
    { value: "gangseo", label: "강서구" },
    { value: "yeonje", label: "연제구" },
    { value: "suyeong", label: "수영구" },
    { value: "sasang", label: "사상구" },
    { value: "gijang", label: "기장군" }
  ],
  daegu: [
    { value: "all", label: "전체" },
    { value: "jung", label: "중구" },
    { value: "dong", label: "동구" },
    { value: "seo", label: "서구" },
    { value: "nam", label: "남구" },
    { value: "buk", label: "북구" },
    { value: "suseong", label: "수성구" },
    { value: "dalseo", label: "달서구" },
    { value: "dalseong", label: "달성군" }
  ],
  incheon: [
    { value: "all", label: "전체" },
    { value: "jung", label: "중구" },
    { value: "dong", label: "동구" },
    { value: "michuhol", label: "미추홀구" },
    { value: "yeonsu", label: "연수구" },
    { value: "namdong", label: "남동구" },
    { value: "bupyeong", label: "부평구" },
    { value: "gyeyang", label: "계양구" },
    { value: "seo", label: "서구" },
    { value: "ganghwa", label: "강화군" },
    { value: "ongjin", label: "옹진군" }
  ],
  gwangju: [
    { value: "all", label: "전체" },
    { value: "dong", label: "동구" },
    { value: "seo", label: "서구" },
    { value: "nam", label: "남구" },
    { value: "buk", label: "북구" },
    { value: "gwangsan", label: "광산구" }
  ],
  daejeon: [
    { value: "all", label: "전체" },
    { value: "dong", label: "동구" },
    { value: "jung", label: "중구" },
    { value: "seo", label: "서구" },
    { value: "yuseong", label: "유성구" },
    { value: "daedeok", label: "대덕구" }
  ],
  ulsan: [
    { value: "all", label: "전체" },
    { value: "jung", label: "중구" },
    { value: "nam", label: "남구" },
    { value: "dong", label: "동구" },
    { value: "buk", label: "북구" },
    { value: "ulju", label: "울주군" }
  ],
  sejong: [
    { value: "all", label: "전체" },
    { value: "sejong", label: "세종특별자치시" }
  ],
  gyeonggi: [
    { value: "all", label: "전체" },
    { value: "suwon", label: "수원시" },
    { value: "seongnam", label: "성남시" },
    { value: "uijeongbu", label: "의정부시" },
    { value: "anyang", label: "안양시" },
    { value: "bucheon", label: "부천시" },
    { value: "gwangmyeong", label: "광명시" },
    { value: "pyeongtaek", label: "평택시" },
    { value: "dongducheon", label: "동두천시" },
    { value: "ansan", label: "안산시" },
    { value: "goyang", label: "고양시" },
    { value: "gwacheon", label: "과천시" },
    { value: "guri", label: "구리시" },
    { value: "namyangju", label: "남양주시" },
    { value: "osan", label: "오산시" },
    { value: "siheung", label: "시흥시" },
    { value: "gunpo", label: "군포시" },
    { value: "uiwang", label: "의왕시" },
    { value: "hanam", label: "하남시" },
    { value: "yongin", label: "용인시" },
    { value: "paju", label: "파주시" },
    { value: "icheon", label: "이천시" },
    { value: "anseong", label: "안성시" },
    { value: "gimpo", label: "김포시" },
    { value: "hwaseong", label: "화성시" },
    { value: "gwangju", label: "광주시" },
    { value: "yangju", label: "양주시" },
    { value: "pocheon", label: "포천시" },
    { value: "yeoju", label: "여주시" },
    { value: "yeoncheon", label: "연천군" },
    { value: "gapyeong", label: "가평군" },
    { value: "yangpyeong", label: "양평군" }
  ],
  gangwon: [
    { value: "all", label: "전체" },
    { value: "chuncheon", label: "춘천시" },
    { value: "wonju", label: "원주시" },
    { value: "gangneung", label: "강릉시" },
    { value: "donghae", label: "동해시" },
    { value: "taebaek", label: "태백시" },
    { value: "sokcho", label: "속초시" },
    { value: "samcheok", label: "삼척시" },
    { value: "hongcheon", label: "홍천군" },
    { value: "hoengseong", label: "횡성군" },
    { value: "yeongwol", label: "영월군" },
    { value: "pyeongchang", label: "평창군" },
    { value: "jeongseon", label: "정선군" },
    { value: "cheorwon", label: "철원군" },
    { value: "hwacheon", label: "화천군" },
    { value: "yanggu", label: "양구군" },
    { value: "inje", label: "인제군" },
    { value: "goseong", label: "고성군" },
    { value: "yangyang", label: "양양군" }
  ],
  chungbuk: [
    { value: "all", label: "전체" },
    { value: "cheongju", label: "청주시" },
    { value: "chungju", label: "충주시" },
    { value: "jecheon", label: "제천시" },
    { value: "boeun", label: "보은군" },
    { value: "okcheon", label: "옥천군" },
    { value: "yeongdong", label: "영동군" },
    { value: "jeungpyeong", label: "증평군" },
    { value: "jincheon", label: "진천군" },
    { value: "goesan", label: "괴산군" },
    { value: "eumseong", label: "음성군" },
    { value: "danyang", label: "단양군" }
  ],
  chungnam: [
    { value: "all", label: "전체" },
    { value: "cheonan", label: "천안시" },
    { value: "gongju", label: "공주시" },
    { value: "boryeong", label: "보령시" },
    { value: "asan", label: "아산시" },
    { value: "seosan", label: "서산시" },
    { value: "nonsan", label: "논산시" },
    { value: "gyeryong", label: "계룡시" },
    { value: "dangjin", label: "당진시" },
    { value: "geumsan", label: "금산군" },
    { value: "buyeo", label: "부여군" },
    { value: "seocheon", label: "서천군" },
    { value: "cheongyang", label: "청양군" },
    { value: "hongseong", label: "홍성군" },
    { value: "yesan", label: "예산군" },
    { value: "taean", label: "태안군" }
  ],
  jeonbuk: [
    { value: "all", label: "전체" },
    { value: "jeonju", label: "전주시" },
    { value: "gunsan", label: "군산시" },
    { value: "iksan", label: "익산시" },
    { value: "jeongeup", label: "정읍시" },
    { value: "namwon", label: "남원시" },
    { value: "gimje", label: "김제시" },
    { value: "wanju", label: "완주군" },
    { value: "jinan", label: "진안군" },
    { value: "muju", label: "무주군" },
    { value: "jangsu", label: "장수군" },
    { value: "imsil", label: "임실군" },
    { value: "sunchang", label: "순창군" },
    { value: "gochang", label: "고창군" },
    { value: "buan", label: "부안군" }
  ],
  jeonnam: [
    { value: "all", label: "전체" },
    { value: "mokpo", label: "목포시" },
    { value: "yeosu", label: "여수시" },
    { value: "suncheon", label: "순천시" },
    { value: "naju", label: "나주시" },
    { value: "gwangyang", label: "광양시" },
    { value: "damyang", label: "담양군" },
    { value: "gokseong", label: "곡성군" },
    { value: "gurye", label: "구례군" },
    { value: "goheung", label: "고흥군" },
    { value: "boseong", label: "보성군" },
    { value: "hwasun", label: "화순군" },
    { value: "jangheung", label: "장흥군" },
    { value: "gangjin", label: "강진군" },
    { value: "haenam", label: "해남군" },
    { value: "yeongam", label: "영암군" },
    { value: "muan", label: "무안군" },
    { value: "hampyeong", label: "함평군" },
    { value: "yeonggwang", label: "영광군" },
    { value: "jangseong", label: "장성군" },
    { value: "wando", label: "완도군" },
    { value: "jindo", label: "진도군" },
    { value: "sinan", label: "신안군" }
  ],
  gyeongbuk: [
    { value: "all", label: "전체" },
    { value: "pohang", label: "포항시" },
    { value: "gyeongju", label: "경주시" },
    { value: "gimcheon", label: "김천시" },
    { value: "andong", label: "안동시" },
    { value: "gumi", label: "구미시" },
    { value: "yeongju", label: "영주시" },
    { value: "yeongcheon", label: "영천시" },
    { value: "sangju", label: "상주시" },
    { value: "mungyeong", label: "문경시" },
    { value: "gyeongsan", label: "경산시" },
    { value: "gunwi", label: "군위군" },
    { value: "uiseong", label: "의성군" },
    { value: "cheongsong", label: "청송군" },
    { value: "yeongyang", label: "영양군" },
    { value: "yeongdeok", label: "영덕군" },
    { value: "cheongdo", label: "청도군" },
    { value: "goryeong", label: "고령군" },
    { value: "seongju", label: "성주군" },
    { value: "chilgok", label: "칠곡군" },
    { value: "yecheon", label: "예천군" },
    { value: "bonghwa", label: "봉화군" },
    { value: "uljin", label: "울진군" },
    { value: "ulleung", label: "울릉군" }
  ],
  gyeongnam: [
    { value: "all", label: "전체" },
    { value: "changwon", label: "창원시" },
    { value: "jinju", label: "진주시" },
    { value: "tongyeong", label: "통영시" },
    { value: "sacheon", label: "사천시" },
    { value: "gimhae", label: "김해시" },
    { value: "miryang", label: "밀양시" },
    { value: "geoje", label: "거제시" },
    { value: "yangsan", label: "양산시" },
    { value: "uiryeong", label: "의령군" },
    { value: "haman", label: "함안군" },
    { value: "changnyeong", label: "창녕군" },
    { value: "goseong", label: "고성군" },
    { value: "namhae", label: "남해군" },
    { value: "hadong", label: "하동군" },
    { value: "sancheong", label: "산청군" },
    { value: "hamyang", label: "함양군" },
    { value: "geochang", label: "거창군" },
    { value: "hapcheon", label: "합천군" }
  ],
  jeju: [
    { value: "all", label: "전체" },
    { value: "jeju", label: "제주시" },
    { value: "seogwipo", label: "서귀포시" }
  ]
};

// API에서 업종 데이터를 가져오는 함수들
export const fetchTopLevelIndustries = async (): Promise<TargetOption[]> => {
  try {
    const response = await fetch('/api/industries');
    const data = await response.json();
    return data.topLevelIndustries || [{ value: "all", label: "전체" }];
  } catch (error) {
    console.error('상위 업종 조회 오류:', error);
    return [{ value: "all", label: "전체" }];
  }
};

export const fetchIndustriesByTopLevel = async (topLevelCode: string): Promise<TargetOption[]> => {
  if (topLevelCode === "all") {
    return [{ value: "all", label: "전체" }];
  }
  
  try {
    const response = await fetch(`/api/industries?top_level_code=${topLevelCode}`);
    const data = await response.json();
    return data.industries || [{ value: "all", label: "전체" }];
  } catch (error) {
    console.error('세부 업종 조회 오류:', error);
    return [{ value: "all", label: "전체" }];
  }
};

// 선택된 도시에 따른 구/군 목록 반환 함수
export const getDistrictsByCity = (cityValue: string): TargetOption[] => {
  if (cityValue === "all") {
    // 전체 선택 시 모든 구/군의 전체 옵션만 반환
    return [{ value: "all", label: "전체" }];
  }
  return districtsData[cityValue] || [{ value: "all", label: "전체" }];
};

// 선택된 상위 업종에 따른 세부 업종 목록 반환 함수 (동기식 - 레거시 지원)
export const getIndustriesByTopLevel = (topLevelCode: string): TargetOption[] => {
  if (topLevelCode === "all") {
    return [{ value: "all", label: "전체" }];
  }
  // 동적 데이터를 위해서는 fetchIndustriesByTopLevel 함수를 사용하세요
  return [{ value: "all", label: "전체" }];
};

// 타겟 추천 결과 옵션들
export const targetOptions: TargetOptions = {
  gender: [
    { value: "all", label: "전체" },
    { value: "female", label: "여성" },
    { value: "male", label: "남성" },
  ],
  age: [
    { value: "all", label: "전체" },
    { value: "teens", label: "10대" },
    { value: "twenties", label: "20대" },
    { value: "thirties", label: "30대" },
    { value: "forties", label: "40대" },
    { value: "fifties", label: "50대+" }
  ],
  cities: citiesData,
  districts: [{ value: "all", label: "전체" }], // 기본값, 실제로는 getDistrictsByCity 함수 사용
  topLevelIndustries: [{ value: "all", label: "전체" }], // fetchTopLevelIndustries()로 동적 로딩
  industries: [{ value: "all", label: "전체" }], // fetchIndustriesByTopLevel()로 동적 로딩
  cardAmounts: [
    { value: "10000", label: "1만원 미만" },
    { value: "50000", label: "5만원 미만" },
    { value: "100000", label: "10만원 미만" },
    { value: "custom", label: "직접 입력" },
    { value: "all", label: "전체" }
  ],
  timePeriods: [
    { value: "오전", label: "오전" },
    { value: "오후", label: "오후" },
    { value: "전체", label: "전체" }
  ]
};

// 시간 옵션 생성 함수
export const generateTimeOptions = (period: string): TargetOption[] => {
  const options: TargetOption[] = [];
  let startHour = 0;
  let endHour = 23;

  if (period === "오전") {
    startHour = 0;
    endHour = 12;
  } else if (period === "오후") {
    startHour = 12;
    endHour = 23;
  }

  for (let hour = startHour; hour <= endHour; hour++) {
    const hourStr = hour.toString().padStart(2, "0");
    options.push({
      value: `${hourStr}:00`,
      label: `${hourStr}:00`
    });
  }

  return options;
};

// 일괄발송 시간 옵션 생성 함수
export const generateBatchTimeOptions = (): TargetOption[] => {
  const options: TargetOption[] = [];

  for (let hour = 0; hour < 24; hour++) {
    const hourStr = hour.toString().padStart(2, "0");
    options.push({
      value: `${hourStr}:00`,
      label: `${hourStr}:00`
    });
  }

  return options;
};

// 일괄발송 날짜 옵션
export const batchSendDateOptions: TargetOption[] = [
  { value: "오늘+3일", label: "오늘+3일" },
  { value: "오늘+7일", label: "오늘+7일" },
  { value: "오늘+14일", label: "오늘+14일" }
];

// 금액 표시 함수
export const getAmountDisplayText = (amount: string, customAmount?: string): string => {
  switch (amount) {
    case "10000":
      return "1만원";
    case "50000":
      return "5만원";
    case "100000":
      return "10만원";
    case "custom":
      return customAmount ? `${customAmount}만원` : "직접 입력";
    case "all":
      return "전체";
    default:
      return "1만원";
  }
}; 