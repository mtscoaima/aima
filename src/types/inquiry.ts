// 문의 시스템 관련 타입 정의

export type InquiryCategory =
  | "AI_TARGET_MARKETING"
  | "PRICING"
  | "CHARGING"
  | "LOGIN"
  | "USER_INFO"
  | "MESSAGE"
  | "SEND_RESULT"
  | "OTHER";

export type InquiryStatus = "PENDING" | "ANSWERED" | "CLOSED";

// 문의 카테고리 한글 매핑
export const INQUIRY_CATEGORY_LABELS: Record<InquiryCategory, string> = {
  AI_TARGET_MARKETING: "AI 타깃마케팅",
  PRICING: "요금제",
  CHARGING: "충전",
  LOGIN: "로그인",
  USER_INFO: "회원정보",
  MESSAGE: "문자",
  SEND_RESULT: "발송결과",
  OTHER: "기타",
};

// 문의 상태 한글 매핑
export const INQUIRY_STATUS_LABELS: Record<InquiryStatus, string> = {
  PENDING: "접수완료",
  ANSWERED: "답변완료",
  CLOSED: "종료",
};

// 기본 문의 인터페이스
export interface Inquiry {
  id: number;
  user_id: number;
  category: InquiryCategory;
  title: string;
  content: string;
  contact_phone: string;
  sms_notification: boolean;
  status: InquiryStatus;
  created_at: string;
  updated_at: string;
}

// 첨부파일 인터페이스
export interface InquiryAttachment {
  id: number;
  inquiry_id: number;
  file_name: string;
  file_path: string;
  file_size: number;
  content_type: string;
  created_at: string;
}

// 답변 인터페이스
export interface InquiryReply {
  id: number;
  inquiry_id: number;
  admin_id: number | null;
  content: string;
  created_at: string;
}

// 상세 문의 (첨부파일, 답변 포함)
export interface InquiryDetail extends Inquiry {
  attachments: InquiryAttachment[];
  replies: InquiryReply[];
  user?: {
    id: number;
    name: string;
    email: string;
  };
  admin?: {
    id: number;
    name: string;
  };
}

// 문의 등록 요청 데이터
export interface CreateInquiryRequest {
  category: InquiryCategory;
  title: string;
  content: string;
  sms_notification: boolean;
  attachments?: File[];
}

// 문의 수정 요청 데이터
export interface UpdateInquiryRequest {
  category?: InquiryCategory;
  title?: string;
  content?: string;
  contact_phone?: string;
  sms_notification?: boolean;
  attachments?: File[];
  removeAttachmentIds?: number[];
}

// 답변 등록 요청 데이터
export interface CreateReplyRequest {
  content: string;
}

// 문의 목록 조회 요청 파라미터
export interface InquiryListParams {
  page?: number;
  limit?: number;
  category?: InquiryCategory;
  status?: InquiryStatus;
  search?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: "created_at" | "updated_at" | "status";
  sortOrder?: "asc" | "desc";
}

// 문의 목록 응답 데이터
export interface InquiryListResponse {
  inquiries: Inquiry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  filters: {
    category?: InquiryCategory;
    status?: InquiryStatus;
    search?: string;
    startDate?: string;
    endDate?: string;
  };
}

// API 응답 기본 구조
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

// 파일 업로드 응답
export interface FileUploadResponse {
  id: number;
  file_name: string;
  file_path: string;
  file_size: number;
  content_type: string;
  url: string;
}

// 파일 업로드 제한 설정
export const FILE_UPLOAD_CONFIG = {
  maxSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: [
    "image/jpeg",
    "image/jpg",
    "image/gif",
    "image/png",
    "image/bmp",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // docx
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // xlsx
    "application/vnd.ms-excel", // xls
    "text/csv",
    "application/pdf",
  ],
  allowedExtensions: [
    ".jpg",
    ".jpeg",
    ".gif",
    ".png",
    ".bmp",
    ".docx",
    ".xlsx",
    ".xls",
    ".csv",
    ".pdf",
  ],
};

// 문의 통계 인터페이스
export interface InquiryStats {
  totalInquiries: number;
  pendingInquiries: number;
  answeredInquiries: number;
  closedInquiries: number;
  categoryStats: Record<InquiryCategory, number>;
  recentInquiries: Inquiry[];
}

// 폼 유효성 검사 에러
export interface InquiryFormErrors {
  category?: string;
  title?: string;
  content?: string;
  contact_phone?: string;
  attachments?: string;
}

// 문의 폼 상태
export interface InquiryFormState {
  data: Partial<CreateInquiryRequest>;
  errors: InquiryFormErrors;
  isSubmitting: boolean;
  isValid: boolean;
}

// 관리자용 문의 필터
export interface AdminInquiryFilters extends InquiryListParams {
  userId?: number;
  adminId?: number;
  hasReply?: boolean;
  urgency?: "high" | "medium" | "low";
}

// 문의 알림 설정
export interface InquiryNotificationSettings {
  smsEnabled: boolean;
  emailEnabled: boolean;
  notifyOnReply: boolean;
  notifyOnStatusChange: boolean;
}

// 문의 내보내기 옵션
export interface InquiryExportOptions {
  format: "excel" | "csv" | "pdf";
  dateRange?: {
    start: string;
    end: string;
  };
  categories?: InquiryCategory[];
  statuses?: InquiryStatus[];
  includeAttachments?: boolean;
  includeReplies?: boolean;
}
