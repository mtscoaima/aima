"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function InicisAuthCallbackContent() {
  const searchParams = useSearchParams();

  useEffect(() => {
    // 에러 체크
    const error = searchParams.get("error");
    if (error) {
      console.error("❌ 에러 파라미터 감지:", error);
      alert("본인인증 처리 중 오류가 발생했습니다.");
      if (window.opener) {
        const origin =
          window.location.origin ||
          `${window.location.protocol}//${window.location.host}`;
        window.opener.postMessage(
          {
            type: "inicis-auth-failed",
            resultCode: "ERROR",
            resultMsg:
              error === "invalid_resultCode"
                ? "잘못된 인증 결과입니다."
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

    // URL 파라미터에서 인증 결과 추출 - 안전하게 처리
    const resultCode = searchParams.get("resultCode") || "";
    const resultMsg = searchParams.get("resultMsg") || "";
    const authRequestUrl = searchParams.get("authRequestUrl") || "";
    const txId = searchParams.get("txId") || "";
    const token = searchParams.get("token") || "";

    // 필수 파라미터 확인
    if (!resultCode) {
      console.error("❌ resultCode가 없습니다");
      alert("인증 결과를 확인할 수 없습니다.");
      if (window.opener) {
        window.close();
      } else {
        window.location.href = "/signup";
      }
      return;
    }

    if (resultCode === "0000") {
      // 인증 성공 - success 페이지로 이동
      // 빈 값은 제외하고 파라미터 생성
      const params = new URLSearchParams();
      if (resultCode) params.append("resultCode", resultCode);
      if (resultMsg) params.append("resultMsg", resultMsg);
      if (authRequestUrl) params.append("authRequestUrl", authRequestUrl);
      if (txId) params.append("txId", txId);
      if (token) params.append("token", token);

      const successUrl = `/auth/inicis/success?${params.toString()}`;

      window.location.href = successUrl;
    } else {
      if (window.opener) {
        const origin =
          window.location.origin ||
          `${window.location.protocol}//${window.location.host}`;
        window.opener.postMessage(
          {
            type: "inicis-auth-failed",
            resultCode,
            resultMsg,
          },
          origin
        );
        window.close();
      } else {
        // 팝업이 아닌 경우 회원가입 페이지로 리디렉션
        alert(`본인인증에 실패했습니다: ${resultMsg || "알 수 없는 오류"}`);
        window.location.href = "/signup";
      }
    }
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

export default function InicisAuthCallbackPage() {
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
      <InicisAuthCallbackContent />
    </Suspense>
  );
}
