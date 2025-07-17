"use client";

import { useEffect } from "react";

export default function PaymentClosePage() {
  useEffect(() => {
    // KG이니시스 결제창 닫기 스크립트 로드
    const script = document.createElement("script");
    script.src = "https://stdpay.inicis.com/stdjs/INIStdPay_close.js";
    script.charset = "UTF-8";
    script.type = "text/javascript";

    document.body.appendChild(script);

    // 정리
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          결제창을 닫는 중...
        </h1>
        <p className="text-gray-600">
          잠시만 기다려주세요. 결제창이 자동으로 닫힙니다.
        </p>
      </div>
    </div>
  );
}
