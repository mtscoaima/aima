"use client";

import { useEffect, useState, Suspense, useRef } from "react";
import { useSearchParams } from "next/navigation";

function KmcAuthSuccessContent() {
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

        // URL 파라미터에서 토큰과 요청번호 추출
        const apiToken = searchParams.get("apiToken") || "";
        const certNum = searchParams.get("certNum") || "";

        if (!apiToken || !certNum) {
          throw new Error("인증 정보가 누락되었습니다.");
        }

        // 서버로 인증 결과 전송하여 사용자 정보 복호화
        const response = await fetch("/api/auth/kmc-auth/result", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ apiToken, certNum }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || data.message || "인증 결과 처리 중 오류가 발생했습니다.");
        }

        if (data.success && data.userInfo) {
          // 부모 창에 사용자 정보 전달
          if (window.opener) {
            const origin =
              window.location.origin ||
              `${window.location.protocol}//${window.location.host}`;
            
            console.log("[KMC] Sending success message to opener");
            window.opener.postMessage(
              {
                type: "kmc-auth-success",
                userInfo: data.userInfo,
                verificationId: data.verificationId,
              },
              origin
            );

            // 팝업 닫기 (메시지 전달 후 즉시 시도)
            window.close();
            
            // 만약 위 명령으로 안 닫힐 경우를 대비한 2차 시도
            setTimeout(() => {
              if (!window.closed) window.close();
            }, 500);
          } else {
            // 팝업이 아닌 경우(새 탭 등) 처리
            console.warn("[KMC] No opener found, redirecting to signup");
            const signupParams = new URLSearchParams({
              verified: "true",
              verificationId: data.verificationId,
              name: data.userInfo.name,
              phone: data.userInfo.phoneNumber,
              birthDate: data.userInfo.birthDate
            });
            window.location.href = `/signup?${signupParams.toString()}`;
          }
        } else {
          throw new Error(data.message || "인증 정보를 가져올 수 없습니다.");
        }
      } catch (err) {
        console.error("KMC 인증 처리 오류:", err);
        setError(
          err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다."
        );
        setIsProcessing(false);

        // 부모 창에 실패 메시지 전달
        if (window.opener) {
          const origin =
            window.location.origin ||
            `${window.location.protocol}//${window.location.host}`;
          window.opener.postMessage(
            {
              type: "kmc-auth-failed",
              error: err instanceof Error ? err.message : "알 수 없는 오류",
            },
            origin
          );
        }
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

export default function KmcAuthSuccessPage() {
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
      <KmcAuthSuccessContent />
    </Suspense>
  );
}
