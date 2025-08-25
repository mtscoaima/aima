import React from "react";
import { useState } from "react";

export function UsageHistoryPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const usageHistory = [
    {
      id: 1,
      date: "2025-06-24 14:30",
      type: "SMS",
      template: "50% 쿠폰 행사",
      recipients: 1250,
      successCount: 1198,
      failCount: 52,
      credits: 150,
      status: "completed",
    },
    {
      id: 2,
      date: "2025-06-23 10:15",
      type: "SMS",
      template: "신상품 안내",
      recipients: 2100,
      successCount: 2087,
      failCount: 13,
      credits: 200,
      status: "completed",
    },
    {
      id: 3,
      date: "2025-06-22 16:45",
      type: "SMS",
      template: "배송 알림",
      recipients: 850,
      successCount: 845,
      failCount: 5,
      credits: 100,
      status: "completed",
    },
    {
      id: 4,
      date: "2025-06-21 09:20",
      type: "SMS",
      template: "이벤트 참여 감사",
      recipients: 3200,
      successCount: 3156,
      failCount: 44,
      credits: 320,
      status: "completed",
    },
    {
      id: 5,
      date: "2025-06-20 13:10",
      type: "SMS",
      template: "주말 특가 할인",
      recipients: 1800,
      successCount: 1774,
      failCount: 26,
      credits: 180,
      status: "completed",
    },
  ];

  const totalCreditsUsed = usageHistory.reduce(
    (sum, item) => sum + item.credits,
    0
  );
  const totalRecipients = usageHistory.reduce(
    (sum, item) => sum + item.recipients,
    0
  );
  const totalSuccess = usageHistory.reduce(
    (sum, item) => sum + item.successCount,
    0
  );

  return (
    <div className="space-y-6">
      {/* 사용량 요약 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="text-sm text-gray-600 mb-1">총 사용 크레딧</div>
          <div className="text-2xl font-bold text-red-600">
            {totalCreditsUsed.toLocaleString()}
          </div>
          <div className="text-sm text-gray-500">크레딧</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="text-sm text-gray-600 mb-1">총 발송 건수</div>
          <div className="text-2xl font-bold text-gray-900">
            {totalRecipients.toLocaleString()}
          </div>
          <div className="text-sm text-gray-500">건</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="text-sm text-gray-600 mb-1">발송 성공률</div>
          <div className="text-2xl font-bold text-green-600">
            {((totalSuccess / totalRecipients) * 100).toFixed(1)}%
          </div>
          <div className="text-sm text-gray-500">성공률</div>
        </div>
      </div>

      {/* 필터 및 검색 */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <label className="block text-sm text-gray-700 mb-2">
              기간 선택
            </label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">전체</option>
              <option value="today">오늘</option>
              <option value="week">최근 7일</option>
              <option value="month">최근 30일</option>
              <option value="quarter">최근 3개월</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm text-gray-700 mb-2">
              템플릿 검색
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="템플릿명으로 검색..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-end">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
              검색
            </button>
          </div>
        </div>

        {/* 사용 내역 테이블 */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                  발송일시
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                  템플릿명
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">
                  발송 건수
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">
                  성공/실패
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">
                  사용 크레딧
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">
                  상태
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {usageHistory.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 text-sm text-gray-900">
                    {item.date}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900">
                    {item.template}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900 text-center">
                    {item.recipients.toLocaleString()}
                  </td>
                  <td className="px-4 py-4 text-sm text-center">
                    <div className="text-green-600">
                      {item.successCount.toLocaleString()}
                    </div>
                    <div className="text-red-600">
                      {item.failCount.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-red-600 text-center font-medium">
                    -{item.credits.toLocaleString()}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
                      완료
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 페이지네이션 */}
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-gray-700">
            총 {usageHistory.length}개의 발송 내역
          </div>
          <div className="flex gap-2">
            <button className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50">
              이전
            </button>
            <button className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm">
              1
            </button>
            <button className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50">
              다음
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
