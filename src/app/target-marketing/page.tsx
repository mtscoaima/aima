"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import TargetMarketingDetail from "@/components/TargetMarketingDetail";
import NaverTalkTalkTab from "@/components/NaverTalkTalkTab";
import CampaignManagementTab from "@/components/CampaignManagementTab";
import { AdvertiserGuardWithDisabled } from "@/components/RoleGuard";

import { useAuth } from "@/contexts/AuthContext";


import "./styles.css";

interface DetailProps {
  templateId?: number | null;
  useTemplate?: boolean;
  initialMessage?: string;
  initialImage?: string | null;
}

// 실제 캠페인 데이터 인터페이스


// 템플릿 데이터 인터페이스
interface Template {
  id: number;
  name: string;
  code: string;
  created_at: string;
  updated_at: string;
  status?: string;
}

const tabs = [
  { id: "naver-talktalk", label: "네이버 톡톡" },
  { id: "campaign-management", label: "캠페인 관리" },
  { id: "template-management", label: "템플릿 관리" },
];

function TargetMarketingPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();




  const [activeTab, setActiveTab] = useState("naver-talktalk");

  // 뷰 상태 관리
  const [currentView, setCurrentView] = useState<"main" | "detail">("main");
  const [detailProps, setDetailProps] = useState<DetailProps>({});


  // 템플릿 관리 탭 상태
  const [templateFilter, setTemplateFilter] = useState({
    period: "전체기간",
    searchKeyword: ""
  });
  const [selectedTemplates, setSelectedTemplates] = useState<number[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<number | null>(null);
  const [editingTemplateName, setEditingTemplateName] = useState("");

  // 템플릿 수정 모달 상태
  const [isTemplateEditModalOpen, setIsTemplateEditModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [editTemplateTitle, setEditTemplateTitle] = useState("");
  const [editTemplateContent, setEditTemplateContent] = useState("");
  const [editTemplateImage, setEditTemplateImage] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [uploadedImagePreview, setUploadedImagePreview] = useState<string | null>(null);

  const [isImageUploading, setIsImageUploading] = useState(false);
  const [dynamicButtons, setDynamicButtons] = useState<Array<{
    id: string;
    text: string;
    linkType: 'web' | 'app';
    url?: string;
    iosUrl?: string;
    androidUrl?: string;
  }>>([]);
  














  // URL 쿼리 파라미터에서 tab 값 읽기
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam && tabs.some(tab => tab.id === tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // 탭 변경 시 뷰 초기화
  useEffect(() => {
    if (activeTab !== "naver-talktalk" && currentView === "detail") {
      setCurrentView("main");
    }
  }, [activeTab, currentView]);

  // 캠페인 데이터 로드




  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    router.push(`?tab=${tabId}`, { scroll: false });
  };

  const handleNavigateToDetail = (templateId?: number, useTemplate?: boolean) => {
    setDetailProps({ templateId, useTemplate });
    setCurrentView("detail");
  };















  // 타깃정보 생성 함수 (한글 형태)












  // 캠페인 삭제 함수


























    // 템플릿 관리 함수들
  const loadTemplates = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoadingTemplates(true);
      const token = localStorage.getItem("accessToken");
      if (!token) {
        console.error("토큰이 없습니다.");
        return;
      }

      // 사용자의 템플릿 데이터 로드 (커스텀 카테고리)
      const response = await fetch("/api/templates?category=커스텀", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        // API 응답을 Template 인터페이스에 맞게 변환
        const formattedTemplates = (data.templates || []).map((template: {
          id: number;
          name: string;
          category?: string;
          created_at: string;
          updated_at: string;
          is_active?: boolean;
        }) => ({
          id: template.id,
          name: template.name,
          code: template.category || "결합메시지-1",  // API에서 category를 code로 사용
          created_at: template.created_at,
          updated_at: template.updated_at,
          status: template.is_active ? "활성" : "비활성"
        }));
        setTemplates(formattedTemplates);
      } else {
        console.error("템플릿 데이터 로드 실패:", response.statusText);
        // 빈 배열로 설정 (사용자 템플릿이 없을 수 있음)
        setTemplates([]);
      }
    } catch (error) {
      console.error("템플릿 데이터 로드 오류:", error);
      // 오류 발생 시 빈 배열로 설정
      setTemplates([]);
    } finally {
      setIsLoadingTemplates(false);
    }
  }, [user]);

  // 템플릿 필터링 함수
  const getFilteredTemplates = () => {
    return templates.filter(template => {
      // 기간 필터
      if (templateFilter.period !== "전체기간") {
        const now = new Date();
        const createdDate = new Date(template.created_at);
        
        switch (templateFilter.period) {
          case "최근 1주일":
            const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            if (createdDate < oneWeekAgo) return false;
            break;
          case "최근 1개월":
            const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            if (createdDate < oneMonthAgo) return false;
            break;
          case "최근 3개월":
            const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            if (createdDate < threeMonthsAgo) return false;
            break;
        }
      }
      
      // 검색 필터
      if (templateFilter.searchKeyword && templateFilter.searchKeyword.trim()) {
        const keyword = templateFilter.searchKeyword.toLowerCase().trim();
        
        return template.name.toLowerCase().includes(keyword) ||
               template.id.toString().includes(keyword);
      }
      
      return true;
    });
  };

  // 템플릿 선택 관련 함수들
  const handleSelectAllTemplates = (checked: boolean) => {
    if (checked) {
      setSelectedTemplates(templates.map(template => template.id));
    } else {
      setSelectedTemplates([]);
    }
  };

  const handleSelectTemplate = (templateId: number, checked: boolean) => {
    if (checked) {
      setSelectedTemplates(prev => [...prev, templateId]);
    } else {
      setSelectedTemplates(prev => prev.filter(id => id !== templateId));
    }
  };

  // 템플릿 삭제 함수
  const handleDeleteTemplates = async () => {
    if (selectedTemplates.length === 0) return;
    
    const confirmDelete = window.confirm(
      `선택한 ${selectedTemplates.length}개의 템플릿을 삭제하시겠습니까?`
    );
    
    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        alert("인증 토큰이 없습니다. 다시 로그인해주세요.");
        return;
      }

      // 선택된 각 템플릿에 대해 삭제 요청
      const deletePromises = selectedTemplates.map(templateId =>
        fetch(`/api/templates/${templateId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })
      );

      const responses = await Promise.all(deletePromises);
      const failedDeletes = responses.filter(response => !response.ok);

      if (failedDeletes.length > 0) {
        alert(`${failedDeletes.length}개의 템플릿 삭제에 실패했습니다.`);
      } else {
        alert("선택한 템플릿이 모두 삭제되었습니다.");
      }

      // 성공한 삭제들을 로컬 상태에서 제거
      const succeededDeletes = responses
        .map((response, index) => ({ response, id: selectedTemplates[index] }))
        .filter(({ response }) => response.ok)
        .map(({ id }) => id);

      setTemplates(prev => 
        prev.filter(template => !succeededDeletes.includes(template.id))
      );
      setSelectedTemplates([]);
    } catch (error) {
      console.error("템플릿 삭제 오류:", error);
      alert("템플릿 삭제 중 오류가 발생했습니다.");
    }
  };

  // 템플릿 이름 수정 함수들
  const startEditingTemplateName = (templateId: number, currentName: string) => {
    setEditingTemplateId(templateId);
    setEditingTemplateName(currentName);
  };

  const cancelEditingTemplateName = () => {
    setEditingTemplateId(null);
    setEditingTemplateName("");
  };

  const saveEditingTemplateName = async (templateId: number) => {
    if (!editingTemplateName.trim()) {
      alert("템플릿 이름을 입력해주세요.");
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        alert("인증 토큰이 없습니다. 다시 로그인해주세요.");
        return;
      }

      const response = await fetch(`/api/templates/${templateId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editingTemplateName.trim()
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // 로컬 상태 업데이트
        setTemplates(prev =>
          prev.map(template =>
            template.id === templateId
              ? { ...template, name: editingTemplateName.trim(), updated_at: data.template.updated_at }
              : template
          )
        );
        setEditingTemplateId(null);
        setEditingTemplateName("");
        alert("템플릿 이름이 수정되었습니다.");
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.error || "템플릿 이름 수정에 실패했습니다.");
      }
    } catch (error) {
      console.error("템플릿 이름 수정 오류:", error);
      alert("템플릿 이름 수정 중 오류가 발생했습니다.");
    }
  };

  // 템플릿 관리 탭이 활성화될 때 데이터 로드
  useEffect(() => {
    if (activeTab === "template-management" && user) {
      loadTemplates();
    }
  }, [activeTab, user, loadTemplates]);

  // 템플릿 수정 모달 관련 함수들
  const openTemplateEditModal = async (template: Template) => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        alert("인증 토큰이 없습니다. 다시 로그인해주세요.");
        return;
      }

      // 템플릿 상세 정보 가져오기
      const response = await fetch(`/api/templates/${template.id}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setEditingTemplate(template);
        setEditTemplateTitle(data.template.name || "");
        setEditTemplateContent(data.template.content || "");
        setEditTemplateImage(data.template.image_url || null);
        setUploadedImage(null);
        setUploadedImagePreview(null);
        
        // 기존 버튼 데이터 로드 (있는 경우)
        if (data.template.buttons && Array.isArray(data.template.buttons)) {
          setDynamicButtons(data.template.buttons);
        } else {
          setDynamicButtons([]);
        }
        
        setIsTemplateEditModalOpen(true);
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.error || "템플릿 정보를 불러오는데 실패했습니다.");
      }
    } catch (error) {
      console.error("템플릿 정보 로드 오류:", error);
      alert("템플릿 정보를 불러오는 중 오류가 발생했습니다.");
    }
  };

  const closeTemplateEditModal = () => {
    setIsTemplateEditModalOpen(false);
    setEditingTemplate(null);
    setEditTemplateTitle("");
    setEditTemplateContent("");
    setEditTemplateImage(null);
    setUploadedImage(null);
    setUploadedImagePreview(null);
    setDynamicButtons([]);
  };

  // 이미지 업로드 핸들러
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 파일 크기 제한 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("파일 크기는 5MB 이하로 선택해주세요.");
      return;
    }

    // 이미지 파일 타입 확인
    if (!file.type.startsWith("image/")) {
      alert("이미지 파일만 업로드 가능합니다.");
      return;
    }

    setUploadedImage(file);

    // 미리보기 생성
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // 업로드된 이미지 제거
  const removeUploadedImage = () => {
    setUploadedImage(null);
    setUploadedImagePreview(null);
  };

  // 동적 버튼 관리
  const addDynamicButton = () => {
    if (dynamicButtons.length < 2) {
      setDynamicButtons([...dynamicButtons, { 
        id: Date.now().toString(),
        text: "",
        linkType: "web",
        url: "",
        iosUrl: "",
        androidUrl: ""
      }]);
    }
  };

  const updateDynamicButton = (id: string, field: keyof typeof dynamicButtons[0], value: string | 'web' | 'app') => {
    setDynamicButtons(prev => prev.map(button => {
      if (button.id === id) {
        return {
          ...button,
          [field]: value
        };
      }
      return button;
    }));
  };

  const removeDynamicButton = (id: string) => {
    setDynamicButtons(dynamicButtons.filter(button => button.id !== id));
  };

  // 링크 확인 함수
  const handleLinkCheck = (button: typeof dynamicButtons[0]) => {
    if (button.linkType === 'web') {
      if (!button.url?.trim()) {
        alert('웹링크 주소를 입력해주세요.');
        return;
      }
      
      let validUrl = button.url.trim();
      if (!validUrl.startsWith('http://') && !validUrl.startsWith('https://')) {
        validUrl = 'https://' + validUrl;
      }

      try {
        new URL(validUrl);
        window.open(validUrl, '_blank', 'noopener,noreferrer');
      } catch {
        alert('유효하지 않은 URL입니다.');
      }
    } else if (button.linkType === 'app') {
      if (!button.iosUrl?.trim() && !button.androidUrl?.trim()) {
        alert('iOS 또는 Android 링크 중 하나는 입력해주세요.');
        return;
      }
      
      let message = '앱링크 확인:\n';
      if (button.iosUrl?.trim()) {
        message += `iOS: ${button.iosUrl}\n`;
      }
      if (button.androidUrl?.trim()) {
        message += `Android: ${button.androidUrl}`;
      }
      alert(message);
    }
  };

  // 템플릿 수정 저장
  const handleSaveTemplateEdit = async () => {
    if (!editingTemplate) return;

    if (!editTemplateTitle.trim()) {
      alert("템플릿 제목을 입력해주세요.");
      return;
    }

    if (!editTemplateContent.trim()) {
      alert("템플릿 내용을 입력해주세요.");
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        alert("인증 토큰이 없습니다. 다시 로그인해주세요.");
        return;
      }

      let imageUrl = editTemplateImage;

      // 새 이미지 업로드가 있는 경우
      if (uploadedImage) {
        setIsImageUploading(true);
        const formData = new FormData();
        formData.append("file", uploadedImage); // "image" -> "file"로 수정
        formData.append("templateId", editingTemplate.id.toString()); // templateId 추가

        const uploadResponse = await fetch("/api/templates/upload-image", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          imageUrl = uploadData.fileUrl; // "imageUrl" -> "fileUrl"로 수정
        } else {
          const errorData = await uploadResponse.json().catch(() => ({}));
          console.error("이미지 업로드 실패:", errorData);
          alert(`이미지 업로드에 실패했습니다. ${errorData.error || ""}`);
          setIsImageUploading(false);
          return;
        }
        setIsImageUploading(false);
      }

      // 템플릿 업데이트
      const response = await fetch(`/api/templates/${editingTemplate.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editTemplateTitle.trim(),
          content: editTemplateContent.trim(),
          image_url: imageUrl,
          category: editingTemplate.code, // 기존 카테고리 유지
          buttons: dynamicButtons, // 버튼 데이터 추가
        }),
      });

      if (response.ok) {
        // 로컬 상태 업데이트
        setTemplates(prev =>
          prev.map(template =>
            template.id === editingTemplate.id
              ? { ...template, name: editTemplateTitle.trim(), updated_at: new Date().toISOString() }
              : template
          )
        );
        closeTemplateEditModal();
        alert("템플릿이 수정되었습니다.");
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.error || "템플릿 수정에 실패했습니다.");
      }
    } catch (error) {
      console.error("템플릿 수정 오류:", error);
      alert("템플릿 수정 중 오류가 발생했습니다.");
    }
  };

  // 템플릿 관리 탭 콘텐츠
  const renderTemplateManagementTab = () => {
    const filteredTemplates = getFilteredTemplates();

    return (
      <div className="campaign-management-container">
        {/* 필터 섹션 */}
        <div className="campaign-filters">
          {/* 기간 */}
          <div className="filter-group">
            <select 
              value={templateFilter.period}
              onChange={(e) => setTemplateFilter(prev => ({ ...prev, period: e.target.value }))}
              className="filter-select"
            >
              <option value="전체기간">전체기간</option>
              <option value="최근 1주일">최근 1주일</option>
              <option value="최근 1개월">최근 1개월</option>
              <option value="최근 3개월">최근 3개월</option>
            </select>
          </div>

          {/* 검색창 */}
          <div className="filter-group search-group">
            <input
              type="text"
              placeholder="템플릿 이름 또는 ID"
              value={templateFilter.searchKeyword}
              onChange={(e) => setTemplateFilter(prev => ({ ...prev, searchKeyword: e.target.value }))}
              className="search-input"
            />
            <button className="search-button">
              🔍
            </button>
          </div>

          {/* 템플릿 만들기 버튼 */}
          <div className="filter-group">
            <button 
              className="create-campaign-btn"
              onClick={() => handleTabChange("naver-talktalk")}
            >
              템플릿 만들기
            </button>
          </div>

          {/* 템플릿 삭제 버튼 */}
          <div className="filter-group">
            <button 
              className="delete-campaign-btn"
              disabled={selectedTemplates.length === 0}
              onClick={handleDeleteTemplates}
            >
              템플릿 삭제
            </button>
          </div>
        </div>

        {/* 템플릿 테이블 */}
        <div className="campaign-table-container">
          <table className="campaign-table management-table">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={selectedTemplates.length === filteredTemplates.length && filteredTemplates.length > 0}
                    onChange={(e) => handleSelectAllTemplates(e.target.checked)}
                  />
                </th>
                <th>템플릿 이름</th>
                <th>템플릿 ID</th>
                <th>생성일</th>
                <th>수정일</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {isLoadingTemplates ? (
                <tr>
                  <td colSpan={6} className="loading-cell">
                    <div className="loading-spinner"></div>
                    템플릿 데이터를 불러오는 중...
                  </td>
                </tr>
              ) : (
                filteredTemplates.map(template => (
                  <tr key={template.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedTemplates.includes(template.id)}
                        onChange={(e) => handleSelectTemplate(template.id, e.target.checked)}
                      />
                    </td>
                    <td className="campaign-name">
                      {editingTemplateId === template.id ? (
                        <div className="campaign-name-edit">
                          <input
                            type="text"
                            value={editingTemplateName}
                            onChange={(e) => setEditingTemplateName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                saveEditingTemplateName(template.id);
                              } else if (e.key === "Escape") {
                                cancelEditingTemplateName();
                              }
                            }}
                            className="campaign-name-input"
                            autoFocus
                          />
                          <div className="campaign-name-actions">
                            <button
                              onClick={() => saveEditingTemplateName(template.id)}
                              className="save-btn"
                              title="저장"
                            >
                              저장
                            </button>
                            <button
                              onClick={cancelEditingTemplateName}
                              className="cancel-btn"
                              title="취소"
                            >
                              취소
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="campaign-name-display">
                          <span>{template.name}</span>
                          <button
                            onClick={() => startEditingTemplateName(template.id, template.name)}
                            className="edit-name-btn"
                            title="이름 수정"
                          >
                            수정
                          </button>
                        </div>
                      )}
                    </td>
                    <td>{template.id}</td>
                    <td>{new Date(template.created_at).toLocaleDateString("ko-KR")}</td>
                    <td>{new Date(template.updated_at).toLocaleDateString("ko-KR")}</td>
                    <td>
                      <div className="mgmt-buttons">
                        <button 
                          className="mgmt-btn edit-btn" 
                          onClick={() => openTemplateEditModal(template)}
                        >
                          수정
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
              {!isLoadingTemplates && filteredTemplates.length === 0 && (
                <tr>
                  <td colSpan={6} className="no-campaigns">
                    조건에 맞는 템플릿이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
              </div>
    </div>
  );
  };

  return (
    <div className="target-marketing-page">
      <div className="page-header">
        <h1>AI 타깃 마케팅</h1>
          </div>

          <div className="tab-navigation">
            {tabs.map((tab) => (
                <button
                key={tab.id}
                className={`tab-button ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => handleTabChange(tab.id)}
                >
                {tab.label}
                </button>
            ))}
              </div>

          <div className="tab-content">
        {currentView === "detail" && activeTab === "naver-talktalk" ? (
              <TargetMarketingDetail {...detailProps} />
            ) : (
              <>
                {activeTab === "naver-talktalk" && (
                  <NaverTalkTalkTab
                    onNavigateToDetail={handleNavigateToDetail}
                  />
                )}
                {activeTab === "campaign-management" && (
                  <CampaignManagementTab 
                    onNavigateToNaver={() => handleTabChange("naver-talktalk")}
                  />
                )}
                {activeTab === "template-management" &&
                  renderTemplateManagementTab()}
              </>
        )}





        {/* 템플릿 수정 모달 */}
        {isTemplateEditModalOpen && editingTemplate && (
          <div className="modal-overlay" onClick={closeTemplateEditModal}>
            <div className="template-edit-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>템플릿 수정</h2>
                <button className="close-btn" onClick={closeTemplateEditModal}>X</button>
              </div>
              
              <div className="template-edit-content">
                <div className="template-edit-left">
                  {/* 이미지 섹션 */}
                  <div className="template-form-row">
                    <div className="form-label">이미지</div>
                    <div className="form-content image-content-row">
                      <div className="current-image-display">
                        {(uploadedImagePreview || editTemplateImage) ? (
                          <div className="image-preview-container">
                            <Image 
                              src={uploadedImagePreview || editTemplateImage || ""} 
                              alt="템플릿 이미지" 
                              className="template-display-image"
                              width={200}
                              height={120}
                              style={{ objectFit: 'cover' }}
                            />
                            {uploadedImagePreview && (
                              <button 
                                className="remove-image-btn"
                                onClick={removeUploadedImage}
                              >
                                제거
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="no-image-placeholder">
                            <span>이미지 없음</span>
                          </div>
                        )}
                      </div>
                      <div className="upload-button-container">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          style={{ display: "none" }}
                          id="template-image-upload"
                        />
                        <label htmlFor="template-image-upload" className="upload-label">
                          <span>업로드</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* 제목 입력 */}
                  <div className="template-form-row">
                    <div className="form-label">제목</div>
                    <div className="form-content">
                      <div className="input-with-count">
                        <input
                          type="text"
                          value={editTemplateTitle}
                          onChange={(e) => setEditTemplateTitle(e.target.value)}
                          className="template-title-input"
                          maxLength={20}
                          placeholder="템플릿 제목을 입력하세요"
                        />
                        <span className="char-count">{editTemplateTitle.length}/20</span>
                      </div>
                    </div>
                  </div>

                  {/* 내용 입력 */}
                  <div className="template-form-row">
                    <div className="form-label">내용</div>
                    <div className="form-content">
                      <div className="input-with-count">
                        <textarea
                          value={editTemplateContent}
                          onChange={(e) => setEditTemplateContent(e.target.value)}
                          className="template-content-textarea"
                          maxLength={100}
                          placeholder="템플릿 내용을 입력하세요"
                          rows={4}
                        />
                        <span className="char-count">{editTemplateContent.length}/100</span>
                      </div>
                    </div>
                  </div>

                  {/* 버튼 관리 */}
                  <div className="template-form-row">
                    <div className="form-label">버튼</div>
                    <div className="form-content">
                      <div className="dynamic-buttons-list">
                        {dynamicButtons.map((button, index) => (
                          <div key={button.id} className="dynamic-button-item">
                            <div className="button-inputs-row">
                              <div className="button-text-input-wrapper">
                                <input
                                  type="text"
                                  placeholder="버튼명"
                                  value={button.text}
                                  onChange={(e) => updateDynamicButton(button.id, 'text', e.target.value)}
                                  className="button-text-input"
                                  maxLength={8}
                                />
                                <span className="button-text-char-count">
                                  {button.text.length} / 8
                                </span>
                              </div>
                              
                              {/* 링크 타입 선택 */}
                              <div className="link-type-section">
                                <div className="link-type-options">
                                  <label className="radio-label">
                                    <input
                                      type="radio"
                                      name={`linkType-${button.id}`}
                                      value="web"
                                      checked={button.linkType === 'web'}
                                      onChange={(e) => updateDynamicButton(button.id, 'linkType', e.target.value as 'web' | 'app')}
                                      className="radio-input"
                                    />
                                    웹링크
                                  </label>
                                  <label className="radio-label">
                                    <input
                                      type="radio"
                                      name={`linkType-${button.id}`}
                                      value="app"
                                      checked={button.linkType === 'app'}
                                      onChange={(e) => updateDynamicButton(button.id, 'linkType', e.target.value as 'web' | 'app')}
                                      className="radio-input"
                                    />
                                    앱링크
                                  </label>
                                </div>
                              </div>

                              {/* 링크 입력창 */}
                              <div className="link-input-section">
                                {button.linkType === 'web' ? (
                                  <input
                                    type="text"
                                    placeholder="웹링크 주소"
                                    value={button.url || ''}
                                    onChange={(e) => updateDynamicButton(button.id, 'url', e.target.value)}
                                    className="button-url-input"
                                  />
                                ) : (
                                  <div className="app-link-inputs">
                                    <input
                                      type="text"
                                      placeholder="iOS 앱 링크"
                                      value={button.iosUrl || ''}
                                      onChange={(e) => updateDynamicButton(button.id, 'iosUrl', e.target.value)}
                                      className="button-url-input"
                                    />
                                    <input
                                      type="text"
                                      placeholder="Android 앱 링크"
                                      value={button.androidUrl || ''}
                                      onChange={(e) => updateDynamicButton(button.id, 'androidUrl', e.target.value)}
                                      className="button-url-input"
                                    />
                                  </div>
                                )}
                              </div>

                              <div className="link-actions-column">
                                <button
                                  className="link-check-btn"
                                  title="링크 확인"
                                  onClick={() => handleLinkCheck(button)}
                                >
                                  링크확인
                                </button>
                                {index === dynamicButtons.length - 1 && (
                                  <button
                                    onClick={() => removeDynamicButton(button.id)}
                                    className="remove-button-btn"
                                  >
                                    🗑️ 삭제
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {dynamicButtons.length < 2 && (
                        <button 
                          className="add-button-btn"
                          onClick={addDynamicButton}
                        >
                          버튼 추가 ({dynamicButtons.length}/2)
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* 미리보기 섹션 */}
                <div className="template-edit-right">
                  <h3>미리보기</h3>
                  <div className="phone-preview">
                    <div className="phone-frame">
                      <div className="phone-screen">
                        {(uploadedImagePreview || editTemplateImage) && (
                          <div className="preview-image">
                            <Image 
                              src={uploadedImagePreview || editTemplateImage || ""} 
                              alt="미리보기" 
                              width={250}
                              height={150}
                              style={{ objectFit: 'cover', width: '100%', height: 'auto' }}
                            />
                          </div>
                        )}
                        
                        {editTemplateTitle && (
                          <div className="preview-title">
                            {editTemplateTitle}
                          </div>
                        )}
                        
                        {editTemplateContent && (
                          <div className="preview-content">
                            {editTemplateContent}
                          </div>
                        )}
                        
                        {dynamicButtons.length > 0 && (
                          <div className="preview-buttons">
                            {dynamicButtons.map((button) => (
                              button.text && (
                                <button 
                                  key={button.id} 
                                  className="preview-button"
                                  onClick={() => {
                                    if (button.linkType === 'web' && button.url) {
                                      let validUrl = button.url.trim();
                                      if (!validUrl.startsWith('http://') && !validUrl.startsWith('https://')) {
                                        validUrl = 'https://' + validUrl;
                                      }
                                      window.open(validUrl, '_blank');
                                    } else if (button.linkType === 'app') {
                                      const userAgent = navigator.userAgent;
                                      if (/iPad|iPhone|iPod/.test(userAgent) && button.iosUrl) {
                                        window.open(button.iosUrl, '_blank');
                                      } else if (/Android/.test(userAgent) && button.androidUrl) {
                                        window.open(button.androidUrl, '_blank');
                                      } else {
                                        const linkToOpen = button.iosUrl || button.androidUrl;
                                        if (linkToOpen) {
                                          window.open(linkToOpen, '_blank');
                                        }
                                      }
                                    }
                                  }}
                                >
                                  {button.text}
                                </button>
                              )
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button className="cancel-btn" onClick={closeTemplateEditModal}>
                  취소
                </button>
                <button 
                  className="save-btn" 
                  onClick={handleSaveTemplateEdit}
                  disabled={isImageUploading}
                >
                  {isImageUploading ? "업로드 중..." : "수정"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
        </div>
  );
}

export default function TargetMarketingPage() {
  return (
    <AdvertiserGuardWithDisabled>
      <Suspense fallback={<div>Loading...</div>}>
        <TargetMarketingPageContent />
      </Suspense>
    </AdvertiserGuardWithDisabled>
  );
}
