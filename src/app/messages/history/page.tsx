"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Trash2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { AdvertiserGuardWithDisabled } from "@/components/RoleGuard";
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

interface CampaignStatus {
  id: string;
  name: string;
  code: string;
  sendingProfile: string;
  reviewStatus: "등록" | "승인" | "반려" | "검수중";
  templateStatus: "대기(발송전)" | "정상" | "반려";
  createdAt: string;
}

export default function MessageHistoryPage() {
  const [activeTab, setActiveTab] = useState<
    "템플릿 관리" | "캠페인 관리" | "캠페인 현황"
  >("템플릿 관리");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignStatuses, setCampaignStatuses] = useState<CampaignStatus[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // 필터 상태
  const [filters, setFilters] = useState({
    templateStatus: activeTab === "캠페인 관리" ? "캠페인상태" : "템플릿상태",
    reviewStatus: "검수상태",
    searchFilter: "검색항목",
  });

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
          statusLabel: "템플릿상태",
          statusOptions: [
            { value: "템플릿상태", label: "템플릿상태" },
            { value: "대기(발송전)", label: "대기(발송전)" },
            { value: "정상", label: "정상" },
            { value: "반려", label: "반려" },
          ],
          searchOptions: [
            { value: "검색항목", label: "검색항목" },
            { value: "템플릿명", label: "템플릿명" },
            { value: "템플릿코드", label: "템플릿코드" },
            { value: "발신프로필", label: "발신프로필" },
          ],
          placeholder: "템플릿 이름 또는 코드",
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

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
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

        // 캠페인 현황 데이터
        const mockCampaignStatuses: CampaignStatus[] = [
          {
            id: "1",
            name: "비지흠 오픈 할인행사",
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

        setTemplates(mockTemplates);
        setCampaigns(mockCampaigns);
        setCampaignStatuses(mockCampaignStatuses);
      } catch (error) {
        console.error("데이터 로드 실패:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

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
    item: Template | Campaign | CampaignStatus,
    type: "template" | "campaign" | "status"
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
    } else if (type === "status") {
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
    switch (activeTab) {
      case "템플릿 관리":
        return templates;
      case "캠페인 관리":
        return campaigns;
      case "캠페인 현황":
        return campaignStatuses;
      default:
        return [];
    }
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
      templateStatus: activeTab === "캠페인 관리" ? "캠페인상태" : "템플릿상태",
      reviewStatus: "검수상태",
      searchFilter: "검색항목",
    });
    setSearchTerm("");
  }, [activeTab]);

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
              <input type="checkbox" />
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
              <input type="checkbox" />
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
            <div className="header-cell">
              <input type="checkbox" />
            </div>
            <div className="header-cell">템플릿 이름</div>
            <div className="header-cell">템플릿 코드</div>
            <div className="header-cell">발신 프로필</div>
            <div className="header-cell">검수상태</div>
            <div className="header-cell">템플릿 상태</div>
            <div className="header-cell">관리</div>
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
              <input type="checkbox" />
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
              <input type="checkbox" />
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
        return (
          <div key={item.id} className="table-row">
            <div className="table-cell">
              <input type="checkbox" />
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
                {getActionButtons(item, "status")}
              </div>
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
                  activeTab === "템플릿 관리" ? "active" : ""
                }`}
                onClick={() => setActiveTab("템플릿 관리")}
              >
                템플릿 관리
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
                  activeTab === "캠페인 현황" ? "active" : ""
                }`}
                onClick={() => setActiveTab("캠페인 현황")}
              >
                캠페인 현황
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
              </div>
            </div>

            {/* 테이블 */}
            <div className="table-container">
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
