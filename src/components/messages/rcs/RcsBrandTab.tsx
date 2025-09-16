/* eslint-disable react/no-unescaped-entities */
"use client";

import Image from "next/image";

const RcsBrandTab = () => {

  return (
    <div className="flex-1">
      {/* RCS 메시지 소개 섭션 */}
      <div className="bg-gray-50 p-6 rounded-lg mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-3">RCS 메시지 소개</h2>
        <div className="text-gray-700 mb-4">
          <p className="mb-2">문자 메시지 본연의 사용성을 개선하여 진화된 메시징 경험과 기업 브랜딩을 제공합니다.</p>
          <p>최종사용자(고객)에게 효과적인 정보전달 및 사용자 행동을 유도할 수 있습니다.</p>
        </div>
        <div className="flex gap-4">
          <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded text-sm hover:bg-gray-100">
            RCS 자세히 알아보기 ↗
          </button>
          <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded text-sm hover:bg-gray-100">
            RCS 메시지 미리보기 ↗
          </button>
        </div>
      </div>

      <div className="flex">
      {/* 좌측 영역 */}
      <div>
        {/* 1. 브랜드 개설 */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">1. 브랜드 개설</h3>
          <div className="bg-gray-50 p-6 rounded-lg mb-4">
            <div className="text-gray-700 mb-4">
              <p className="mb-2">- RCS 비즈센터에 가입되지 않은 경우 먼저 <span className="text-blue-600">RCS 비즈센터 회원가입</span> 해주세요.</p>
              <p className="mb-2"><span className="font-semibold">RCS 비즈센터 접속 → 로그인 → 우측상단 기업 대시보드 클릭</span></p>
              <p className="mb-2">- 기업 담당자는 기업 대시보드 우측 상단에 위치한 브랜드 개설 버튼을 통해 브랜드를 개설할 수 있습니다.</p>
              <p>브랜드 정보 입력, 퀵 버튼 설정, 브랜드 홈 탭 설저을 하면 브랜드 개설 신청이 완료됩니다.</p>
            </div>
            <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded text-sm hover:bg-gray-100">
              브랜드 개설 가이드 ↗
            </button>
          </div>
        </div>

        {/* 2. "솔라피 주식회사" 브랜드 대행사 지정 */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">2. "솔라피 주식회사" 브랜드 대행사 지정</h3>
          <p className=" mb-4">브랜드 등록 승인이 완료되었을 경우, RBC 브랜드 관리 메뉴에서 "솔라피 주식회사"를 대행사로 지정해 주세요.</p>
            <div className="flex-1 pr-6">
              <div className="bg-blue-50 p-4 rounded-lg mb-2">
                <h4 className="font-semibold text-gray-900 mb-2">대행사 지정 방법</h4>
                <div className="space-y-2 text-sm text-gray-700">
                  <p><strong>2-1.</strong> RCS 비즈센터 접속 및 로그인 ↗</p>
                  <p><strong>2-2.</strong> 우측상단 [기업 대시보드] 클릭</p>
                  <p><strong>2-3.</strong> 연동 원하는 브랜드 클릭</p>
                  <p><strong>2-4.</strong> 좌측 "내 브랜드 관리" 메뉴 아래 "브랜드 운영 관리" 클릭</p>
                  <p><strong>2-5.</strong> "대행사 운영권한 부여" 버튼 클릭</p>
                  <p><strong>2-6.</strong> "솔라피 주식회사" 대행사 지정</p>
                  <p><strong>2-7.</strong> (선택사항) 양방향 사용 시 "lguplus"도 함께 대행사 지정</p>
                </div>
              </div>
              <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded text-sm hover:bg-gray-100">
                  브랜드 운영권한 가이드 ↗
              </button>
            </div>

            
        </div>

        {/* 3. 대화방방 등록 */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">3. 대화방 등록</h3>
          <div>
            <p className="text-gray-700 mb-2 font-semibold">
              "내 브랜드 관리" → 대화방 목록 → 대화방 등록 (발신번호 필수) → RCS 관리자 승인
            </p>
            <p className="text-gray-700">
              사용하실 발신번호와 통신서비스 가입 증명서를 미리 준비 해주세요!
            </p>
          </div>
        </div>

        {/* 4. 브랜드 솔라피와 연동 */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">4. 브랜드 솔라피와 연동</h3>
          <div>
            <p className="text-gray-700 mb-4">
              대상자 지정이 완료되었다면, 솔라피에 브랜드를 연동할 수 있습니다.
            </p>
            <button className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
              RCS 브랜드 연동
            </button>
          </div>
        </div>
      </div>
        {/* 우측 영역 - RCS 슬라이드형 미리보기 */}
        <div className="flex-1 pl-6">
          <h4 className="font-semibold text-gray-900 mb-4">RCS 슬라이드형 미리보기</h4>
          <div className="bg-white">
            <Image
              src="/images/kakao_naver_rcs/rcs_slide_type_preview.png"
              alt="RCS 슬라이드형 미리보기"
              width={400}
              height={600}
              className="w-full max-w-sm mx-auto rounded-lg"
            />
          </div>
        </div>
      </div>
      <div className="text-center py-4">
        <p className="text-gray-500">연동된 RCS 브랜드가 없습니다.</p>
      </div>
    </div>
  );
};

export default RcsBrandTab;