interface Package {
  id: number;
  credits: number;
  price: number;
  bonus: number;
  popular: boolean;
}

export function CreditPackages({
  onCharge,
}: {
  onCharge: (packageInfo: Package) => void;
}) {
  const packages = [
    {
      id: 1,
      credits: 1000,
      price: 10000,
      bonus: 0,
      popular: false,
    },
    {
      id: 2,
      credits: 3000,
      price: 28000,
      bonus: 200,
      popular: true,
    },
    {
      id: 3,
      credits: 5000,
      price: 45000,
      bonus: 500,
      popular: false,
    },
    {
      id: 4,
      credits: 10000,
      price: 85000,
      bonus: 1500,
      popular: false,
    },
  ];

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
              pkg.popular
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 hover:border-blue-300"
            }`}
          >
            {pkg.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm">
                  인기
                </span>
              </div>
            )}
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {pkg.credits.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600 mb-2">크레딧</div>
              {pkg.bonus > 0 && (
                <div className="text-sm text-green-600 mb-2">
                  +{pkg.bonus} 보너스
                </div>
              )}
              <div className="text-xl font-bold text-blue-600">
                ₩{pkg.price.toLocaleString()}
              </div>
              <button
                onClick={() => onCharge(pkg)}
                className="w-full mt-4 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
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
