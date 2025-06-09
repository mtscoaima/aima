"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Layout, Phone, Smartphone, ImageIcon, X } from "lucide-react";
import "./styles.css";

interface Template {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  category: string;
  period: string;
  isGrandOpening?: boolean;
}

const templates: Template[] = [
  // 카페/식음료
  {
    id: "1",
    title: "신메뉴 아메리카노 50% 할인",
    description:
      "2025년 봄 시즌 신메뉴 출시! 프리미엄 아메리카노를 50% 할인된 가격으로 만나보세요. 3월 한정 특가 이벤트입니다.",
    imageUrl:
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=300&h=200&fit=crop",
    category: "카페/식음료",
    period: "기간에 제한 3월 1일~3월 31일 매일 오픈",
    isGrandOpening: true,
  },
  {
    id: "2",
    title: "디저트 세트 특가 이벤트",
    description:
      "달콤한 디저트와 음료를 함께! 케이크 + 음료 세트를 특가로 제공합니다. 연인, 가족과 함께 즐기세요.",
    imageUrl:
      "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=300&h=200&fit=crop",
    category: "카페/식음료",
    period: "기간에 제한 4월 1일~4월 30일 매일 오픈",
  },
  {
    id: "3",
    title: "테이크아웃 전용 할인",
    description:
      "바쁜 일상 속 간편하게! 테이크아웃 주문 시 모든 음료 20% 할인 혜택을 드립니다.",
    imageUrl:
      "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=300&h=200&fit=crop",
    category: "카페/식음료",
    period: "기간에 제한 매일 오전 7시~오후 11시",
  },

  // 명원 (병원/의료)
  {
    id: "4",
    title: "건강검진 패키지 할인",
    description:
      "새해 건강관리 시작! 종합건강검진 패키지를 특가로 제공합니다. 예약 시 30% 할인 혜택까지!",
    imageUrl:
      "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=300&h=200&fit=crop",
    category: "명원",
    period: "기간에 제한 1월 1일~2월 28일 평일 운영",
    isGrandOpening: true,
  },
  {
    id: "5",
    title: "치과 스케일링 이벤트",
    description:
      "깨끗한 치아 관리의 시작! 스케일링 + 불소도포 패키지를 합리적인 가격으로 만나보세요.",
    imageUrl:
      "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=300&h=200&fit=crop",
    category: "명원",
    period: "기간에 제한 월~금 오전 9시~오후 6시",
  },

  // 학원
  {
    id: "6",
    title: "영어회화 무료체험",
    description:
      "원어민과 함께하는 영어회화! 첫 수업 무료체험 후 등록 시 첫 달 수강료 50% 할인 혜택을 드립니다.",
    imageUrl:
      "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=300&h=200&fit=crop",
    category: "학원",
    period: "기간에 제한 매주 월~금 오후 7시~9시",
    isGrandOpening: true,
  },
  {
    id: "7",
    title: "수학 집중반 모집",
    description:
      "중고등 수학 완전정복! 소수정예 수학 집중반에서 실력을 한 단계 업그레이드하세요. 선착순 모집!",
    imageUrl:
      "https://images.unsplash.com/photo-1596495578065-6e0763fa1178?w=300&h=200&fit=crop",
    category: "학원",
    period: "기간에 제한 3월 개강반 모집 중",
  },
  {
    id: "8",
    title: "컴퓨터 프로그래밍 과정",
    description:
      "미래를 준비하는 코딩교육! 초보자도 쉽게 배우는 프로그래밍 기초과정을 시작하세요.",
    imageUrl:
      "https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=300&h=200&fit=crop",
    category: "학원",
    period: "기간에 제한 매주 토요일 오후 2시~5시",
  },

  // 뷰티/미용
  {
    id: "9",
    title: "봄맞이 헤어 스타일링",
    description:
      "새로운 계절, 새로운 스타일! 봄맞이 헤어컷 + 컬러링 패키지를 특가로 제공합니다.",
    imageUrl:
      "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=300&h=200&fit=crop",
    category: "뷰티/미용",
    period: "기간에 제한 3월~5월 매일 오전 10시~오후 8시",
    isGrandOpening: true,
  },
  {
    id: "10",
    title: "네일아트 신규 고객 할인",
    description:
      "아름다운 손끝 연출! 신규 고객 대상 네일아트 서비스 30% 할인 이벤트를 진행합니다.",
    imageUrl:
      "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=300&h=200&fit=crop",
    category: "뷰티/미용",
    period: "기간에 제한 매일 오전 11시~오후 9시",
  },
  {
    id: "11",
    title: "피부관리 패키지 이벤트",
    description:
      "건강한 피부를 위한 전문 케어! 얼굴 + 등 피부관리 패키지를 합리적인 가격으로 만나보세요.",
    imageUrl:
      "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=300&h=200&fit=crop",
    category: "뷰티/미용",
    period: "기간에 제한 화~일 오전 10시~오후 7시",
  },

  // 반려동물
  {
    id: "12",
    title: "반려견 미용 서비스",
    description:
      "사랑하는 반려견을 위한 전문 미용! 목욕 + 미용 + 네일케어 풀패키지를 제공합니다.",
    imageUrl:
      "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=300&h=200&fit=crop",
    category: "반려동물",
    period: "기간에 제한 매일 오전 9시~오후 6시",
    isGrandOpening: true,
  },
  {
    id: "13",
    title: "펫샵 용품 할인전",
    description:
      "반려동물 용품 대할인! 사료, 간식, 장난감 등 모든 용품을 최대 40% 할인된 가격으로 만나보세요.",
    imageUrl:
      "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=300&h=200&fit=crop",
    category: "반려동물",
    period: "기간에 제한 4월 1일~4월 15일 매일 오픈",
  },

  // 한식
  {
    id: "14",
    title: "전통 한정식 런치 특가",
    description:
      "정성스럽게 준비한 전통 한정식! 점심시간 한정 특가 메뉴로 건강하고 맛있는 식사를 즐기세요.",
    imageUrl:
      "https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=300&h=200&fit=crop",
    category: "한식",
    period: "기간에 제한 평일 오전 11시~오후 3시",
    isGrandOpening: true,
  },
  {
    id: "15",
    title: "삼겹살 무한리필",
    description:
      "고품질 삼겹살 무한리필! 신선한 고기와 다양한 밑반찬으로 푸짐한 식사를 즐기세요.",
    imageUrl:
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=300&h=200&fit=crop",
    category: "한식",
    period: "기간에 제한 매일 오후 5시~오후 11시",
  },
  {
    id: "16",
    title: "김치찌개 세트 메뉴",
    description:
      "집밥 같은 따뜻한 맛! 김치찌개 + 밥 + 반찬 세트를 합리적인 가격으로 제공합니다.",
    imageUrl:
      "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=300&h=200&fit=crop",
    category: "한식",
    period: "기간에 제한 매일 오전 11시~오후 10시",
  },

  // 여행
  {
    id: "17",
    title: "제주도 패키지 여행",
    description:
      "아름다운 제주도로 떠나는 힐링 여행! 항공 + 숙박 + 렌터카 포함 패키지를 특가로 제공합니다.",
    imageUrl:
      "https://images.unsplash.com/photo-1539650116574-75c0c6d73f6e?w=300&h=200&fit=crop",
    category: "여행",
    period: "기간에 제한 3월~5월 출발 가능",
    isGrandOpening: true,
  },
  {
    id: "18",
    title: "부산 당일치기 투어",
    description:
      "바다가 보고 싶을 때! 부산 주요 관광지를 하루에 둘러보는 당일치기 투어 프로그램입니다.",
    imageUrl:
      "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=200&fit=crop",
    category: "여행",
    period: "기간에 제한 매주 토요일 오전 7시 출발",
  },

  // 의류/패션
  {
    id: "19",
    title: "봄 신상 의류 할인",
    description:
      "트렌디한 봄 신상 컬렉션! 최신 패션 아이템을 최대 50% 할인된 가격으로 만나보세요.",
    imageUrl:
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=300&h=200&fit=crop",
    category: "의류/패션",
    period: "기간에 제한 3월 1일~3월 31일 매일 오픈",
    isGrandOpening: true,
  },
  {
    id: "20",
    title: "정장 맞춤 제작 서비스",
    description:
      "완벽한 핏의 정장을 원한다면! 개인 맞춤 정장 제작 서비스를 합리적인 가격으로 제공합니다.",
    imageUrl:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=200&fit=crop",
    category: "의류/패션",
    period: "기간에 제한 평일 오전 10시~오후 7시",
  },
  {
    id: "21",
    title: "운동복 브랜드 세일",
    description:
      "활동적인 라이프스타일을 위한 운동복! 유명 브랜드 운동복을 특가로 만나보세요.",
    imageUrl:
      "https://images.unsplash.com/photo-1506629905607-c28b47d3e7b0?w=300&h=200&fit=crop",
    category: "의류/패션",
    period: "기간에 제한 4월 1일~4월 15일 매일 오픈",
  },

  // 과일
  {
    id: "22",
    title: "제철 딸기 직판 행사",
    description:
      "달콤하고 신선한 제철 딸기! 농장 직송으로 더욱 신선하고 저렴하게 만나보세요.",
    imageUrl:
      "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=300&h=200&fit=crop",
    category: "과일",
    period: "기간에 제한 3월~5월 매일 오전 8시~오후 6시",
    isGrandOpening: true,
  },
  {
    id: "23",
    title: "수입 과일 특가전",
    description:
      "세계 각국의 프리미엄 과일! 망고, 아보카도, 용과 등 다양한 수입 과일을 특가로 제공합니다.",
    imageUrl:
      "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=300&h=200&fit=crop",
    category: "과일",
    period: "기간에 제한 매주 화, 목, 토 입고",
  },
  {
    id: "24",
    title: "과일 선물세트",
    description:
      "소중한 분께 드리는 건강한 선물! 계절 과일로 구성된 프리미엄 선물세트를 준비했습니다.",
    imageUrl:
      "https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=300&h=200&fit=crop",
    category: "과일",
    period: "기간에 제한 매일 오전 9시~오후 8시",
  },
];

