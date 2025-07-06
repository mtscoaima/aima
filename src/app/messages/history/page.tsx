"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  Plus,
  Trash2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { AdvertiserGuardWithDisabled } from "@/components/RoleGuard";
import { useAuth } from "@/contexts/AuthContext";
import "./styles.css";

interface Template {
  id: string;
  name: string;
  code: string;
  sendingProfile: string;
  reviewStatus: "등록" | "승인" | "반려" | "검수중";
  templateStatus: "대기(발송전)" | "정상" | "반려";
  createdAt: string;
}

interface Campaign {
  id: string;
  name: string;
  period: string;
  location: string;
  reviewStatus: "등록" | "승인" | "반려" | "검수중";
  campaignStatus: "대기(발송전)" | "정상" | "반려";
  isActive: boolean;
  createdAt: string;
}

// 실제 Supabase Campaign 타입 정의
interface RealCampaign {
  id: number;
  user_id: number;
  name: string;
  description?: string;
  status:
    | "DRAFT"
    | "PENDING_APPROVAL"
    | "APPROVED"
    | "REJECTED"
    | "ACTIVE"
    | "PAUSED"
    | "COMPLETED"
    | "CANCELLED";
  total_recipients: number;
  sent_count: number;
  success_count: number;
  failed_count: number;
  budget?: number;
  actual_cost?: number;
  created_at: string;
  updated_at: string;
  target_criteria: Record<string, unknown>;
  message_template: string;
  schedule_start_date?: string;
  schedule_end_date?: string;
  schedule_send_time_start?: string;
  schedule_send_time_end?: string;
  message_templates?: {
    name: string;
    content: string;
    image_url: string;
  };
}

