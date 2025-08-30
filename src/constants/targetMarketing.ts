// 템플릿 카테고리 목록
export const TEMPLATE_CATEGORIES = [
  "카페/식음료",
  "뷰티/미용", 
  "패션/의류",
  "음식점/요식업",
  "병원/의료",
  "학원/교육",
  "IT/소프트웨어",
  "부동산",
  "여행/관광",
  "스포츠/레저",
  "자동차",
  "금융/보험",
  "기타"
] as const;

// 이미지 편집 키워드 목록
export const IMAGE_EDIT_KEYWORDS = [
  "수정",
  "편집",
  "바꿔",
  "변경",
  "바꾸",
  "바꿔줘",
  "바꿔주세요",
  "색깔",
  "색상",
  "배경",
  "크기",
  "위치",
  "추가",
  "제거",
  "삭제",
  "더 크게",
  "더 작게",
  "밝게",
  "어둡게",
  "다른 색",
  "다른 배경",
] as const;

// 파일 업로드 관련 상수들
export const FILE_CONSTRAINTS = {
  // 일반 파일 업로드 허용 타입 (채팅 첨부용)
  ALLOWED_FILE_TYPES: [
    "image/jpeg",
    "image/jpg", 
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
    "text/plain",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ] as const,
  
  // 템플릿 이미지 업로드 허용 타입
  ALLOWED_IMAGE_TYPES: [
    "image/jpeg",
    "image/jpg", 
    "image/png",
    "image/gif"
  ] as const,
  
  // 파일 크기 제한 (바이트 단위)
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_IMAGE_SIZE: 300 * 1024, // 300KB
} as const;

// 캠페인 관련 상수들
export const CAMPAIGN_CONSTANTS = {
  // 캠페인 건당 금액 (크레딧)
  COST_PER_ITEM: 100,
  
  // 기본값들
  DEFAULT_MAX_RECIPIENTS: "30",
  DEFAULT_TARGET_COUNT: 500,
  DEFAULT_AD_RECIPIENT_COUNT: 30,
  DEFAULT_CARD_AMOUNT: "10000",
  DEFAULT_CUSTOM_AMOUNT: "50",
  DEFAULT_CARD_AMOUNT_INPUT: "1",
  DEFAULT_START_TIME: "08:00",
  DEFAULT_END_TIME: "18:00",
};

// 차등 단가 설정
export const PRICING_STEPS = {
  base: 100, // 기본단가
  increments: {
    location: 50, // 가맹점/카드 사용 위치
    gender: 50,   // 고객 성별
    age: 50,      // 고객 나이대
    amount: 50,   // 승인금액 필터
    industry: 50, // 카드 사용 업종
    carouselFirst: 100, // RCS 캐러셀 첫번째 노출 (옵션)
  },
} as const;

// 시간 관련 상수들
export const TIME_CONSTANTS = {
  HOURS_IN_DAY: 24,
  // 유효기간 설정 기본값 (일수)
  DEFAULT_VALIDITY_DAYS: 7,
} as const;

// 텍스트 길이 제한
export const TEXT_LIMITS = {
  TEMPLATE_TITLE_MAX: 20,
  SMS_CONTENT_MAX: 100,
  BUTTON_TEXT_MAX: 8,
  TEMPLATE_NAME_MAX: 50,
} as const;

// 동적 버튼 제한
export const BUTTON_CONSTRAINTS = {
  MAX_BUTTONS: 2,
};

// 에러 메시지들
export const ERROR_MESSAGES = {
  FILE_SIZE_EXCEEDED: "파일 크기는 10MB 이하로 선택해주세요.",
  UNSUPPORTED_FILE_TYPE: "지원하지 않는 파일 형식입니다.",
  IMAGE_SIZE_EXCEEDED: "파일 크기가 너무 큽니다.",
  UNSUPPORTED_IMAGE_TYPE: "지원하지 않는 파일 형식입니다.\n허용된 형식: JPG, JPEG, PNG, GIF",
  INVALID_URL: "유효하지 않은 URL입니다.",
  WEB_LINK_REQUIRED: "웹링크 주소를 입력해주세요.",
  APP_LINK_REQUIRED: "iOS 또는 Android 링크 중 하나는 입력해주세요.",
  LOGIN_REQUIRED: "로그인이 필요합니다.",
  INSUFFICIENT_CREDITS: "크레딧이 부족합니다. 크레딧을 충전해주세요.",
  TEMPLATE_CONTENT_REQUIRED: "저장할 템플릿 내용이 없습니다.",
  TEMPLATE_NAME_REQUIRED: "템플릿 이름을 입력해주세요.",
  CATEGORY_REQUIRED: "카테고리를 선택해주세요.",
  CAMPAIGN_CONTENT_REQUIRED: "캠페인 내용과 이미지가 필요합니다.",
  TEMPLATE_GENERATION_REQUIRED: "템플릿 내용을 먼저 생성해주세요.",
  NO_PACKAGES_AVAILABLE: "사용 가능한 패키지가 없습니다.",
} as const;

// 성공 메시지들
export const SUCCESS_MESSAGES = {
  TEMPLATE_SAVED: "템플릿이 성공적으로 저장되었습니다!",
  CAMPAIGN_LOADED: "캠페인이 성공적으로 불러와졌습니다.",
  TEMPLATE_LOADED: "템플릿이 성공적으로 불러와졌습니다.",
  PAYMENT_COMPLETED: "결제가 완료되었습니다. 크레딧이 충전되었습니다.",
} as const;
