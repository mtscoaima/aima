import { useState } from "react";

interface ChargeInputProps {
  onCharge: (chargeInfo: {
    id: string;
    name: string;
    amount: number;
    price: number;
  }) => void;
}

export function ChargeInput({ onCharge }: ChargeInputProps) {
  const [amount, setAmount] = useState<string>("10,000");
  const [error, setError] = useState<string>("");

  const MIN_AMOUNT = 10000;
  const MAX_AMOUNT = 1000000;

  const formatNumber = (value: string) => {
    const number = value.replace(/[^\d]/g, "");
    return number.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numericValue = value.replace(/[^\d]/g, "");
    const numberValue = parseInt(numericValue) || 0;

    setAmount(formatNumber(numericValue));

    // 실시간 검증
    if (numericValue === "") {
      setError("");
    } else if (numberValue < MIN_AMOUNT) {
      setError("");
    } else if (numberValue > MAX_AMOUNT) {
      setError(`최대 충전 금액은 ${MAX_AMOUNT.toLocaleString()}원입니다.`);
    } else {
      setError("");
    }
  };

  const handleQuickAmount = (quickAmount: number) => {
    setAmount(quickAmount.toLocaleString());
    setError("");
  };

  const handleCharge = () => {
    const numericAmount = parseInt(amount.replace(/,/g, "")) || 0;

    if (numericAmount < MIN_AMOUNT) {
      setError(`최소 충전 금액은 ${MIN_AMOUNT.toLocaleString()}원 이상 부터 가능합니다`);
      return;
    }

    if (numericAmount > MAX_AMOUNT) {
      setError(`최대 충전 금액은 ${MAX_AMOUNT.toLocaleString()}원입니다.`);
      return;
    }

    onCharge({
      id: `charge_${Date.now()}`,
      name: `광고머니 ${numericAmount.toLocaleString()}원 충전`,
      amount: numericAmount,
      price: numericAmount,
    });
  };

  const numericAmount = parseInt(amount.replace(/,/g, "")) || 0;
  const isValidAmount = numericAmount >= MIN_AMOUNT && numericAmount <= MAX_AMOUNT;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-6">
        광고머니 충전
      </h3>
      
      <div className="space-y-4">
        <div>
          <label htmlFor="charge-amount" className="block text-sm font-medium text-gray-700 mb-3">
            충전 금액 입력
          </label>
          
          <div className="relative">
            <input
              type="text"
              id="charge-amount"
              value={amount}
              onChange={handleAmountChange}
              className="w-full px-4 py-4 text-2xl font-bold text-right border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className={`mt-2 px-3 py-2 text-sm rounded ${
            numericAmount < MIN_AMOUNT 
              ? "bg-yellow-100 text-yellow-800" 
              : error 
                ? "bg-red-100 text-red-800"
                : "bg-transparent"
          }`}>
            {numericAmount < MIN_AMOUNT 
              ? `결제 금액은 최소 ${MIN_AMOUNT.toLocaleString()}원 이상 부터 가능합니다`
              : error
                ? error
                : ""
            }
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3 mt-4">
          {[
            { label: "1만", amount: 10000 },
            { label: "5만", amount: 50000 },
            { label: "10만", amount: 100000 },
            { label: "50만", amount: 500000 }
          ].map((option) => (
            <button
              key={option.amount}
              onClick={() => handleQuickAmount(option.amount)}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {option.label}
            </button>
          ))}
        </div>

        <button
          onClick={handleCharge}
          disabled={!isValidAmount}
          className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
            isValidAmount
              ? "bg-blue-500 text-white hover:bg-blue-600"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
        >
          {isValidAmount 
            ? `${amount}원 충전하기` 
            : "금액을 입력하세요"
          }
        </button>
      </div>
    </div>
  );
}