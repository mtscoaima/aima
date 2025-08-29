import { useState } from "react";

export function ChargeHistoryPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("all");

  const chargeHistory = [
    {
      id: 1,
      date: "2025-06-24 15:22",
      packageName: "크레딧 3,000개 패키지",
      credits: 3000,
      bonusCredits: 200,
      amount: 28000,
      paymentMethod: "신용카드",
      paymentInfo: "**** 1234",
      status: "completed",
      transactionId: "TXN202506240001",
    },
    {
      id: 2,
      date: "2025-06-20 11:45",
      packageName: "크레딧 1,000개 패키지",
      credits: 1000,
      bonusCredits: 0,
      amount: 10000,
      paymentMethod: "계좌이체",
      paymentInfo: "신한은행 ***-**-123456",
      status: "completed",
      transactionId: "TXN202506200001",
    },
    {
      id: 3,
      date: "2025-06-15 09:30",
      packageName: "크레딧 5,000개 패키지",
      credits: 5000,
      bonusCredits: 500,
      amount: 45000,
      paymentMethod: "신용카드",
      paymentInfo: "**** 5678",
      status: "completed",
      transactionId: "TXN202506150001",
    },
    {
      id: 4,
      date: "2025-06-10 16:20",
      packageName: "크레딧 10,000개 패키지",
      credits: 10000,
      bonusCredits: 1500,
      amount: 85000,
      paymentMethod: "PayPal",
      paymentInfo: "user@email.com",
      status: "completed",
      transactionId: "TXN202506100001",
    },
    {
      id: 5,
      date: "2025-06-05 14:15",
      packageName: "크레딧 3,000개 패키지",
      credits: 3000,
      bonusCredits: 200,
      amount: 28000,
      paymentMethod: "신용카드",
      paymentInfo: "**** 9012",
      status: "failed",
      transactionId: "TXN202506050001",
    },
  ];

  const totalChargedCredits = chargeHistory
    .filter((item) => item.status === "completed")
    .reduce((sum, item) => sum + item.credits + item.bonusCredits, 0);

  const totalAmount = chargeHistory
    .filter((item) => item.status === "completed")
    .reduce((sum, item) => sum + item.amount, 0);

  const completedCharges = chargeHistory.filter(
    (item) => item.status === "completed"
  ).length;

  return (
    <div className="space-y-6">
      {/* 충전 요약 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="text-sm text-gray-600 mb-1">총 충전 크레딧</div>
          <div className="text-2xl font-bold text-green-600">
            {totalChargedCredits.toLocaleString()}
          </div>
          <div className="text-sm text-gray-500">크레딧</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="text-sm text-gray-600 mb-1">총 결제 금액</div>
          <div className="text-2xl font-bold text-gray-900">
            {totalAmount.toLocaleString()}
          </div>
          <div className="text-sm text-gray-500">원</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="text-sm text-gray-600 mb-1">충전 횟수</div>
          <div className="text-2xl font-bold text-blue-600">
            {completedCharges}
          </div>
          <div className="text-sm text-gray-500">회</div>
        </div>
      </div>

      {/* 필터 */}
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
              결제 상태
            </label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="all">전체</option>
              <option value="completed">완료</option>
              <option value="failed">실패</option>
              <option value="pending">대기중</option>
            </select>
          </div>
          <div className="flex items-end">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
              조회
            </button>
          </div>
        </div>

        {/* 충전 내역 테이블 */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                  충전일시
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                  패키지명
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">
                  크레딧
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">
                  보너스
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">
                  결제금액
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">
                  결제방법
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">
                  상태
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">
                  영수증
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {chargeHistory.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 text-sm text-gray-900">
                    {item.date}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900">
                    {item.packageName}
                  </td>
                  <td className="px-4 py-4 text-sm text-green-600 text-center font-medium">
                    +{item.credits.toLocaleString()}
                  </td>
                  <td className="px-4 py-4 text-sm text-center">
                    {item.bonusCredits > 0 ? (
                      <span className="text-green-600 font-medium">
                        +{item.bonusCredits}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900 text-center font-medium">
                    ₩{item.amount.toLocaleString()}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600 text-center">
                    <div>{item.paymentMethod}</div>
                    <div className="text-xs text-gray-400">
                      {item.paymentInfo}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        item.status === "completed"
                          ? "bg-green-100 text-green-700"
                          : item.status === "failed"
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {item.status === "completed"
                        ? "완료"
                        : item.status === "failed"
                        ? "실패"
                        : "대기중"}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    {item.status === "completed" && (
                      <button className="text-blue-600 hover:text-blue-700 text-sm">
                        다운로드
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 페이지네이션 */}
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-gray-700">
            총 {chargeHistory.length}개의 충전 내역
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
