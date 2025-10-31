"use client";

import React, { useState, useEffect } from "react";
import { Search, Plus, HelpCircle, Mail, RefreshCw, Info } from "lucide-react";
import {
  fetchSenderProfiles,
  type SenderProfile,
} from "@/utils/kakaoApi";
import ChannelRegistrationModal from "../../kakao/ChannelRegistrationModal";

const KakaoChannelTab = () => {
  // 상태 관리
  const [senderProfiles, setSenderProfiles] = useState<SenderProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 컴포넌트 마운트 시 발신 프로필 조회
  useEffect(() => {
    loadSenderProfiles();
  }, []);

  // 발신 프로필 조회
  const loadSenderProfiles = async () => {
    setIsLoadingProfiles(true);
    setErrorMessage("");
    try {
      const profiles = await fetchSenderProfiles();
      setSenderProfiles(profiles);
    } catch (error) {
      console.error("발신 프로필 조회 실패:", error);
      setErrorMessage(error instanceof Error ? error.message : "발신 프로필 조회 실패");
    } finally {
      setIsLoadingProfiles(false);
    }
  };

  // 검색 필터링
  const filteredProfiles = senderProfiles.filter(profile =>
    profile.channel_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    profile.sender_key?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 flex">
      {/* 좌측 영역 - 카카오 채널 */}
      <div className="flex-1 pr-6">
        {/* 에러 메시지 */}
        {errorMessage && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2">
              <Info className="w-5 h-5 text-red-500" />
              <span className="text-sm text-red-700">{errorMessage}</span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-gray-900">카카오 채널</h2>
            <button
              onClick={loadSenderProfiles}
              disabled={isLoadingProfiles}
              className="p-1.5 text-gray-500 hover:text-gray-700 disabled:opacity-50 rounded hover:bg-gray-100"
              title="새로고침"
            >
              <RefreshCw
                className={`w-4 h-4 ${isLoadingProfiles ? "animate-spin" : ""}`}
              />
            </button>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            채널 연동
          </button>
        </div>

        {/* 검색 */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="채널 검색"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* 로딩 상태 */}
        {isLoadingProfiles ? (
          <div className="text-center py-20">
            <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-3" />
            <div className="text-gray-500">채널 목록을 불러오는 중...</div>
          </div>
        ) : filteredProfiles.length > 0 ? (
          /* 채널 목록 */
          <div className="space-y-3">
            {filteredProfiles.map((profile) => (
              <div
                key={profile.sender_key}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 mb-1">
                      {profile.channel_name}
                    </h3>
                    <div className="text-sm text-gray-500 space-y-1">
                      <div>
                        <span className="font-medium">Sender Key:</span>{" "}
                        <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">
                          {profile.sender_key}
                        </code>
                      </div>
                      <div>
                        <span className="font-medium">상태:</span>{" "}
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            profile.status === "A"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {profile.status === "A" ? "정상" : profile.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* 빈 상태 */
          <div className="text-center py-20">
            <div className="text-gray-400 text-lg mb-2">
              {searchQuery ? "검색 결과가 없습니다" : "채널이 존재하지 않습니다"}
            </div>
            {!searchQuery && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                <Plus className="w-4 h-4" />
                첫 채널 연동하기
              </button>
            )}
          </div>
        )}
      </div>

      {/* 우측 영역 - 카카오 채널 그룹 */}
      <div className="flex-1 pl-6 border-l border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold text-gray-900">카카오 채널 그룹</h2>
            <HelpCircle className="w-4 h-4 text-gray-400" />
          </div>
          <div className="flex gap-2">
            <button className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg flex items-center gap-2 text-sm hover:bg-gray-50">
              <Mail className="w-4 h-4" />
              그룹 초대 내역
            </button>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm hover:bg-blue-700">
              <Plus className="w-4 h-4" />
              그룹 생성
            </button>
          </div>
        </div>

        {/* 검색 */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="그룹 검색"
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* 빈 상태 */}
        <div className="text-center py-20">
          <div className="text-gray-400 text-lg mb-2">채널 그룹이 존재하지 않습니다.</div>
          <p className="text-sm text-gray-500 mt-2">그룹 기능은 추후 구현 예정입니다.</p>
        </div>
      </div>

      {/* 채널 연동 모달 */}
      <ChannelRegistrationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setIsModalOpen(false);
          loadSenderProfiles();
        }}
      />
    </div>
  );
};

export default KakaoChannelTab;
