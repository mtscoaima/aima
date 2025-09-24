"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";

// 템플릿 데이터 인터페이스
interface Template {
  id: number;
  name: string;
  code: string;
  template_code: string; // 새로 추가: 실제 템플릿 코드
  created_at: string;
  updated_at: string;
  status?: string;
}

interface TemplateManagementTabProps {
  onNavigateToDetail: (templateData?: Template) => void;
}

const TemplateManagementTab: React.FC<TemplateManagementTabProps> = ({
  onNavigateToDetail
}) => {
  const { user } = useAuth();

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
    linkType: 'web';
    url?: string;
  }>>([]);

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
          template_code?: string;
          created_at: string;
          updated_at: string;
          is_active?: boolean;
        }) => ({
          id: template.id,
          name: template.name,
          code: template.category || "결합메시지-1",  // API에서 category를 code로 사용 (하위 호환성)
          template_code: template.template_code || `결합메시지-${template.id}`, // 새로운 템플릿 코드
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
               template.template_code.toLowerCase().includes(keyword) ||
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

  // 캠페인 만들기 핸들러
  const handleCampaignCreate = async () => {
    if (selectedTemplates.length === 0) return;
    
    if (selectedTemplates.length > 1) {
      alert("두 개 이상의 템플릿이 선택되었습니다.");
      return;
    }

    // 선택된 템플릿 정보 찾기
    const selectedTemplate = templates.find(template => template.id === selectedTemplates[0]);
    if (selectedTemplate) {
      try {
        // 먼저 상세 템플릿 정보를 API에서 가져오기
        const token = localStorage.getItem("accessToken");
        if (!token) {
          alert("인증 토큰이 없습니다. 다시 로그인해주세요.");
          return;
        }

        const response = await fetch(`/api/templates/${selectedTemplate.id}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const data = await response.json();
          const templateWithDetails = {
            ...selectedTemplate,
            content: data.template.content || "",
            image_url: data.template.image_url || null,
            buttons: data.template.buttons || []
          };

          // 선택된 템플릿을 localStorage에 저장 (NaverTalkTalkTab과 동일하게)
          try {
            localStorage.setItem("selectedTemplate", JSON.stringify(templateWithDetails));
          } catch (error) {
            console.error("localStorage 저장 실패:", error);
            
            // LocalStorage가 가득 찬 경우, 기존 데이터 일부 정리 후 재시도
            if (error instanceof Error && error.name === 'QuotaExceededError') {
              try {
                const keysToRemove = [];
                for (let i = 0; i < localStorage.length; i++) {
                  const key = localStorage.key(i);
                  if (key && (key.startsWith('temp_') || key.startsWith('cache_'))) {
                    keysToRemove.push(key);
                  }
                }
                keysToRemove.forEach(key => localStorage.removeItem(key));
                
                // 재시도
                localStorage.setItem("selectedTemplate", JSON.stringify(templateWithDetails));
              } catch (retryError) {
                console.error("localStorage 재시도 실패:", retryError);
                alert("브라우저 저장소가 부족합니다. 브라우저 캐시를 정리해주세요.");
                return;
              }
            }
          }

          // 상세 페이지로 이동 (템플릿 사용)
          onNavigateToDetail(templateWithDetails);
        } else {
          const errorData = await response.json().catch(() => ({}));
          alert(errorData.error || "템플릿 정보를 불러오는데 실패했습니다.");
        }
      } catch (error) {
        console.error("템플릿 정보 로드 오류:", error);
        alert("템플릿 정보를 불러오는 중 오류가 발생했습니다.");
      }
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

  // 컴포넌트가 마운트될 때 데이터 로드
  useEffect(() => {
    if (user) {
      loadTemplates();
    }
  }, [user, loadTemplates]);

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

  const filteredTemplates = getFilteredTemplates();

  return (
    <>
      <div className="p-0 flex-1 flex flex-col">
        {/* 필터 섹션 */}
        <div className="flex gap-3 mb-5 items-center flex-nowrap">
          {/* 기간 */}
          <div className="flex items-center min-w-[100px]">
            <select 
              value={templateFilter.period}
              onChange={(e) => setTemplateFilter(prev => ({ ...prev, period: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md bg-white text-sm text-gray-700 cursor-pointer min-w-[140px] h-[38px] box-border focus:outline-none focus:border-blue-500"
            >
              <option value="전체기간">전체기간</option>
              <option value="최근 1주일">최근 1주일</option>
              <option value="최근 1개월">최근 1개월</option>
              <option value="최근 3개월">최근 3개월</option>
            </select>
          </div>

          {/* 검색창 */}
          <div className="flex flex-row gap-0 mr-auto items-center">
                         <input
               type="text"
               placeholder="템플릿 이름 또는 코드"
               value={templateFilter.searchKeyword}
               onChange={(e) => setTemplateFilter(prev => ({ ...prev, searchKeyword: e.target.value }))}
               className="px-3 py-2 border border-gray-300 rounded-l-md border-r-0 text-sm min-w-[250px] h-[38px] box-border focus:outline-none focus:border-blue-500"
             />
            <button className="px-3 py-2 border border-gray-300 rounded-r-md bg-gray-100 cursor-pointer transition-colors h-[38px] box-border flex items-center justify-center hover:bg-gray-200">
              🔍
            </button>
          </div>

          {/* 캠페인 만들기 버튼 */}
          <div className="flex items-center">
            <button 
              className={`border-none rounded-md px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                selectedTemplates.length > 0
                  ? "bg-blue-500 text-white cursor-pointer hover:bg-blue-600"
                  : "bg-gray-400 text-gray-200 cursor-not-allowed"
              }`}
              disabled={selectedTemplates.length === 0}
              onClick={handleCampaignCreate}
            >
              캠페인 만들기
            </button>
          </div>

          {/* 템플릿 삭제 버튼 */}
          <div className="flex items-center">
            <button 
              className="bg-red-500 text-white border-none rounded-md px-4 py-2 text-sm font-medium cursor-pointer transition-colors whitespace-nowrap hover:bg-red-600 disabled:bg-gray-500 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={selectedTemplates.length === 0}
              onClick={handleDeleteTemplates}
            >
              템플릿 삭제
            </button>
          </div>
        </div>

        {/* 템플릿 테이블 */}
        <div className="border border-gray-300 rounded-lg bg-white overflow-x-auto max-h-[480px] overflow-y-auto">
          <table className="w-full border-collapse table-fixed">
            <thead>
              <tr>
                <th className="bg-gray-100 px-1 py-2 text-center font-semibold text-xs text-gray-700 border-b border-gray-300 whitespace-nowrap overflow-hidden text-ellipsis sticky top-0 z-10 w-10">
                  <input
                    type="checkbox"
                    className="w-4 h-4 cursor-pointer"
                    checked={selectedTemplates.length === filteredTemplates.length && filteredTemplates.length > 0}
                    onChange={(e) => handleSelectAllTemplates(e.target.checked)}
                  />
                </th>
                <th className="bg-gray-100 px-1 py-2 text-center font-semibold text-xs text-gray-700 border-b border-gray-300 whitespace-nowrap overflow-hidden text-ellipsis sticky top-0 z-10">템플릿 이름</th>
                <th className="bg-gray-100 px-1 py-2 text-center font-semibold text-xs text-gray-700 border-b border-gray-300 whitespace-nowrap overflow-hidden text-ellipsis sticky top-0 z-10">템플릿 코드</th>
                <th className="bg-gray-100 px-1 py-2 text-center font-semibold text-xs text-gray-700 border-b border-gray-300 whitespace-nowrap overflow-hidden text-ellipsis sticky top-0 z-10">생성일</th>
                <th className="bg-gray-100 px-1 py-2 text-center font-semibold text-xs text-gray-700 border-b border-gray-300 whitespace-nowrap overflow-hidden text-ellipsis sticky top-0 z-10">수정일</th>
                <th className="bg-gray-100 px-1 py-2 text-center font-semibold text-xs text-gray-700 border-b border-gray-300 whitespace-nowrap overflow-hidden text-ellipsis sticky top-0 z-10">관리</th>
              </tr>
            </thead>
            <tbody>
              {isLoadingTemplates ? (
                <tr>
                  <td colSpan={6} className="text-center p-10 text-gray-600">
                    <div className="inline-block w-5 h-5 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin mr-3"></div>
                    템플릿 데이터를 불러오는 중...
                  </td>
                </tr>
              ) : (
                filteredTemplates.map(template => (
                  <tr key={template.id} className="hover:bg-gray-50">
                    <td className="px-1 py-2 text-center text-xs text-gray-600 border-b border-gray-100">
                      <input
                        type="checkbox"
                        className="w-4 h-4 cursor-pointer"
                        checked={selectedTemplates.includes(template.id)}
                        onChange={(e) => handleSelectTemplate(template.id, e.target.checked)}
                      />
                    </td>
                    <td className="px-1 py-2 text-left text-xs text-gray-600 border-b border-gray-100 overflow-hidden text-ellipsis whitespace-nowrap">
                      {editingTemplateId === template.id ? (
                        <div className="flex items-center gap-2">
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
                            className="flex-1 max-w-[120px] px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500 focus:shadow-[0_0_0_2px_rgba(0,123,255,0.25)]"
                            autoFocus
                          />
                          <div className="flex gap-1 flex-shrink-0">
                            <button
                              onClick={() => saveEditingTemplateName(template.id)}
                              className="bg-green-500 text-white border border-green-500 cursor-pointer px-2 py-1 text-xs rounded transition-all font-medium min-w-[40px] hover:bg-green-600 hover:border-green-700 hover:-translate-y-px hover:shadow-[0_2px_4px_rgba(40,167,69,0.2)]"
                              title="저장"
                            >
                              저장
                            </button>
                            <button
                              onClick={cancelEditingTemplateName}
                              className="bg-gray-500 text-white border border-gray-500 cursor-pointer px-2 py-1 text-xs rounded transition-all font-medium min-w-[40px] hover:bg-gray-600 hover:border-gray-700 hover:-translate-y-px hover:shadow-[0_2px_4px_rgba(108,117,125,0.2)]"
                              title="취소"
                            >
                              취소
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 justify-start">
                          <span className="flex-1">{template.name}</span>
                          <button
                            onClick={() => startEditingTemplateName(template.id, template.name)}
                            className="bg-gray-100 border border-gray-300 cursor-pointer px-2 py-1 text-xs text-gray-700 rounded transition-all font-medium flex-shrink-0 hover:bg-blue-500 hover:text-white hover:border-blue-500 hover:-translate-y-px hover:shadow-[0_2px_4px_rgba(0,123,255,0.2)]"
                            title="이름 수정"
                          >
                            수정
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-1 py-2 text-center text-xs text-gray-600 border-b border-gray-100">{template.template_code}</td>
                    <td className="px-1 py-2 text-center text-xs text-gray-600 border-b border-gray-100">{new Date(template.created_at).toLocaleDateString("ko-KR")}</td>
                    <td className="px-1 py-2 text-center text-xs text-gray-600 border-b border-gray-100">{new Date(template.updated_at).toLocaleDateString("ko-KR")}</td>
                    <td className="px-1 py-2 text-center text-xs text-gray-600 border-b border-gray-100">
                      <div className="flex gap-1 flex-wrap justify-center">
                        <button 
                          className="px-3 py-1 border border-gray-300 rounded text-xs font-medium cursor-pointer bg-white text-gray-700 transition-all whitespace-nowrap min-w-[60px] hover:bg-gray-50 hover:border-gray-400 hover:-translate-y-px hover:shadow-[0_1px_3px_rgba(0,0,0,0.1)]" 
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
                  <td colSpan={6} className="text-center text-gray-400 italic py-10">
                    조건에 맞는 템플릿이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 템플릿 수정 모달 */}
      {isTemplateEditModalOpen && editingTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1001] p-5" onClick={closeTemplateEditModal}>
          <div className="bg-white rounded-xl w-[90%] max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-800 m-0">템플릿 수정</h2>
              <button className="w-8 h-8 bg-none border-none rounded-md flex items-center justify-center cursor-pointer text-gray-500 transition-all hover:bg-gray-100 hover:text-gray-800" onClick={closeTemplateEditModal}>X</button>
            </div>
            
            <div className="flex flex-col md:flex-row gap-6 p-6 flex-1">
              <div className="flex-1 flex flex-col gap-4">
                {/* 이미지 섹션 */}
                <div className="flex flex-col md:flex-row gap-4 mb-4 items-start">
                  <div className="flex-none w-15 text-sm font-medium text-gray-700 pt-3">이미지</div>
                  <div className="flex-1 flex flex-col md:flex-row gap-4 items-center">
                    <div className="flex-1 min-h-[120px] flex items-center justify-center p-4">
                      {(uploadedImagePreview || editTemplateImage) ? (
                        <div className="relative inline-block">
                          <Image 
                            src={uploadedImagePreview || editTemplateImage || ""} 
                            alt="템플릿 이미지" 
                            className="max-w-full max-h-[120px] object-cover rounded-md"
                            width={200}
                            height={120}
                            style={{ objectFit: 'cover' }}
                          />
                          {uploadedImagePreview && (
                            <button 
                              className="absolute top-2 right-2 bg-red-600 bg-opacity-90 text-white border-none rounded px-2 py-1 text-xs cursor-pointer transition-colors hover:bg-red-600"
                              onClick={removeUploadedImage}
                            >
                              제거
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center w-full h-[120px] bg-gray-100 border-2 border-dashed border-gray-300 rounded-md text-gray-500 text-sm">
                          <span>이미지 없음</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-shrink-0">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        style={{ display: "none" }}
                        id="template-image-upload"
                      />
                      <label htmlFor="template-image-upload" className="inline-block px-4 py-2 bg-blue-500 text-white rounded-md cursor-pointer text-sm font-medium transition-colors whitespace-nowrap hover:bg-blue-600">
                        <span>업로드</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* 제목 입력 */}
                <div className="flex flex-col md:flex-row gap-4 mb-4 items-start">
                  <div className="flex-none w-15 text-sm font-medium text-gray-700 pt-3">제목</div>
                  <div className="flex-1">
                    <div className="relative">
                      <input
                        type="text"
                        value={editTemplateTitle}
                        onChange={(e) => setEditTemplateTitle(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-md text-sm resize-none box-border focus:outline-none focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)]"
                        maxLength={20}
                        placeholder="템플릿 제목을 입력하세요"
                      />
                      <span className="absolute bottom-2 right-3 text-xs text-gray-500 bg-white px-1">{editTemplateTitle.length}/20</span>
                    </div>
                  </div>
                </div>

                {/* 내용 입력 */}
                <div className="flex flex-col md:flex-row gap-4 mb-4 items-start">
                  <div className="flex-none w-15 text-sm font-medium text-gray-700 pt-3">내용</div>
                  <div className="flex-1">
                    <div className="relative">
                      <textarea
                        value={editTemplateContent}
                        onChange={(e) => setEditTemplateContent(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-md text-sm resize-none box-border focus:outline-none focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)]"
                        maxLength={100}
                        placeholder="템플릿 내용을 입력하세요"
                        rows={4}
                      />
                      <span className="absolute bottom-2 right-3 text-xs text-gray-500 bg-white px-1">{editTemplateContent.length}/100</span>
                    </div>
                  </div>
                </div>

                {/* 버튼 관리 */}
                <div className="flex flex-col md:flex-row gap-4 mb-4 items-start">
                  <div className="flex-none w-15 text-sm font-medium text-gray-700 pt-3">버튼</div>
                  <div className="flex-1">
                    <div className="flex flex-col gap-4">
                      {dynamicButtons.map((button, index) => (
                        <div key={button.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                          <div className="flex flex-col lg:flex-row gap-3 items-start flex-wrap">
                            <div className="flex flex-col min-w-[120px]">
                              <input
                                type="text"
                                placeholder="버튼명"
                                value={button.text}
                                onChange={(e) => updateDynamicButton(button.id, 'text', e.target.value)}
                                className="p-2 border border-gray-300 rounded text-sm mb-1"
                                maxLength={8}
                              />
                              <span className="text-xs text-gray-500 text-right">
                                {button.text.length} / 8
                              </span>
                            </div>
                            
                            {/* 링크 타입 선택 */}
                            <div className="flex flex-col min-w-[120px]">
                            </div>

                            {/* 링크 입력창 */}
                            <div className="flex-1 min-w-[200px]">
                              <input
                                type="text"
                                placeholder="웹링크 주소"
                                value={button.url || ''}
                                onChange={(e) => updateDynamicButton(button.id, 'url', e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded text-sm mb-2"
                              />
                            </div>

                            <div className="flex flex-col lg:flex-row gap-2 min-w-[80px] items-center">
                              <button
                                className="bg-gray-500 text-white border-none rounded px-3 py-1 text-xs cursor-pointer whitespace-nowrap hover:bg-gray-600"
                                title="링크 확인"
                                onClick={() => handleLinkCheck(button)}
                              >
                                링크확인
                              </button>
                              {index === dynamicButtons.length - 1 && (
                                <button
                                  onClick={() => removeDynamicButton(button.id)}
                                  className="bg-transparent text-red-500 border-none px-3 py-1 text-xs cursor-pointer whitespace-nowrap hover:text-red-600"
                                >
                                    삭제
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {dynamicButtons.length < 2 && (
                      <button 
                        className="bg-gray-100 text-gray-600 border border-gray-300 rounded px-4 py-2 text-sm cursor-pointer transition-all mt-2 hover:bg-gray-200 hover:text-gray-700"
                        onClick={addDynamicButton}
                      >
                        버튼 추가 ({dynamicButtons.length}/2)
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* 미리보기 섹션 */}
              <div className="flex-none w-[300px] flex flex-col">
                <h3 className="m-0 mb-4 text-base font-semibold text-gray-700">미리보기</h3>
                <div className="flex-1 flex justify-center">
                  <div className="w-[250px] bg-gray-100 rounded-[20px] p-5 shadow-lg">
                    <div className="bg-white rounded-[15px] p-4 min-h-[400px] flex flex-col gap-3">
                      {(uploadedImagePreview || editTemplateImage) && (
                        <div className="rounded-lg overflow-hidden">
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
                        <div className="text-base font-semibold text-gray-700 text-center">
                          {editTemplateTitle}
                        </div>
                      )}
                      
                      {editTemplateContent && (
                        <div className="text-sm text-gray-500 leading-6 text-left whitespace-pre-wrap">
                          {editTemplateContent}
                        </div>
                      )}
                      
                      {dynamicButtons.length > 0 && (
                        <div className="flex gap-2 justify-center mt-auto">
                          {dynamicButtons.map((button) => (
                            button.text && (
                              <button 
                                key={button.id} 
                                className="bg-blue-500 text-white border-none rounded-[15px] px-4 py-2 text-xs font-medium cursor-default"
                                onClick={() => {
                                  if (button.linkType === 'web' && button.url) {
                                    let validUrl = button.url.trim();
                                    if (!validUrl.startsWith('http://') && !validUrl.startsWith('https://')) {
                                      validUrl = 'https://' + validUrl;
                                    }
                                    window.open(validUrl, '_blank');
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

            <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
              <button className="px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-700 text-sm font-medium cursor-pointer transition-all hover:bg-gray-50 hover:border-blue-500" onClick={closeTemplateEditModal}>
                취소
              </button>
              <button 
                className="px-4 py-2 border border-blue-500 rounded-md bg-blue-500 text-white text-sm font-medium cursor-pointer transition-all flex items-center gap-2 hover:bg-blue-600 hover:border-blue-600 disabled:bg-gray-300 disabled:opacity-60 disabled:cursor-not-allowed" 
                onClick={handleSaveTemplateEdit}
                disabled={isImageUploading}
              >
                {isImageUploading ? "업로드 중..." : "수정"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TemplateManagementTab;
