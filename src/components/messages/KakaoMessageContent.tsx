"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Info } from "lucide-react";
import AlimtalkTab from "./AlimtalkTab";
import FriendtalkTab from "./FriendtalkTab";

interface Recipient {
  phone_number: string;
  name?: string;
}

interface KakaoMessageContentProps {
  recipients?: Recipient[];
  selectedSenderNumber?: string;
}
const KakaoMessageContent: React.FC<KakaoMessageContentProps> = ({
  recipients = [],
  selectedSenderNumber = "",
}) => {
  const [activeKakaoTab, setActiveKakaoTab] = useState("alimtalk");
  const [selectedTemplate, setSelectedTemplate] = useState<keyof typeof templateTypes>("wide");
  

  // 템플릿 타입별 정보
  const templateTypes = {
    text: {
      title: "텍스트형",
      description: "일반 텍스트형 메시지를 발송합니다.",
      imagePath: "/images/kakao_brand_message/텍스트형.png"
    },
    image: {
      title: "이미지형",
      description: "이미지를 포함한 메시지를 발송합니다.",
      imagePath: "/images/kakao_brand_message/이미지형.png"
    },
    wide: {
      title: "와이드형",
      description: "대화방에 이미지가 더 넓게 보여집니다.",
      imagePath: "/images/kakao_brand_message/와이드형.png"
    },
    widelist: {
      title: "와이드리스트형",
      description: "(친구 전용) 넓은 이미지와 함께 목록을 표기합니다.",
      imagePath: "/images/kakao_brand_message/와이드리스트형.png"
    },
    carousel: {
      title: "캐러셀피드형",
      description: "슬라이드 형식으로 메시지를 조회할 수 있습니다.",
      imagePath: "/images/kakao_brand_message/캐러셀피드형.png"
    },
    commerce: {
      title: "커머스형",
      description: "(친구 전용) 상품 정보를 포함한 카카오톡 메시지입니다.",
      imagePath: "/images/kakao_brand_message/커머스형.png"
    },
    carouselcommerce: {
      title: "캐러셀커머스형",
      description: "(친구 전용) 슬라이드 형식으로 상품 정보를 조회할 수 있습니다.",
      imagePath: "/images/kakao_brand_message/캐러셀커머스형.png"
    },
    video: {
      title: "프리미엄동영상",
      description: "동영상이 포함된 프리미엄 메시지입니다.",
      imagePath: "/images/kakao_brand_message/video.jpg"
    }
  };

  return (
    <>
      {/* 카카오톡 하위 탭 */}
      <div className="flex gap-2 mb-6">
        <button
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            activeKakaoTab === "alimtalk"
              ? "border border-[#795548]"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
          style={activeKakaoTab === "alimtalk" ? { backgroundColor: "#79554820", color: "#795548" } : {}}
          onClick={() => setActiveKakaoTab("alimtalk")}
        >
          알림톡
        </button>
        <button
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            activeKakaoTab === "friendtalk"
              ? "border border-[#795548]"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
          style={activeKakaoTab === "friendtalk" ? { backgroundColor: "#79554820", color: "#795548" } : {}}
          onClick={() => setActiveKakaoTab("friendtalk")}
        >
          친구톡
        </button>
        <button
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            activeKakaoTab === "brand"
              ? "border border-[#795548]"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
          style={activeKakaoTab === "brand" ? { backgroundColor: "#79554820", color: "#795548" } : {}}
          onClick={() => setActiveKakaoTab("brand")}
        >
          브랜드 메시지
        </button>
      </div>

      {/* 상단 섹션: 카카오 채널 */}
      <div className="mb-4">
        {/* 알림톡일 때만 알림톡 템플릿 섹션 표시 */}
        {activeKakaoTab === "alimtalk" ? (
          <div className="flex gap-6">
            {/* 좌측: 카카오 채널 */}
            <div className="flex-1">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-700 mb-3">카카오 채널</h3>
                <div className="flex items-center justify-between">
                  <div className="text-gray-500 text-sm">
                    연동된 채널이 없습니다.
                  </div>
                  <button className="px-4 py-2 rounded text-sm font-medium text-white hover:opacity-90" style={{ backgroundColor: "#795548" }}>
                    채널 연동하기 ＞
                  </button>
                </div>
              </div>
            </div>

            {/* 우측: 알림톡 템플릿 */}
            <div className="flex-1">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-700">알림톡 템플릿</h3>
                <div className="flex items-center justify-between">
                  <div className="text-center py-3.5 text-gray-500 text-sm">
                    먼저 카카오 채널을 선택해주세요.
                  </div>
                  <button className="bg-gray-100 text-gray-600 px-3 py-1 rounded text-sm hover:bg-gray-200">
                    선택
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : activeKakaoTab === "friendtalk" ? (
          /* 친구톡일 때는 카카오 채널만 표시 */
          <div className="w-1/2">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-700 mb-3">카카오 채널</h3>
              <div className="flex items-center justify-between">
                <div className="text-gray-500 text-sm">
                  연동된 채널이 없습니다.
                </div>
                <button className="px-4 py-2 rounded text-sm font-medium text-white hover:opacity-90" style={{ backgroundColor: "#795548" }}>
                  채널 연동하기 ＞
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* 브랜드 메시지일 때는 카카오 채널 + 브랜드 템플릿 */
          <div className="flex gap-6">
            {/* 좌측: 카카오 채널 */}
            <div className="flex-1">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-700 mb-3">카카오 채널</h3>
                <div className="flex items-center justify-between">
                  <div className="text-gray-500 text-sm">
                    연동된 채널이 없습니다.
                  </div>
                  <button className="px-4 py-2 rounded text-sm font-medium text-white hover:opacity-90" style={{ backgroundColor: "#795548" }}>
                    채널 연동하기 ＞
                  </button>
                </div>
              </div>
            </div>

            {/* 우측: 브랜드 템플릿 */}
            <div className="flex-1">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-700">브랜드 템플릿</h3>
                <div className="flex items-center justify-between">
                  <div className="text-center py-3.5 text-gray-500 text-sm">
                    먼저 카카오 채널을 선택해주세요.
                  </div>
                  <button className="bg-gray-100 text-gray-600 px-3 py-1 rounded text-sm hover:bg-gray-200">
                    선택
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 알림톡 탭 내용 */}
      {activeKakaoTab === "alimtalk" && (
        <AlimtalkTab
          recipients={recipients.map(r => r.phone_number)}
          callbackNumber={selectedSenderNumber}
        />
      )}

      {/* 친구톡 탭 내용 */}
      {activeKakaoTab === "friendtalk" && (
        <FriendtalkTab
          recipients={recipients.map(r => r.phone_number)}
          callbackNumber={selectedSenderNumber}
        />
      )}

      {/* 브랜드 메시지 탭 내용 */}
      {activeKakaoTab === "brand" && (
        <>
          {/* 템플릿 미리보기 */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-700">템플릿 미리보기</h3>
              <button className="px-4 py-2 rounded text-sm font-medium text-white hover:opacity-90" style={{ backgroundColor: "#795548" }}>
                템플릿 등록하기 ＞
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              아직 템플릿을 선택하지 않았습니다.
            </p>

            {/* 템플릿 카테고리 버튼들 */}
            <div className="grid grid-cols-4 gap-3 mb-4">
              <button
                className={`flex items-center gap-2 px-3 py-2 border rounded text-sm ${
                  selectedTemplate === "text"
                    ? "border-[#795548]"
                    : "border-gray-300 text-gray-600 hover:bg-gray-50"
                }`}
                style={selectedTemplate === "text" ? { backgroundColor: "#79554820", color: "#795548" } : {}}
                onClick={() => setSelectedTemplate("text" as keyof typeof templateTypes)}
              >
                📄 텍스트형
              </button>
              <button
                className={`flex items-center gap-2 px-3 py-2 border rounded text-sm ${
                  selectedTemplate === "image"
                    ? "border-[#795548]"
                    : "border-gray-300 text-gray-600 hover:bg-gray-50"
                }`}
                style={selectedTemplate === "image" ? { backgroundColor: "#79554820", color: "#795548" } : {}}
                onClick={() => setSelectedTemplate("image" as keyof typeof templateTypes)}
              >
                🖼️ 이미지형
              </button>
              <button
                className={`flex items-center gap-2 px-3 py-2 border rounded text-sm ${
                  selectedTemplate === "wide"
                    ? "border-[#795548]"
                    : "border-gray-300 text-gray-600 hover:bg-gray-50"
                }`}
                style={selectedTemplate === "wide" ? { backgroundColor: "#79554820", color: "#795548" } : {}}
                onClick={() => setSelectedTemplate("wide" as keyof typeof templateTypes)}
              >
                📊 와이드형
              </button>
              <button
                className={`flex items-center gap-2 px-3 py-2 border rounded text-sm ${
                  selectedTemplate === "widelist"
                    ? "border-[#795548]"
                    : "border-gray-300 text-gray-600 hover:bg-gray-50"
                }`}
                style={selectedTemplate === "widelist" ? { backgroundColor: "#79554820", color: "#795548" } : {}}
                onClick={() => setSelectedTemplate("widelist" as keyof typeof templateTypes)}
              >
                📱 와이드리스트형
              </button>
            </div>
            <div className="grid grid-cols-4 gap-3">
              <button
                className={`flex items-center gap-2 px-3 py-2 border rounded text-sm ${
                  selectedTemplate === "carousel"
                    ? "border-[#795548]"
                    : "border-gray-300 text-gray-600 hover:bg-gray-50"
                }`}
                style={selectedTemplate === "carousel" ? { backgroundColor: "#79554820", color: "#795548" } : {}}
                onClick={() => setSelectedTemplate("carousel" as keyof typeof templateTypes)}
              >
                🔍 캐러셀피드형
              </button>
              <button
                className={`flex items-center gap-2 px-3 py-2 border rounded text-sm ${
                  selectedTemplate === "commerce"
                    ? "border-[#795548]"
                    : "border-gray-300 text-gray-600 hover:bg-gray-50"
                }`}
                style={selectedTemplate === "commerce" ? { backgroundColor: "#79554820", color: "#795548" } : {}}
                onClick={() => setSelectedTemplate("commerce" as keyof typeof templateTypes)}
              >
                💬 커머스형
              </button>
              <button
                className={`flex items-center gap-2 px-3 py-2 border rounded text-sm ${
                  selectedTemplate === "carouselcommerce"
                    ? "border-[#795548]"
                    : "border-gray-300 text-gray-600 hover:bg-gray-50"
                }`}
                style={selectedTemplate === "carouselcommerce" ? { backgroundColor: "#79554820", color: "#795548" } : {}}
                onClick={() => setSelectedTemplate("carouselcommerce" as keyof typeof templateTypes)}
              >
                📅 캐러셀커머스형
              </button>
              <button
                className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded text-sm text-gray-400 cursor-not-allowed bg-gray-50"
                disabled
              >
                🎨 프리미엄동영상
              </button>
            </div>
          </div>

          {/* 템플릿 미리보기 */}
          <div className="flex gap-6 mb-4">
            {/* 좌측: 템플릿 정보 */}
            <div className="flex-1">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="font-medium text-gray-700">{templateTypes[selectedTemplate]?.title}</span>
                </div>
                <p className="text-sm text-gray-600">
                  {templateTypes[selectedTemplate]?.description}
                </p>
              </div>
            </div>

            {/* 우측: 템플릿 예시 이미지 */}

                {/* 템플릿 이미지 */}
            <div className="w-80">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-700 mb-4">템플릿 예시</h4>

                <div className="w-full h-96 border border-gray-300 rounded bg-gray-50 flex items-center justify-center overflow-hidden">
                  <Image
                    src={templateTypes[selectedTemplate]?.imagePath || ''}
                    alt={`${templateTypes[selectedTemplate]?.title} 예시`}
                    width={320}
                    height={384}
                    className="max-w-full max-h-full object-contain"
                    unoptimized={true}
                  />
                </div>

                <div className="text-xs text-gray-500 mt-4">
                  <p className="font-medium text-gray-700 mb-1">{templateTypes[selectedTemplate]?.title} 특징</p>
                  <p>• 카카오 비즈니스 메시지 템플릿</p>
                  <p>• 승인 후 발송 가능</p>
                  <p>• 높은 도달률과 가독성</p>
                </div>
              </div>
            </div>

              
          </div>

          {/* 전체수신번호 */}
          <div className="flex gap-6 mb-4">
            {/* 좌측: 전체수신번호 */}
            <div className="w-1/3">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="text-sm text-gray-400 mb-4">전체수신번호</h4>

                {/* 겹치는 원형 차트 */}
                <div className="relative w-full h-32 mx-auto mb-4 overflow-hidden">
                  {/* 앞쪽 원 (마케팅 수신 동의자) */}
                  <div className="absolute w-32 h-32 left-0">
                    <div className="w-full h-full border-4 border-gray-200 rounded-full opacity-50"></div>
                    {/* 앞쪽 원 텍스트 */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-sm text-gray-400">마케팅수신동의자</div>
                      </div>
                    </div>
                  </div>

                  {/* 뒤쪽 원 (채널친구) */}
                  <div className="absolute w-32 h-32 right-0">
                    <div className="w-full h-full bg-yellow-400/60 rounded-full"></div>
                    {/* 뒤쪽 원 텍스트 */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-sm font-bold opacity-60">채널친구</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 우측: 수신대상 정보 */}
            <div className="w-2/3">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex gap-0 border-b border-gray-300 mb-4">
                  <button
                    className="px-4 py-2 text-sm font-medium cursor-not-allowed text-gray-400 bg-gray-50 border-b-2 border-transparent"
                    disabled
                  >
                    전체
                  </button>
                  <button
                    className="px-4 py-2 text-sm font-medium cursor-not-allowed text-gray-400 bg-gray-50 border-b-2 border-transparent"
                    disabled
                  >
                    수신동의자만
                  </button>
                  <button
                    className="px-4 py-2 text-sm font-medium text-blue-600 bg-white border-b-2 border-blue-600"
                  >
                    채널친구만
                  </button>
                </div>

                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm font-medium">수신대상 : 채널친구만</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    현재 수신번호 내에서 카카오 채널 친구추가한 사용자에게 발송합니다.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 문구 치환 */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-medium text-gray-700">문구 치환</span>
            </div>
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-500" />
              <span className="text-sm text-gray-600">내용에 변수가 없습니다.</span>
            </div>
          </div>
        </>
      )}

    </>
  );
};

export default KakaoMessageContent;