const categories = [
  "추천",
  "카페/식음료",
  "명원",
  "학원",
  "뷰티/미용",
  "반려동물",
  "한식",
  "여행",
  "의류/패션",
  "과일",
  "리뷰",
];

export default function TemplateStartPage() {
  const [selectedCategory, setSelectedCategory] = useState("추천");
  const [showSendModal, setShowSendModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
    null
  );
  const [recipientNumber, setRecipientNumber] = useState("");
  const [smsTextContent, setSmsTextContent] = useState("");
  const [isSending, setIsSending] = useState(false);

  const filteredTemplates = templates.filter((template) => {
    if (selectedCategory === "추천") return template.isGrandOpening === true;
    return template.category === selectedCategory;
  });

  const handleUseTemplate = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      setSelectedTemplate(template);
      setSmsTextContent(template.description);
      setShowSendModal(true);
    }
  };

  const handleSendMMS = async () => {
    if (!recipientNumber.trim() || !smsTextContent.trim()) {
      alert("수신번호와 메시지 내용을 모두 입력해주세요.");
      return;
    }

    setIsSending(true);

    try {
      let fileId = null;

      // 템플릿 이미지가 있는 경우 파일 업로드
      if (selectedTemplate?.imageUrl) {
        console.log("템플릿 이미지를 파일로 업로드 중...");

        // 외부 URL 이미지를 fetch하여 blob으로 변환
        const imageResponse = await fetch(selectedTemplate.imageUrl);
        if (!imageResponse.ok) {
          throw new Error("이미지를 가져올 수 없습니다.");
        }

        const imageBlob = await imageResponse.blob();

        // Blob을 File 객체로 변환
        const file = new File(
          [imageBlob],
          `template-${selectedTemplate.id}.jpg`,
          {
            type: "image/jpeg",
          }
        );

        // FormData로 파일 업로드
        const formData = new FormData();
        formData.append("file", file);

        const uploadResponse = await fetch("/api/message/upload-file", {
          method: "POST",
          body: formData,
        });

        if (uploadResponse.ok) {
          const uploadResult = await uploadResponse.json();
          fileId = uploadResult.fileId;
        } else {
          const uploadError = await uploadResponse.json();
          throw new Error(`파일 업로드 실패: ${uploadError.error}`);
        }
      }

      // 메시지 전송
      const response = await fetch("/api/message/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          toNumbers: [recipientNumber.trim().replace(/-/g, "")], // 하이픈 제거
          message: smsTextContent,
          fileIds: fileId ? [fileId] : undefined,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        alert("MMS가 성공적으로 전송되었습니다!");
        setShowSendModal(false);
        setRecipientNumber("");
        setSmsTextContent("");
        setSelectedTemplate(null);
      } else {
        throw new Error(result.error || "MMS 전송에 실패했습니다.");
      }
    } catch (error) {
      console.error("MMS 전송 오류:", error);
      alert(
        error instanceof Error
          ? error.message
          : "MMS 전송 중 오류가 발생했습니다."
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleCloseModal = () => {
    setShowSendModal(false);
    setRecipientNumber("");
    setSmsTextContent("");
    setSelectedTemplate(null);
  };

  return (
    <div className="template-start-container">
      <div className="template-start-header">
        <div className="header-content">
          <div className="header-icon">
            <Layout size={24} />
          </div>
          <div className="header-text">
            <h1>템플릿으로 시작</h1>
            <p>
              AI와 대화하며 맞춤형 마케팅 캠페인을 생성하고 MMS로 전송하세요
            </p>
          </div>
        </div>
      </div>

      <div className="template-start-content">
        {/* 카테고리 탭 */}
        <div className="category-tabs">
          {categories.map((category) => (
            <button
              key={category}
              className={`category-tab ${
                selectedCategory === category ? "active" : ""
              }`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>

        {/* 템플릿 그리드 */}
        <div className="templates-grid">
          {filteredTemplates.map((template) => (
            <div key={template.id} className="template-card">
              {template.isGrandOpening && (
                <div className="grand-opening-badge">GRAND OPENING</div>
              )}

              <div className="template-image">
                <Image
                  src={template.imageUrl}
                  alt={template.title}
                  width={300}
                  height={160}
                  style={{ objectFit: "cover" }}
                />
              </div>

              <div className="template-content">
                <h3 className="template-title">{template.title}</h3>
                <p className="template-description">{template.description}</p>
                <div className="template-period">{template.period}</div>

                <div className="template-actions">
                  <button
                    onClick={() => handleUseTemplate(template.id)}
                    className="action-button"
                  >
                    템플릿 사용하기
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="empty-state">
            <Layout size={48} />
            <h3>해당 카테고리에 템플릿이 없습니다</h3>
            <p>다른 카테고리를 선택해보세요</p>
          </div>
        )}
      </div>

      {/* MMS 전송 모달 */}
      {showSendModal && selectedTemplate && (
        <div className="modal-overlay">
          <div className="modal-content send-modal">
            <div className="modal-header">
              <h2>MMS 전송</h2>
              <button onClick={handleCloseModal} className="modal-close">
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div className="template-preview">
                <h3>전송할 템플릿</h3>
                <div className="preview-card">
                  <div className="preview-image">
                    <Image
                      src={selectedTemplate.imageUrl}
                      alt={selectedTemplate.title}
                      width={300}
                      height={200}
                      style={{ objectFit: "cover" }}
                    />
                  </div>
                  <div className="preview-content">
                    <h4>{selectedTemplate.title}</h4>
                    <p>{selectedTemplate.description}</p>
                  </div>
                </div>
              </div>

              <div className="mms-send-content">
                <div className="content-section">
                  <div className="section-header">
                    <Smartphone size={16} />
                    <span>메시지 발신번호</span>
                  </div>
                  <div className="selected-sender">
                    <div className="sender-info-row">
                      <div className="sender-details">
                        <div className="sender-display">
                          <Phone className="sender-icon" size={16} />
                          <span className="sender-title">메시지 발신번호</span>
                        </div>
                        <div className="sender-number">테스트 번호</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="content-section">
                  <div className="section-header">
                    <Phone size={16} />
                    <span>메시지 수신번호</span>
                  </div>
                  <div className="recipient-input">
                    <input
                      type="text"
                      value={recipientNumber}
                      onChange={(e) => setRecipientNumber(e.target.value)}
                      placeholder="01012345678"
                      className="number-input"
                    />
                  </div>
                </div>

                <div className="content-section">
                  <div className="section-header">
                    <span>내용 입력</span>
                  </div>
                  <div className="message-input-section">
                    <div className="form-group">
                      <textarea
                        value={smsTextContent}
                        onChange={(e) => setSmsTextContent(e.target.value)}
                        placeholder="문자 내용을 입력해주세요."
                        className="message-textarea"
                        maxLength={2000}
                      />
                      <div className="message-footer">
                        <span className="char-count">
                          {new Blob([smsTextContent]).size} / 2,000 bytes
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="content-section">
                  <div className="section-header">
                    <ImageIcon size={16} />
                    <span>이미지 첨부</span>
                    <span className="file-info">(템플릿 이미지 자동 첨부)</span>
                  </div>
                  <div className="file-attachment-section">
                    <div className="attached-image-preview">
                      <Image
                        src={selectedTemplate.imageUrl}
                        alt={selectedTemplate.title}
                        width={200}
                        height={120}
                        style={{ objectFit: "cover" }}
                      />
                      <div className="image-info">
                        <span className="image-status">
                          ✓ 템플릿 이미지 첨부됨
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                onClick={handleCloseModal}
                className="cancel-button"
                disabled={isSending}
              >
                취소
              </button>
              <button
                onClick={handleSendMMS}
                className="send-button primary"
                disabled={
                  !recipientNumber.trim() || !smsTextContent.trim() || isSending
                }
              >
                {isSending ? "전송 중..." : "전송"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
