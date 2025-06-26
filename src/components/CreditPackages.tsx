import { useState, useEffect } from "react";

interface Package {
  id: number;
  name: string;
  credits: number;
  bonus_credits: number;
  price: number;
  is_popular: boolean;
  description: string;
}

export function CreditPackages({
  onCharge,
}: {
  onCharge: (packageInfo: {
    id: number;
    credits: number;
    price: number;
    bonus: number;
    popular?: boolean;
  }) => void;
}) {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/credit-packages");

        if (!response.ok) {
          throw new Error("크레딧 패키지 조회에 실패했습니다.");
        }

        const data = await response.json();
        setPackages(data.packages || []);
      } catch (err) {
        console.error("크레딧 패키지 로드 오류:", err);
        setError(
          err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPackages();
  }, []);

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">
          크레딧 충전 패키지
        </h3>
        <div className="text-center py-8">
          <div className="text-gray-500">패키지 정보를 불러오는 중...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">
          크레딧 충전 패키지
        </h3>
        <div className="text-center py-8">
          <div className="text-red-500">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-6">
        크레딧 충전 패키지
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {packages.map((pkg) => (
          <div
            key={pkg.id}
            className={`relative border-2 rounded-lg p-4 cursor-pointer transition-colors ${
              pkg.is_popular
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 hover:border-blue-300"
            }`}
          >
            {pkg.is_popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm">
                  인기
                </span>
              </div>
            )}
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900 mb-1">
                {pkg.name}
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {pkg.credits.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600 mb-2">크레딧</div>
              {pkg.bonus_credits > 0 && (
                <div className="text-sm text-green-600 mb-2">
                  +{pkg.bonus_credits.toLocaleString()} 보너스
                </div>
              )}
              <div className="text-xl font-bold text-blue-600">
                ₩{pkg.price.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500 mb-3">
                {pkg.description}
              </div>
              <button
                onClick={() =>
                  onCharge({
                    id: pkg.id,
                    credits: pkg.credits,
                    price: pkg.price,
                    bonus: pkg.bonus_credits,
                    popular: pkg.is_popular,
                  })
                }
                className="w-full mt-2 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
              >
                충전하기
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
