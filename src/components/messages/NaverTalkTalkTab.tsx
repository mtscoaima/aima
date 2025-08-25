"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";

const categories = [
  "추천",
  "카페/식음료",
  "병원",
  "학원",
  "뷰티/미용",
  "반려동물",
  "한식",
  "여행",
  "의류/패션",
  "과일",
  "리뷰",
];

interface Template {
  id: number;
  name: string;
  content: string;
  image_url: string;
  category: string;
  usage_count?: number;
  user_id?: number;
  created_at: string;
}

interface NaverTalkTalkTabProps {
  onNavigateToDetail: (templateId?: number, useTemplate?: boolean) => void;
}

export default function NaverTalkTalkTab({
  onNavigateToDetail,
}: NaverTalkTalkTabProps) {
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("추천");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([]);
  const [isTemplatesLoading, setIsTemplatesLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const templatesPerPage = 5;
  const [showImageDropdown, setShowImageDropdown] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 템플릿 데이터 불러오기
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setIsTemplatesLoading(true);
        const url =
          selectedCategory === "추천"
            ? "/api/templates?category=추천"
            : `/api/templates?category=${encodeURIComponent(selectedCategory)}`;
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setTemplates(data.templates || []);
          setFilteredTemplates(data.templates || []);
        }
      } catch (error) {
        console.error("템플릿 로딩 실패:", error);
      } finally {
        setIsTemplatesLoading(false);
      }
    };

    fetchTemplates();
    setCurrentPage(1);
  }, [selectedCategory]);

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowImageDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);



  // 페이지네이션 계산
  const totalPages = Math.ceil(filteredTemplates.length / templatesPerPage);
  const startIndex = (currentPage - 1) * templatesPerPage;
  const endIndex = startIndex + templatesPerPage;
  const currentTemplates = filteredTemplates.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    // 끝 페이지가 maxVisiblePages보다 작으면 시작 페이지 조정
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // 이전 버튼
    if (currentPage > 1) {
      pages.push(
        <button
          key="prev"
          className="w-auto min-w-[50px] px-3 py-1.5 border-none bg-gray-100 rounded-lg text-gray-600 text-center text-sm font-medium leading-[120%] tracking-[-0.28px] cursor-pointer transition-all flex items-center justify-center hover:bg-blue-50 hover:text-blue-600"
          onClick={() => handlePageChange(currentPage - 1)}
        >
          이전
        </button>
      );
    }

    // 첫 페이지와 점점점
    if (startPage > 1) {
      pages.push(
        <button
          key={1}
          className="w-8 h-8 border-none bg-gray-100 rounded-lg text-gray-600 text-center text-sm font-medium leading-[120%] tracking-[-0.28px] cursor-pointer transition-all flex items-center justify-center hover:bg-blue-50 hover:text-blue-600"
          onClick={() => handlePageChange(1)}
        >
          1
        </button>
      );
      if (startPage > 2) {
        pages.push(
          <span key="ellipsis1" className="px-2 text-gray-600 text-sm font-medium leading-[120%] tracking-[-0.28px] flex items-center justify-center select-none">
            ...
          </span>
        );
      }
    }

    // 페이지 번호들
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          className={`w-8 h-8 border-none rounded-lg text-center text-sm font-medium leading-[120%] tracking-[-0.28px] cursor-pointer transition-all flex items-center justify-center ${
            currentPage === i 
              ? "border border-blue-500 bg-blue-50 text-blue-600" 
              : "bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-600"
          }`}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </button>
      );
    }

    // 마지막 페이지와 점점점
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(
          <span key="ellipsis2" className="px-2 text-gray-600 text-sm font-medium leading-[120%] tracking-[-0.28px] flex items-center justify-center select-none">
            ...
          </span>
        );
      }
      pages.push(
        <button
          key={totalPages}
          className="w-8 h-8 border-none bg-gray-100 rounded-lg text-gray-600 text-center text-sm font-medium leading-[120%] tracking-[-0.28px] cursor-pointer transition-all flex items-center justify-center hover:bg-blue-50 hover:text-blue-600"
          onClick={() => handlePageChange(totalPages)}
        >
          {totalPages}
        </button>
      );
    }

    // 다음 버튼
    if (currentPage < totalPages) {
      pages.push(
        <button
          key="next"
          className="w-auto min-w-[50px] px-3 py-1.5 border-none bg-gray-100 rounded-lg text-gray-600 text-center text-sm font-medium leading-[120%] tracking-[-0.28px] cursor-pointer transition-all flex items-center justify-center hover:bg-blue-50 hover:text-blue-600"
          onClick={() => handlePageChange(currentPage + 1)}
        >
          다음
        </button>
      );
    }

    return <div className="flex items-center justify-center gap-2 mt-8 max-w-6xl mx-auto flex-wrap">{pages}</div>;
  };

  const handleStartChat = (message?: string) => {
    const messageToUse = message || inputValue.trim();

    if (!messageToUse) {
      alert("메시지를 입력해주세요.");
      return;
    }

    setIsLoading(true);

    // 세션 스토리지에 초기 메시지와 파일 정보 저장
    sessionStorage.setItem("initialMessage", messageToUse);

    if (selectedFile) {
      // 파일 정보를 세션 스토리지에 저장
      const fileInfo = {
        name: selectedFile.name,
        size: selectedFile.size,
        type: selectedFile.type,
        previewUrl: filePreviewUrl,
      };
      sessionStorage.setItem("initialFile", JSON.stringify(fileInfo));

      // 실제 파일은 FormData로 처리하기 위해 별도 저장
      const formData = new FormData();
      formData.append("file", selectedFile);
      // TODO: 실제 파일 업로드 API 호출 시 사용
    }

    // 상세 페이지로 이동
    setTimeout(() => {
      setIsLoading(false);
      onNavigateToDetail();
    }, 1000);
  };

  const handleQuickBadgeClick = (message: string) => {
    setInputValue(message);
    handleStartChat(message);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 파일 크기 제한 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert("파일 크기는 10MB 이하로 선택해주세요.");
      return;
    }

    // 허용된 파일 형식 확인
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
      "text/plain",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(file.type)) {
      alert(
        "지원하지 않는 파일 형식입니다.\n지원 형식: 이미지(JPG, PNG, GIF, WEBP), PDF, TXT, DOC, DOCX"
      );
      return;
    }

    setSelectedFile(file);

    // 이미지 파일인 경우 미리보기 생성 및 sessionStorage에 저장
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setFilePreviewUrl(dataUrl);
        
        // sessionStorage에 파일 정보 저장
        sessionStorage.setItem('selectedFile', JSON.stringify({
          name: file.name,
          type: file.type,
          size: file.size,
          dataUrl: dataUrl
        }));
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreviewUrl(null);
      // 이미지가 아닌 파일도 sessionStorage에 저장
      sessionStorage.setItem('selectedFile', JSON.stringify({
        name: file.name,
        type: file.type,
        size: file.size,
        dataUrl: null
      }));
    }

    setShowImageDropdown(false);
  };

  const handleFileButtonClick = () => {
    fileInputRef.current?.click();
    setShowImageDropdown(false);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFilePreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUseTemplate = (templateId: number) => {
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      // 선택된 템플릿을 localStorage에 저장
      localStorage.setItem("selectedTemplate", JSON.stringify(template));

      // 상세 페이지로 이동 (템플릿 사용)
      onNavigateToDetail(templateId, true);
    }
  };

  return (
    <>
      <div className="flex-1 flex flex-col items-center text-center mb-16 border-none rounded-none bg-transparent">
        <div className="flex items-center justify-center">
          <Image
            src="/images/ChatGPT.png"
            alt="AI 챗봇"
            width={120}
            height={120}
            className="rounded-xl"
          />
        </div>

        <h2 className="text-black text-2xl font-medium leading-[120%] tracking-[-0.48px] mb-9 font-sans">어떤 광고를 만들고 싶나요?</h2>

        {/* Input Section */}
        <div className="w-full max-w-4xl">
          <div className="rounded-2xl bg-white shadow-[0px_4px_13px_0px_rgba(0,0,0,0.25)] p-4 flex flex-col gap-4 border-none">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleStartChat();
                }
              }}
              placeholder={`Ex) 서울 홍대 헤어샵 오픈 행사 카페 50%할인 이벤트 홍보
                            여름 맞이 최대 50% 할인 이벤트 홍보
                            카페 시즌 음료 무료 사이즈 업 이벤트 안내`
                          }
              className="w-full text-base resize-none transition-colors duration-200 font-inherit border-none outline-none placeholder-gray-400 whitespace-pre-line"
              rows={4}
            />

            {/* 첨부된 파일 미리보기 */}
            {selectedFile && (
              <div className="relative mt-3 p-3 border border-gray-200 rounded-lg bg-gray-50 flex items-center gap-3">
                {filePreviewUrl ? (
                  <div className="w-20 h-15 rounded-lg overflow-hidden flex-shrink-0">
                    <Image
                      src={filePreviewUrl}
                      alt="미리보기"
                      width={80}
                      height={60}
                      style={{ objectFit: "cover" }}
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-2 flex-1">
                    <div className="text-2xl text-gray-500">📄</div>
                    <div className="text-sm font-medium text-gray-700 break-all flex-1">{selectedFile.name}</div>
                    <div className="text-xs text-gray-500 whitespace-nowrap">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </div>
                  </div>
                )}
                <button
                  className="absolute top-2 right-2 w-6 h-6 bg-black bg-opacity-60 text-white border-none rounded-full flex items-center justify-center cursor-pointer text-xs transition-colors hover:bg-black hover:bg-opacity-80"
                  onClick={handleRemoveFile}
                  title="파일 제거"
                >
                  ✕
                </button>
              </div>
            )}

            <div className="flex items-end gap-3 mt-2 flex-wrap justify-between">
              <div className="relative inline-block" ref={dropdownRef}>
                <button
                  className="w-8 h-8 rounded-full bg-blue-500 text-white border-none flex items-center justify-center cursor-pointer text-[32px] font-bold leading-none transition-colors hover:bg-blue-600"
                  title="AI 및 파일 추가"
                  onClick={() => {
                    setShowImageDropdown(!showImageDropdown);
                  }}
                >
                  <span>+</span>
                </button>
                {showImageDropdown && (
                  <div className="absolute top-full left-0 bg-white border border-red-500 rounded-lg shadow-[0_2px_10px_rgba(0,0,0,0.1)] z-[9999] min-w-[200px] mt-2">
                    <button
                      className="block w-full px-4 py-3 bg-none border-none text-left cursor-pointer text-gray-800 text-sm transition-colors hover:bg-gray-50"
                      onClick={handleFileButtonClick}
                    >
                      📎 사진 및 파일 추가
                    </button>
                  </div>
                )}
                {/* 드롭다운 상태 디버깅 */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf,.txt,.doc,.docx"
                  onChange={handleFileSelect}
                  style={{ display: "none" }}
                />
              </div>
              <div className="flex gap-2 flex-1 flex-wrap py-0.5 min-w-0 items-center">
                <button
                  className="bg-gray-100 text-gray-600 border-none rounded-full px-4 h-8 text-sm font-medium cursor-pointer whitespace-nowrap transition-all flex-shrink-0 flex items-center justify-center hover:bg-blue-50 hover:text-blue-600"
                  onClick={() =>
                    handleQuickBadgeClick("런칭 이벤트 특별 할인 혜택")
                  }
                >
                  런칭 이벤트
                </button>
                <button
                  className="bg-gray-100 text-gray-600 border-none rounded-full px-4 h-8 text-sm font-medium cursor-pointer whitespace-nowrap transition-all flex-shrink-0 flex items-center justify-center hover:bg-blue-50 hover:text-blue-600"
                  onClick={() =>
                    handleQuickBadgeClick("할인 이벤트 진행 중입니다")
                  }
                >
                  할인 이벤트
                </button>
                <button
                  className="bg-gray-100 text-gray-600 border-none rounded-full px-4 h-8 text-sm font-medium cursor-pointer whitespace-nowrap transition-all flex-shrink-0 flex items-center justify-center hover:bg-blue-50 hover:text-blue-600"
                  onClick={() =>
                    handleQuickBadgeClick("신규 고객 유치를 위한 특별 혜택")
                  }
                >
                  고객유치 이벤트
                </button>
                <button
                  className="bg-gray-100 text-gray-600 border-none rounded-full px-4 h-8 text-sm font-medium cursor-pointer whitespace-nowrap transition-all flex-shrink-0 flex items-center justify-center hover:bg-blue-50 hover:text-blue-600"
                  onClick={() =>
                    handleQuickBadgeClick("협력업체와 함께하는 특별 이벤트")
                  }
                >
                  협력 이벤트
                </button>
              </div>
              <button
                className="self-end px-6 py-3 rounded-full bg-blue-500 text-white text-center text-base font-medium leading-[120%] tracking-[-0.32px] border-none cursor-pointer transition-all flex items-center justify-center min-w-[80px] h-11 flex-shrink-0 font-sans hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                onClick={() => handleStartChat()}
                disabled={isLoading || !inputValue.trim()}
              >
                {isLoading ? "생성 중..." : "생성"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Template Section */}
      <div className="w-full py-10 border-none rounded-none bg-transparent">
        <div className="flex items-center gap-2 mb-4 max-w-6xl mx-auto">
          <h2 className="text-black text-2xl font-medium leading-[120%] tracking-[-0.48px] m-0 font-sans">템플릿으로 시작</h2>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 mb-6 px-1 overflow-x-auto scrollbar-none max-w-6xl mx-auto">
          {categories.map((category) => (
            <button
              key={category}
              className={`px-4 py-2 border-none rounded-lg text-center text-sm font-medium leading-[120%] tracking-[-0.28px] cursor-pointer whitespace-nowrap transition-all flex-shrink-0 font-sans ${
                selectedCategory === category 
                  ? "border border-blue-500 bg-blue-50 text-blue-600" 
                  : "bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-600"
              }`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Templates Grid */}
        {isTemplatesLoading ? (
          <div className="flex flex-col items-center justify-center py-20 px-5 text-center max-w-6xl mx-auto">
            <div className="w-10 h-10 border-[3px] border-gray-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500 text-sm m-0">템플릿을 불러오는 중...</p>
          </div>
        ) : currentTemplates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-5 text-center max-w-6xl mx-auto">
            <p className="text-gray-500 text-sm m-0">해당 카테고리의 템플릿이 없습니다.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-5 mb-8 max-w-6xl mx-auto items-stretch sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {currentTemplates.map((template) => (
                <div key={template.id} className="bg-white rounded-lg overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.1)] transition-all duration-200 relative border border-gray-200 flex flex-col h-full hover:translate-y-[-2px] hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)]">
                  <div className="relative h-40 overflow-hidden flex-shrink-0">
                    <Image
                      src={template.image_url || "/images/No Image"}
                      alt={template.name}
                      width={220}
                      height={150}
                      style={{ objectFit: "cover" }}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = "none";
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = "<div>No Image</div>";
                        }
                      }}
                    />
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <div className="text-black text-xs font-medium text-left mb-1 tracking-[-0.1px] font-sans">🎉 GRAND OPENING 🎉</div>
                    <div className="text-black text-sm font-semibold leading-[120%] tracking-[-0.1px] m-0 mb-2 pb-2 border-b border-gray-200 font-sans">{template.name}</div>
                    <p className="text-black text-xs font-normal leading-[147%] tracking-[-0.184px] mt-2 mb-0 pb-3 border-b border-gray-200 font-sans line-clamp-3">{template.content}</p>
                    <div className="flex justify-center mt-auto pt-3">
                      <button
                        onClick={() => handleUseTemplate(template.id)}
                        className="px-3 py-2 rounded-md text-xs font-medium cursor-pointer transition-all border border-blue-600 text-center bg-blue-600 text-white hover:bg-blue-800 hover:border-blue-800"
                      >
                        템플릿 사용하기
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {renderPagination()}
          </>
        )}
      </div>
    </>
  );
}