export default function MessageHistoryPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<
    "템플릿 관리" | "캠페인 관리" | "캠페인 현황"
  >("캠페인 현황");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  const [realCampaigns, setRealCampaigns] = useState<RealCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // 체크박스 상태 관리
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isAllSelected, setIsAllSelected] = useState(false);

  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // 필터 상태
  const [filters, setFilters] = useState({
    templateStatus:
      activeTab === "캠페인 현황" || activeTab === "캠페인 관리"
        ? "캠페인상태"
        : "템플릿상태",
    reviewStatus: "검수상태",
    dateFilter: "전체기간",
    searchFilter: "검색항목",
  });

  // 실제 Campaign 데이터 로드 함수
  const loadRealCampaigns = useCallback(async () => {
    if (!user) return;

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        console.error("토큰이 없습니다.");
        return;
      }

      const response = await fetch("/api/campaigns", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRealCampaigns(data.campaigns || []);
      } else {
        console.error("캠페인 데이터 로드 실패:", response.statusText);
      }
    } catch (error) {
      console.error("캠페인 데이터 로드 오류:", error);
    }
  }, [user]);

  // 탭별 필터링 옵션 정의
  const getFilterOptions = () => {
    switch (activeTab) {
      case "템플릿 관리":
        return {
          statusLabel: "템플릿상태",
          statusOptions: [
            { value: "템플릿상태", label: "템플릿상태" },
            { value: "대기(발송전)", label: "대기(발송전)" },
            { value: "정상", label: "정상" },
            { value: "반려", label: "반려" },
          ],
          dateOptions: [],
          searchOptions: [
            { value: "검색항목", label: "검색항목" },
            { value: "템플릿명", label: "템플릿명" },
            { value: "템플릿코드", label: "템플릿코드" },
            { value: "발신프로필", label: "발신프로필" },
          ],
          placeholder: "템플릿 이름 또는 코드",
        };
      case "캠페인 관리":
        return {
          statusLabel: "캠페인상태",
          statusOptions: [
            { value: "캠페인상태", label: "캠페인상태" },
            { value: "대기(발송전)", label: "대기(발송전)" },
            { value: "정상", label: "정상" },
            { value: "반려", label: "반려" },
          ],
          dateOptions: [],
          searchOptions: [
            { value: "검색항목", label: "검색항목" },
            { value: "캠페인명", label: "캠페인명" },
            { value: "고객", label: "고객" },
            { value: "유효기간", label: "유효기간" },
          ],
          placeholder: "캠페인 이름 또는 고객",
        };
      case "캠페인 현황":
        return {
          statusLabel: "캠페인상태",
          statusOptions: [
            { value: "캠페인상태", label: "캠페인상태" },
            { value: "PENDING_APPROVAL", label: "승인대기" },
            { value: "APPROVED", label: "승인완료" },
            { value: "REJECTED", label: "승인거부" },
            { value: "ACTIVE", label: "진행중" },
            { value: "PAUSED", label: "일시정지" },
            { value: "COMPLETED", label: "완료" },
            { value: "CANCELLED", label: "취소" },
          ],
          dateOptions: [
            { value: "전체기간", label: "전체기간" },
            { value: "오늘", label: "오늘" },
            { value: "최근 7일", label: "최근 7일" },
            { value: "최근 30일", label: "최근 30일" },
            { value: "최근 3개월", label: "최근 3개월" },
          ],
          searchOptions: [
            { value: "검색항목", label: "검색항목" },
            { value: "캠페인명", label: "캠페인명" },
            { value: "설명", label: "설명" },
            { value: "예산", label: "예산" },
          ],
          placeholder: "캠페인 이름 또는 설명",
        };
      default:
        return {
          statusLabel: "템플릿상태",
          statusOptions: [
            { value: "템플릿상태", label: "템플릿상태" },
            { value: "대기(발송전)", label: "대기(발송전)" },
            { value: "정상", label: "정상" },
            { value: "반려", label: "반려" },
          ],
          dateOptions: [],
          searchOptions: [
            { value: "검색항목", label: "검색항목" },
            { value: "템플릿명", label: "템플릿명" },
            { value: "템플릿코드", label: "템플릿코드" },
            { value: "발신프로필", label: "발신프로필" },
          ],
          placeholder: "템플릿 이름 또는 코드",
        };
    }
  };

  const filterOptions = getFilterOptions();

  // 필터링된 데이터 가져오기 함수
  const getFilteredData = useCallback((): (
    | Template
    | Campaign
    | RealCampaign
  )[] => {
    let data: (Template | Campaign | RealCampaign)[] = [];

    switch (activeTab) {
      case "템플릿 관리":
        data = templates;
        break;
      case "캠페인 관리":
        data = campaigns;
        break;
      case "캠페인 현황":
        data = realCampaigns;
        break;
      default:
        data = [];
    }

    // 상태 필터링
    if (
      filters.templateStatus !== "템플릿상태" &&
      filters.templateStatus !== "캠페인상태"
    ) {
      if (activeTab === "캠페인 현황") {
        // 캠페인 현황 탭의 상태 필터링
        data = data.filter((item) => {
          const realCampaign = item as RealCampaign;
          return realCampaign.status === filters.templateStatus;
        });
      } else {
        // 템플릿 관리, 캠페인 관리 탭의 상태 필터링
        data = data.filter((item) => {
          if (activeTab === "캠페인 관리") {
            const campaign = item as Campaign;
            return campaign.campaignStatus === filters.templateStatus;
          } else {
            const template = item as Template;
            return template.templateStatus === filters.templateStatus;
          }
        });
      }
    }

    // 검수상태 필터링 (캠페인 현황 제외)
    if (filters.reviewStatus !== "검수상태" && activeTab !== "캠페인 현황") {
      data = data.filter((item) => {
        const itemWithReview = item as Template | Campaign;
        return itemWithReview.reviewStatus === filters.reviewStatus;
      });
    }

    // 생성일 필터링 (캠페인 현황만)
    if (filters.dateFilter !== "전체기간" && activeTab === "캠페인 현황") {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      data = data.filter((item) => {
        const realCampaign = item as RealCampaign;
        const createdDate = new Date(realCampaign.created_at);
        const createdDateOnly = new Date(
          createdDate.getFullYear(),
          createdDate.getMonth(),
          createdDate.getDate()
        );

        switch (filters.dateFilter) {
          case "오늘":
            return createdDateOnly.getTime() === today.getTime();
          case "최근 7일":
            const sevenDaysAgo = new Date(today);
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            return createdDateOnly >= sevenDaysAgo;
          case "최근 30일":
            const thirtyDaysAgo = new Date(today);
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            return createdDateOnly >= thirtyDaysAgo;
          case "최근 3개월":
            const threeMonthsAgo = new Date(today);
            threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
            return createdDateOnly >= threeMonthsAgo;
          default:
            return true;
        }
      });
    }

    // 검색어 필터링
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      data = data.filter((item) => {
        switch (filters.searchFilter) {
          case "템플릿명":
          case "캠페인명":
            return item.name?.toLowerCase().includes(searchLower);
          case "템플릿코드":
            const template = item as Template;
            return template.code?.toLowerCase().includes(searchLower);
          case "발신프로필":
            const templateWithProfile = item as Template;
            return templateWithProfile.sendingProfile
              ?.toLowerCase()
              .includes(searchLower);
          case "고객":
            const campaign = item as Campaign;
            return campaign.location?.toLowerCase().includes(searchLower);
          case "유효기간":
            const campaignWithPeriod = item as Campaign;
            return campaignWithPeriod.period
              ?.toLowerCase()
              .includes(searchLower);
          case "설명":
            const realCampaign = item as RealCampaign;
            return realCampaign.description
              ?.toLowerCase()
              .includes(searchLower);
          case "예산":
            const campaignWithBudget = item as RealCampaign;
            return campaignWithBudget.budget?.toString().includes(searchLower);
          default:
            // 전체 검색
            if (activeTab === "템플릿 관리") {
              const template = item as Template;
              return (
                template.name?.toLowerCase().includes(searchLower) ||
                template.code?.toLowerCase().includes(searchLower) ||
                template.sendingProfile?.toLowerCase().includes(searchLower)
              );
            } else if (activeTab === "캠페인 관리") {
              const campaign = item as Campaign;
              return (
                campaign.name?.toLowerCase().includes(searchLower) ||
                campaign.location?.toLowerCase().includes(searchLower) ||
                campaign.period?.toLowerCase().includes(searchLower)
              );
            } else {
              const realCampaign = item as RealCampaign;
              return (
                realCampaign.name?.toLowerCase().includes(searchLower) ||
                realCampaign.description?.toLowerCase().includes(searchLower) ||
                realCampaign.budget?.toString().includes(searchLower)
              );
            }
        }
      });
    }

    return data;
  }, [activeTab, templates, campaigns, realCampaigns, filters, searchTerm]);

  // 체크박스 관련 함수
  const handleSelectAll = useCallback(() => {
    const currentData = getFilteredData();
    if (isAllSelected) {
      setSelectedItems(new Set());
      setIsAllSelected(false);
    } else {
      const allIds = new Set(currentData.map((item) => item.id.toString()));
      setSelectedItems(allIds);
      setIsAllSelected(true);
    }
  }, [getFilteredData, isAllSelected]);

  const handleItemSelect = useCallback(
    (itemId: string) => {
      const newSelectedItems = new Set(selectedItems);
      if (newSelectedItems.has(itemId)) {
        newSelectedItems.delete(itemId);
      } else {
        newSelectedItems.add(itemId);
      }
      setSelectedItems(newSelectedItems);

      // 전체 선택 상태 업데이트
      const currentData = getFilteredData();
      setIsAllSelected(
        newSelectedItems.size === currentData.length && currentData.length > 0
      );
    },
    [selectedItems, getFilteredData]
  );

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // 캠페인 현황 탭에서는 실제 데이터 로드
        if (activeTab === "캠페인 현황") {
          await loadRealCampaigns();
        } else {
          // 다른 탭들은 기존 mock 데이터 사용
          await new Promise((resolve) => setTimeout(resolve, 1000));

          // 템플릿 관리 데이터
          const mockTemplates: Template[] = [
            {
              id: "1",
              name: "제휴 업체",
              code: "Template_001",
              sendingProfile: "@MTSCO",
              reviewStatus: "등록",
              templateStatus: "대기(발송전)",
              createdAt: "2025-01-15",
            },
            {
              id: "2",
              name: "50% 쿠폰 행사",
              code: "Template_001",
              sendingProfile: "@MTSCO",
              reviewStatus: "승인",
              templateStatus: "정상",
              createdAt: "2025-01-15",
            },
            {
              id: "3",
              name: "50% 쿠폰 행사",
              code: "Template_001",
              sendingProfile: "@MTSCO",
              reviewStatus: "반려",
              templateStatus: "반려",
              createdAt: "2025-01-15",
            },
            {
              id: "4",
              name: "50% 쿠폰 행사",
              code: "Template_001",
              sendingProfile: "@MTSCO",
              reviewStatus: "검수중",
              templateStatus: "정상",
              createdAt: "2025-01-15",
            },
          ];

          // 캠페인 관리 데이터
          const mockCampaigns: Campaign[] = [
            {
              id: "1",
              name: "비지흠 오픈 할인행사",
              period: "2025-06-09 ~ 2025-09-09",
              location: "남성/25-44/서울시 강남구",
              reviewStatus: "등록",
              campaignStatus: "대기(발송전)",
              isActive: true,
              createdAt: "2025-01-15",
            },
            {
              id: "2",
              name: "카페 아메리카노 할인",
              period: "2025-06-09 ~ 2025-09-09",
              location: "전체/전체/서울시 강동구",
              reviewStatus: "승인",
              campaignStatus: "정상",
              isActive: true,
              createdAt: "2025-01-15",
            },
            {
              id: "3",
              name: "업체 할인 쿠폰",
              period: "2025-06-09 ~ 2025-09-09",
              location: "여성/20-24/서울시 마포구",
              reviewStatus: "반려",
              campaignStatus: "반려",
              isActive: false,
              createdAt: "2025-01-15",
            },
            {
              id: "4",
              name: "인버가구 할인장",
              period: "2025-06-09 ~ 2025-09-09",
              location: "전체/65이상/서울시 종로구",
              reviewStatus: "검수중",
              campaignStatus: "정상",
              isActive: false,
              createdAt: "2025-01-15",
            },
          ];

          setTemplates(mockTemplates);
          setCampaigns(mockCampaigns);
        }
      } catch (error) {
        console.error("데이터 로드 실패:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [activeTab, user, loadRealCampaigns]);

  // Campaign 상태를 UI 표시용으로 변환
  const getCampaignStatusDisplay = (status: RealCampaign["status"]) => {
    switch (status) {
      case "PENDING_APPROVAL":
        return "승인대기";
      case "APPROVED":
        return "승인완료";
      case "REJECTED":
        return "승인거부";
      case "ACTIVE":
        return "진행중";
      case "PAUSED":
        return "일시정지";
      case "COMPLETED":
        return "완료";
      case "CANCELLED":
        return "취소";
      case "DRAFT":
        return "임시저장";
      default:
        return status;
    }
  };

  // Campaign 상태에 따른 CSS 클래스 반환
  const getCampaignStatusClass = (status: RealCampaign["status"]) => {
    switch (status) {
      case "PENDING_APPROVAL":
        return "campaign-pending";
      case "APPROVED":
        return "campaign-approved";
      case "REJECTED":
        return "campaign-rejected";
      case "ACTIVE":
        return "campaign-active";
      case "PAUSED":
        return "campaign-paused";
      case "COMPLETED":
        return "campaign-completed";
      case "CANCELLED":
        return "campaign-cancelled";
      case "DRAFT":
        return "campaign-draft";
      default:
        return "campaign-unknown";
    }
  };

  const getStatusColor = (
    status: string,
    type: "review" | "template" | "campaign"
  ) => {
    if (type === "review") {
      switch (status) {
        case "등록":
          return "review-registered";
        case "승인":
          return "review-approved";
        case "반려":
          return "review-rejected";
        case "검수중":
          return "review-reviewing";
        default:
          return "review-registered";
      }
    } else if (type === "template") {
      switch (status) {
        case "대기(발송전)":
          return "template-waiting";
        case "정상":
          return "template-normal";
        case "반려":
          return "template-rejected";
        default:
          return "template-waiting";
      }
    } else if (type === "campaign") {
      switch (status) {
        case "대기(발송전)":
          return "campaign-waiting";
        case "정상":
          return "campaign-normal";
        case "반려":
          return "campaign-rejected";
        default:
          return "campaign-waiting";
      }
    }
    return "";
  };

  const getActionButtons = (
    item: Template | Campaign,
    type: "template" | "campaign"
  ) => {
    const { reviewStatus } = item;

    if (type === "template") {
      if (reviewStatus === "등록") {
        return (
          <>
            <button className="action-btn btn-review-request">검수요청</button>
            <button className="action-btn btn-secondary">수정</button>
          </>
        );
      } else if (reviewStatus === "승인") {
        return (
          <>
            <button className="action-btn btn-approval-result">
              승인 결과보기
            </button>
            <button className="action-btn btn-secondary">송신 취소</button>
          </>
        );
      } else if (reviewStatus === "반려") {
        return (
          <>
            <button className="action-btn btn-rejection-result">
              반려 결과보기
            </button>
            <button className="action-btn btn-review-request">
              검수 재요청
            </button>
          </>
        );
      } else if (reviewStatus === "검수중") {
        return (
          <button className="action-btn btn-secondary">검수 요청 취소</button>
        );
      }
    } else if (type === "campaign") {
      if (reviewStatus === "등록") {
        return (
          <>
            <button className="action-btn btn-review-request">검수요청</button>
            <button className="action-btn btn-secondary">수정</button>
          </>
        );
      } else if (reviewStatus === "승인") {
        return (
          <>
            <button className="action-btn btn-approval-result">
              승인 결과보기
            </button>
            <button className="action-btn btn-secondary">송신 취소</button>
          </>
        );
      } else if (reviewStatus === "반려") {
        return (
          <>
            <button className="action-btn btn-rejection-result">
              반려 결과보기
            </button>
            <button className="action-btn btn-review-request">
              검수 재요청
            </button>
          </>
        );
      } else if (reviewStatus === "검수중") {
        return (
          <button className="action-btn btn-secondary">검수 요청 취소</button>
        );
      }
    }

    return null;
  };

  const getCurrentData = () => {
    return getFilteredData();
  };

  // 페이지네이션 로직
  const allData = getCurrentData();
  const totalPages = Math.ceil(allData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = allData.slice(startIndex, endIndex);

  // 탭 변경 시 페이지 초기화 및 필터 리셋
  useEffect(() => {
    setCurrentPage(1);
    setFilters({
      templateStatus:
        activeTab === "캠페인 현황" || activeTab === "캠페인 관리"
          ? "캠페인상태"
          : "템플릿상태",
      reviewStatus: "검수상태",
      dateFilter: "전체기간",
      searchFilter: "검색항목",
    });
    setSearchTerm("");
    // 체크박스 상태 리셋
    setSelectedItems(new Set());
    setIsAllSelected(false);
  }, [activeTab]);

  // 필터링된 데이터 변경 시 체크박스 상태 업데이트
  useEffect(() => {
    const filteredData = getFilteredData();
    const currentSelectedIds = new Set(
      [...selectedItems].filter((id) =>
        filteredData.some(
          (item: Template | Campaign | RealCampaign) =>
            item.id.toString() === id
        )
      )
    );

    // 선택된 항목이 실제로 변경된 경우만 상태 업데이트
    if (
      currentSelectedIds.size !== selectedItems.size ||
      [...currentSelectedIds].some((id) => !selectedItems.has(id))
    ) {
      setSelectedItems(currentSelectedIds);
    }

    // 전체 선택 상태 업데이트
    const shouldBeAllSelected =
      currentSelectedIds.size === filteredData.length &&
      filteredData.length > 0;
    if (isAllSelected !== shouldBeAllSelected) {
      setIsAllSelected(shouldBeAllSelected);
    }
  }, [getFilteredData, selectedItems, isAllSelected]);

  // 페이지네이션 번호 생성
  const getPageNumbers = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, "...");
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push("...", totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  const renderTableHeaders = () => {
    switch (activeTab) {
      case "템플릿 관리":
        return (
          <>
            <div className="header-cell">
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={handleSelectAll}
              />
            </div>
            <div className="header-cell">템플릿 이름</div>
            <div className="header-cell">템플릿 코드</div>
            <div className="header-cell">발신 프로필</div>
            <div className="header-cell">검수상태</div>
            <div className="header-cell">템플릿 상태</div>
            <div className="header-cell">관리</div>
          </>
        );
      case "캠페인 관리":
        return (
          <>
            <div className="header-cell">
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={handleSelectAll}
              />
            </div>
            <div className="header-cell">사용여부</div>
            <div className="header-cell">캠페인 이름</div>
            <div className="header-cell">유효기간</div>
            <div className="header-cell">고객</div>
            <div className="header-cell">검수상태</div>
            <div className="header-cell">캠페인 상태</div>
            <div className="header-cell">관리</div>
          </>
        );
      case "캠페인 현황":
        return (
          <>
            <div className="header-cell">캠페인 이름</div>
            <div className="header-cell">설명</div>
            <div className="header-cell">상태</div>
            <div className="header-cell">대상자 수</div>
            <div className="header-cell">발송 완료</div>
            <div className="header-cell">예산</div>
            <div className="header-cell">생성일</div>
          </>
        );
      default:
        return null;
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderTableRow = (item: any) => {
    switch (activeTab) {
      case "템플릿 관리":
        return (
          <div key={item.id} className="table-row">
            <div className="table-cell">
              <input
                type="checkbox"
                checked={selectedItems.has(item.id.toString())}
                onChange={() => handleItemSelect(item.id.toString())}
              />
            </div>
            <div className="table-cell">{item.name}</div>
            <div className="table-cell">{item.code}</div>
            <div className="table-cell">{item.sendingProfile}</div>
            <div className="table-cell">
              <span
                className={`status-text ${getStatusColor(
                  item.reviewStatus,
                  "review"
                )}`}
              >
                {item.reviewStatus}
              </span>
            </div>
            <div className="table-cell">
              <span
                className={`status-text ${getStatusColor(
                  item.templateStatus,
                  "template"
                )}`}
              >
                {item.templateStatus}
              </span>
            </div>
            <div className="table-cell">
              <div className="action-buttons-cell">
                {getActionButtons(item, "template")}
              </div>
            </div>
          </div>
        );
      case "캠페인 관리":
        return (
          <div key={item.id} className="table-row">
            <div className="table-cell">
              <input
                type="checkbox"
                checked={selectedItems.has(item.id.toString())}
                onChange={() => handleItemSelect(item.id.toString())}
              />
            </div>
            <div className="table-cell">
              <div className="toggle-switch">
                <div
                  className={`toggle-status ${item.isActive ? "on" : "off"}`}
                >
                  {item.isActive ? "ON" : "OFF"}
                </div>
                <div className="toggle-slider"></div>
              </div>
            </div>
            <div className="table-cell">{item.name}</div>
            <div className="table-cell">{item.period}</div>
            <div className="table-cell">{item.location}</div>
            <div className="table-cell">
              <span
                className={`status-text ${getStatusColor(
                  item.reviewStatus,
                  "review"
                )}`}
              >
                {item.reviewStatus}
              </span>
            </div>
            <div className="table-cell">
              <span
                className={`status-text ${getStatusColor(
                  item.campaignStatus,
                  "campaign"
                )}`}
              >
                {item.campaignStatus}
              </span>
            </div>
            <div className="table-cell">
              <div className="action-buttons-cell">
                {getActionButtons(item, "campaign")}
              </div>
            </div>
          </div>
        );
      case "캠페인 현황":
        const realCampaign = item as RealCampaign;
        return (
          <div key={realCampaign.id} className="table-row">
            <div className="table-cell">{realCampaign.name}</div>
            <div className="table-cell">{realCampaign.description || "-"}</div>
            <div className="table-cell">
              <span
                className={`status-text ${getCampaignStatusClass(
                  realCampaign.status
                )}`}
              >
                {getCampaignStatusDisplay(realCampaign.status)}
              </span>
            </div>
            <div className="table-cell">
              {realCampaign.total_recipients.toLocaleString()}
            </div>
            <div className="table-cell">
              {realCampaign.sent_count.toLocaleString()}
            </div>
            <div className="table-cell">
              {realCampaign.budget
                ? `₩${realCampaign.budget.toLocaleString()}`
                : "-"}
            </div>
            <div className="table-cell">
              {new Date(realCampaign.created_at).toLocaleDateString("ko-KR")}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <AdvertiserGuardWithDisabled>
      <div className="message-history-container">
        <div className="message-history-content">
          <div className="history-header">
            <h1>발송현황</h1>
            <p>발송 현황에 대한 안내 문구가 들어갑니다.</p>
          </div>

          <div className="history-content">
            {/* 탭 메뉴 */}
            <div className="history-tabs">
              <button
                className={`tab-button ${
                  activeTab === "캠페인 현황" ? "active" : ""
                }`}
                onClick={() => setActiveTab("캠페인 현황")}
              >
                캠페인 현황
              </button>
              <button
                className={`tab-button ${
                  activeTab === "캠페인 관리" ? "active" : ""
                }`}
                onClick={() => setActiveTab("캠페인 관리")}
              >
                캠페인 관리
              </button>
              <button
                className={`tab-button ${
                  activeTab === "템플릿 관리" ? "active" : ""
                }`}
                onClick={() => setActiveTab("템플릿 관리")}
              >
                템플릿 관리
              </button>
            </div>

            {/* 필터 및 액션 버튼 섹션 */}
            <div className="filter-section">
              <div className="filter-and-actions">
                <div className="filter-left">
                  <div className="filter-dropdowns">
                    <div className="dropdown-group">
                      <select
                        className="filter-dropdown"
                        value={filters.templateStatus}
                        onChange={(e) =>
                          setFilters({
                            ...filters,
                            templateStatus: e.target.value,
                          })
                        }
                      >
                        {filterOptions.statusOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="dropdown-icon" size={16} />
                    </div>

                    {activeTab === "캠페인 현황" ? (
                      <div className="dropdown-group">
                        <select
                          className="filter-dropdown"
                          value={filters.dateFilter}
                          onChange={(e) =>
                            setFilters({
                              ...filters,
                              dateFilter: e.target.value,
                            })
                          }
                        >
                          {filterOptions.dateOptions?.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="dropdown-icon" size={16} />
                      </div>
                    ) : (
                      <div className="dropdown-group">
                        <select
                          className="filter-dropdown"
                          value={filters.reviewStatus}
                          onChange={(e) =>
                            setFilters({
                              ...filters,
                              reviewStatus: e.target.value,
                            })
                          }
                        >
                          <option value="검수상태">검수상태</option>
                          <option value="등록">등록</option>
                          <option value="승인">승인</option>
                          <option value="반려">반려</option>
                          <option value="검수중">검수중</option>
                        </select>
                        <ChevronDown className="dropdown-icon" size={16} />
                      </div>
                    )}

                    <div className="dropdown-group">
                      <select
                        className="filter-dropdown"
                        value={filters.searchFilter}
                        onChange={(e) =>
                          setFilters({
                            ...filters,
                            searchFilter: e.target.value,
                          })
                        }
                      >
                        {filterOptions.searchOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="dropdown-icon" size={16} />
                    </div>
                  </div>

                  <div className="search-group">
                    <input
                      type="text"
                      className="search-input"
                      placeholder={filterOptions.placeholder}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Search className="search-icon" size={16} />
                  </div>
                </div>

                {activeTab !== "캠페인 현황" && (
                  <div className="action-buttons-right">
                    <button className="action-btn primary">
                      <Plus size={16} />
                      {activeTab === "템플릿 관리"
                        ? "템플릿 만들기"
                        : activeTab === "캠페인 관리"
                        ? "캠페인 만들기"
                        : "템플릿 만들기"}
                    </button>
                    <button className="action-btn secondary">
                      <Trash2 size={16} />
                      {activeTab === "템플릿 관리"
                        ? "템플릿 삭제"
                        : activeTab === "캠페인 관리"
                        ? "캠페인 삭제"
                        : "템플릿 삭제"}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 테이블 */}
            <div
              className={`table-container ${
                activeTab === "캠페인 현황" ? "campaign-status-tab" : ""
              }`}
            >
              <div className="table-header">{renderTableHeaders()}</div>

              {isLoading ? (
                <div className="loading-container">
                  <div className="loading-spinner"></div>
                  <div className="loading-text">
                    <p>목록을 불러오는 중...</p>
                  </div>
                </div>
              ) : allData.length === 0 ? (
                <div className="empty-container">
                  <div className="empty-message">목록이 없습니다.</div>
                </div>
              ) : (
                <div className="table-body">
                  {currentData.map((item) => renderTableRow(item))}
                </div>
              )}
            </div>

            {/* 페이지네이션 */}
            {allData.length > itemsPerPage && (
              <div className="pagination-container">
                <div className="pagination-info">
                  총 {allData.length}개 중 {startIndex + 1}-
                  {Math.min(endIndex, allData.length)}개 표시
                </div>
                <div className="pagination-controls">
                  <button
                    className="pagination-btn prev"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft size={16} />
                  </button>

                  <div className="pagination-numbers">
                    {getPageNumbers().map((page, index) => (
                      <React.Fragment key={index}>
                        {page === "..." ? (
                          <span className="pagination-ellipsis">...</span>
                        ) : (
                          <button
                            className={`pagination-btn ${
                              page === currentPage ? "active" : ""
                            }`}
                            onClick={() => setCurrentPage(page as number)}
                          >
                            {page}
                          </button>
                        )}
                      </React.Fragment>
                    ))}
                  </div>

                  <button
                    className="pagination-btn next"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdvertiserGuardWithDisabled>
  );
}
