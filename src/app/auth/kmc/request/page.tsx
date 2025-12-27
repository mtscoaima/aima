"use client";

import { useEffect, useState, Suspense, useRef } from "react";

function KmcAuthRequestContent() {
  const [error, setError] = useState<string | null>(null);
  const processedRef = useRef(false);

  useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;

    const startAuth = async () => {
      try {
        const response = await fetch("/api/auth/kmc-auth/request", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });

        if (!response.ok) throw new Error("인증 요청 초기화 실패");
        const data = await response.json();

        if (data.success && data.authUrl && data.params) {
          const form = document.createElement("form");
          form.method = "POST";
          form.action = data.authUrl;

          Object.entries(data.params).forEach(([key, value]) => {
            const input = document.createElement("input");
            input.type = "hidden";
            input.name = key;
            input.value = value as string;
            form.appendChild(input);
          });

          document.body.appendChild(form);
          form.submit();
        } else {
          throw new Error("인증 정보 수신 실패");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "알 수 없는 오류");
      }
    };

    startAuth();
  }, []);

  if (error) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", flexDirection: "column", padding: "20px", textAlign: "center" }}>
        <h2 style={{ color: "#d32f2f" }}>인증 요청 실패</h2>
        <p>{error}</p>
        <button onClick={() => window.close()} style={{ marginTop: "20px", padding: "10px 20px", cursor: "pointer" }}>창 닫기</button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", flexDirection: "column" }}>
      <h2>본인인증 페이지로 연결 중...</h2>
      <p>잠시만 기다려 주세요.</p>
    </div>
  );
}

export default function KmcAuthRequestPage() {
  return (
    <Suspense fallback={<div>로딩 중...</div>}>
      <KmcAuthRequestContent />
    </Suspense>
  );
}
