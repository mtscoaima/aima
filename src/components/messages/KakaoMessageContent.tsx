"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  Info,
  HelpCircle,
  Paperclip,
  Image as ImageIcon,
  FileText,
  Clock
} from "lucide-react";

const KakaoMessageContent = () => {
  const [activeKakaoTab, setActiveKakaoTab] = useState("alimtalk");
  const [templateContent, setTemplateContent] = useState("");
  const [friendTalkContent, setFriendTalkContent] = useState("");
  const [friendTalkLength, setFriendTalkLength] = useState(0);
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
              ? "bg-yellow-100 text-yellow-700 border border-yellow-300"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
          onClick={() => setActiveKakaoTab("alimtalk")}
        >
          알림톡
        </button>
        <button
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            activeKakaoTab === "friendtalk"
              ? "bg-yellow-100 text-yellow-700 border border-yellow-300"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
          onClick={() => setActiveKakaoTab("friendtalk")}
        >
          친구톡
        </button>
        <button
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            activeKakaoTab === "brand"
              ? "bg-yellow-100 text-yellow-700 border border-yellow-300"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
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
                  <button className="bg-amber-700 text-white px-4 py-2 rounded text-sm hover:bg-amber-800 font-medium">
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
                <button className="bg-amber-700 text-white px-4 py-2 rounded text-sm hover:bg-amber-800 font-medium">
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
                  <button className="bg-amber-700 text-white px-4 py-2 rounded text-sm hover:bg-amber-800 font-medium">
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
        <>
          {/* 템플릿 내용 */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4 flex-1">
            <textarea
              placeholder="사용할 템플릿을 선택하면, 이곳에 템플릿 내용이 표시됩니다. (내용수정불가)"
              className="w-full p-3 border border-gray-300 rounded text-sm resize-none min-h-[200px]"
              value={templateContent}
              onChange={(e) => setTemplateContent(e.target.value)}
            />
          </div>

          {/* 문구 치환 */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-medium text-gray-700">문구 치환</span>
            </div>
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-500" />
              <span className="text-sm text-gray-600">내용에 변수가 없습니다.</span>
            </div>
          </div>

          {/* 발송실패 시 문자대체발송 여부 */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <input type="checkbox" id="smsBackup" className="rounded" />
              <label htmlFor="smsBackup" className="text-sm text-gray-700">
                발송실패 시 문자대체발송 여부
              </label>
              <HelpCircle className="w-4 h-4 text-gray-400" />
            </div>
          </div>
        </>
      )}

      {/* 친구톡 탭 내용 */}
      {activeKakaoTab === "friendtalk" && (
        <>
          {/* 메시지 내용 입력 */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4 flex-1">
            <div className="flex flex-col h-full">
              <textarea
                placeholder="이곳에 문자 내용을 입력합니다&#10;치환문구 예시) #[올림]님 #[지각비] 방문 예약입니다."
                className="flex-1 w-full p-3 border border-gray-300 rounded text-sm resize-none min-h-[300px]"
                maxLength={1000}
                value={friendTalkContent}
                onChange={(e) => {
                  setFriendTalkContent(e.target.value);
                  setFriendTalkLength(e.target.value.length);
                }}
              />

              {/* 하단 도구바 */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                <div className="flex items-center gap-3">
                  <button className="p-2 text-gray-500 hover:text-gray-700">
                    <Paperclip className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-gray-500 hover:text-gray-700">
                    <ImageIcon className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-gray-500 hover:text-gray-700">
                    <FileText className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-gray-500 hover:text-gray-700">
                    <Clock className="w-4 h-4" />
                  </button>
                  <span className="text-xs text-gray-500">저장내용</span>
                  <span className="text-xs text-gray-500">최근발송</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">{friendTalkLength} / 1,000 자</span>
                  <Info className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            </div>
          </div>

          {/* 카카오톡 버튼 */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="font-medium text-gray-700">카카오톡 버튼</span>
            </div>
            <div className="text-center py-4 border border-dashed border-gray-300 rounded">
              <button className="text-gray-500 text-sm hover:text-gray-700">
                친구톡 버튼 추가
              </button>
            </div>
          </div>

          {/* 문구 치환 */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-medium text-gray-700">문구 치환</span>
            </div>
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-500" />
              <span className="text-sm text-gray-600">내용에 변수가 없습니다.</span>
            </div>
          </div>

          {/* 광고메시지 여부 */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2">
              <input type="checkbox" id="adMessage" className="rounded" />
              <label htmlFor="adMessage" className="text-sm text-gray-700">광고메시지 여부</label>
              <HelpCircle className="w-4 h-4 text-gray-400" />
            </div>
          </div>

          {/* 발송실패 시 문자대체발송 여부 */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <input type="checkbox" id="smsBackupFriend" className="rounded" />
              <label htmlFor="smsBackupFriend" className="text-sm text-gray-700">
                발송실패 시 문자대체발송 여부
              </label>
              <HelpCircle className="w-4 h-4 text-gray-400" />
            </div>
          </div>
        </>
      )}

      {/* 브랜드 메시지 탭 내용 */}
      {activeKakaoTab === "brand" && (
        <>
          {/* 템플릿 미리보기 */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-700">템플릿 미리보기</h3>
              <button className="bg-amber-700 text-white px-4 py-2 rounded text-sm hover:bg-amber-800 font-medium">
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
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-300 text-gray-600 hover:bg-gray-50"
                }`}
                onClick={() => setSelectedTemplate("text" as keyof typeof templateTypes)}
              >
                📄 텍스트형
              </button>
              <button
                className={`flex items-center gap-2 px-3 py-2 border rounded text-sm ${
                  selectedTemplate === "image"
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-300 text-gray-600 hover:bg-gray-50"
                }`}
                onClick={() => setSelectedTemplate("image" as keyof typeof templateTypes)}
              >
                🖼️ 이미지형
              </button>
              <button
                className={`flex items-center gap-2 px-3 py-2 border rounded text-sm ${
                  selectedTemplate === "wide"
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-300 text-gray-600 hover:bg-gray-50"
                }`}
                onClick={() => setSelectedTemplate("wide" as keyof typeof templateTypes)}
              >
                📊 와이드형
              </button>
              <button
                className={`flex items-center gap-2 px-3 py-2 border rounded text-sm ${
                  selectedTemplate === "widelist"
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-300 text-gray-600 hover:bg-gray-50"
                }`}
                onClick={() => setSelectedTemplate("widelist" as keyof typeof templateTypes)}
              >
                📱 와이드리스트형
              </button>
            </div>
            <div className="grid grid-cols-4 gap-3">
              <button
                className={`flex items-center gap-2 px-3 py-2 border rounded text-sm ${
                  selectedTemplate === "carousel"
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-300 text-gray-600 hover:bg-gray-50"
                }`}
                onClick={() => setSelectedTemplate("carousel" as keyof typeof templateTypes)}
              >
                🔍 캐러셀피드형
              </button>
              <button
                className={`flex items-center gap-2 px-3 py-2 border rounded text-sm ${
                  selectedTemplate === "commerce"
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-300 text-gray-600 hover:bg-gray-50"
                }`}
                onClick={() => setSelectedTemplate("commerce" as keyof typeof templateTypes)}
              >
                💬 커머스형
              </button>
              <button
                className={`flex items-center gap-2 px-3 py-2 border rounded text-sm ${
                  selectedTemplate === "carouselcommerce"
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-300 text-gray-600 hover:bg-gray-50"
                }`}
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
            <div className="flex-1">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="font-light text-gray-400 mb-4">전체수신번호</h3>

                {/* 겹치는 원형 차트 */}
                <div className="relative w-80 h-48 mx-auto mb-4 overflow-hidden">
                  {/* 앞쪽 원 (마케팅 수신 동의자) */}
                  <div className="absolute w-48 h-48 left-0">
                    <div className="w-full h-full border-4 border-gray-200 rounded-full opacity-50"></div>
                    {/* 앞쪽 원 텍스트 */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-lg text-gray-400">마케팅수신동의자</div>
                      </div>
                    </div>
                  </div>

                  {/* 뒤쪽 원 (채널친구) */}
                  <div className="absolute w-48 h-48 right-0">
                    <div className="w-full h-full bg-yellow-400/60 rounded-full"></div>
                    {/* 뒤쪽 원 텍스트 */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-lg font-bold opacity-60">채널친구</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 우측: 수신대상 정보 */}
            <div className="flex-1">
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