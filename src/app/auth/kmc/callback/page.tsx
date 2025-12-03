"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function KmcAuthCallbackContent() {
  const searchParams = useSearchParams();

  useEffect(() => {
    // 에러 체크
    const error = searchParams.get("error");
    if (error) {
      console.error("KMC 콜백 에러:", error);
      alert("본인인증 처리 중 오류가 발생했습니다.");
      if (window.opener) {
        const origin =
          window.location.origin ||
          `${window.location.protocol}//${window.location.host}`;
        window.opener.postMessage(
          {
            type: "kmc-auth-failed",
            error: error === "missing_params"
              ? "인증 정보가 누락되었습니다."
              : "본인인증 처리 중 오류가 발생했습니다.",
          },
          origin
        );
        window.close();
      } else {
        window.location.href = "/signup";
      }
      return;
    }

    // URL 파라미터에서 토큰과 요청번호 추출
    const apiToken = searchParams.get("apiToken") || "";
    const certNum = searchParams.get("certNum") || "";

    // 필수 파라미터 확인
    if (!apiToken || !certNum) {
      console.error("KMC 콜백 오류: 필수 파라미터 누락");
      alert("인증 정보를 확인할 수 없습니다.");
      if (window.opener) {
        window.close();
      } else {
        window.location.href = "/signup";
      }
      return;
    }

    // success 페이지로 이동
    const params = new URLSearchParams({
      apiToken,
      certNum,
    });

    const successUrl = `/auth/kmc/success?${params.toString()}`;
    window.location.href = successUrl;
  }, [searchParams]);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        flexDirection: "column",
      }}
    >
      <h2>본인인증 처리 중...</h2>
      <p>잠시만 기다려주세요.</p>
    </div>
  );
}

export default function KmcAuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
            flexDirection: "column",
          }}
        >
          <h2>로딩 중...</h2>
        </div>
      }
    >
      <KmcAuthCallbackContent />
    </Suspense>
  );
}
