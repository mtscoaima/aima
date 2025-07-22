"use client";

import { useEffect, useState, Suspense, useRef } from "react";
import { useSearchParams } from "next/navigation";

function InicisAuthSuccessContent() {
  const searchParams = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const processedRef = useRef(false); // 중복 실행 방지

  useEffect(() => {
    // 이미 처리했으면 스킵
    if (processedRef.current) return;

    const processAuthResult = async () => {
      try {
        processedRef.current = true; // 처리 시작 표시

        // URL 파라미터에서 인증 결과 추출
        const params = {
          resultCode: searchParams.get("resultCode") || "",
          resultMsg: searchParams.get("resultMsg") || "",
          authRequestUrl: searchParams.get("authRequestUrl") || "",
          txId: searchParams.get("txId") || "",
          token: searchParams.get("token") || "",
        };

        // 서버로 인증 결과 전송하여 사용자 정보 복호화
        const response = await fetch("/api/auth/inicis-auth/result", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(params),
        });

        if (!response.ok) {
          throw new Error("인증 결과 처리 중 오류가 발생했습니다.");
        }

        const data = await response.json();

        if (data.success && data.userInfo) {
          // 부모 창에 사용자 정보 전달
          if (window.opener) {
            const origin =
              window.location.origin ||
              `${window.location.protocol}//${window.location.host}`;
            window.opener.postMessage(
              {
                type: "inicis-auth-success",
                userInfo: data.userInfo,
                verificationId: data.verificationId,
              },
              origin
            );

            // 팝업 닫기
            setTimeout(() => {
              window.close();
            }, 500);
          } else {
            // 팝업이 아닌 경우 회원가입 페이지로 리디렉션 (쿼리 파라미터로 정보 전달)
            const signupParams = new URLSearchParams({
              verified: "true",
              verificationId: data.verificationId,
            });
            window.location.href = `/signup?${signupParams.toString()}`;
          }
        } else {
          throw new Error(data.message || "인증 정보를 가져올 수 없습니다.");
        }
      } catch (err) {
        console.error("인증 처리 오류:", err);
        setError(
          err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다."
        );
        setIsProcessing(false);
      }
    };

    processAuthResult();
  }, [searchParams]);

  if (error) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          flexDirection: "column",
          padding: "20px",
          textAlign: "center",
        }}
      >
        <h2 style={{ color: "#d32f2f" }}>인증 처리 실패</h2>
        <p>{error}</p>
        <button
          onClick={() => window.close()}
          style={{
            marginTop: "20px",
            padding: "10px 20px",
            backgroundColor: "#1976d2",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          창 닫기
        </button>
      </div>
    );
  }

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
      <h2>본인인증 성공</h2>
      {isProcessing ? (
        <>
          <p>인증 정보를 처리 중입니다...</p>
          <p style={{ fontSize: "14px", color: "#666" }}>
            잠시 후 자동으로 창이 닫힙니다.
          </p>
        </>
      ) : (
        <p>창을 닫아주세요.</p>
      )}
    </div>
  );
}

export default function InicisAuthSuccessPage() {
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
      <InicisAuthSuccessContent />
    </Suspense>
  );
}
