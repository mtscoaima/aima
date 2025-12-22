"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";

export default function FindPasswordPage() {
  const [selectedMethod, setSelectedMethod] = useState<
    "phone" | "email"
  >("phone");
  const [formData, setFormData] = useState({
    username: "",
    name: "",
    email: "",
  });
  const [isVerificationLoading, setIsVerificationLoading] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [resultMessage, setResultMessage] = useState("");

  // 최신 formData 값을 참조하기 위한 ref
  const formDataRef = useRef(formData);

  // formData가 변경될 때마다 ref 업데이트
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  // 본인인증 팝업 메시지 리스너
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      if (event.data.type === "kmc-auth-success") {
        // 본인인증 성공
        const { verificationId: vId } = event.data;

        // 본인인증 정보로 비밀번호 찾기 API 호출
        findPasswordByVerification(vId);
      } else if (event.data.type === "kmc-auth-failed") {
        // 본인인증 실패
        alert(`본인인증에 실패했습니다: ${event.data.resultMsg}`);
        setIsVerificationLoading(false);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []); // 의존성 배열을 다시 빈 배열로 설정

  const handleMethodSelect = (method: "phone" | "email") => {
    setSelectedMethod(method);
    setShowResult(false);
    setResultMessage("");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePhoneVerification = async () => {
    if (!formData.username.trim()) {
      alert("아이디를 입력해주세요.");
      return;
    }

    setIsVerificationLoading(true);

    try {
      // KMC 본인확인 요청 API 호출
      const response = await fetch("/api/auth/kmc-auth/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        throw new Error("본인인증 요청에 실패했습니다.");
      }

      const data = await response.json();

      // 팝업창 열기
      const width = 400;
      const height = 640;
      const left = (window.innerWidth - width) / 2;
      const top = (window.innerHeight - height) / 2;

      const popup = window.open(
        "",
        "kmc_identity_auth",
        `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
      );

      // 팝업 차단 확인
      if (!popup || popup.closed || typeof popup.closed === "undefined") {
        alert("팝업이 차단되었습니다. 팝업 차단을 해제해주세요.");
        setIsVerificationLoading(false);
        return;
      }

      // 팝업 닫힘 감지
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          setIsVerificationLoading(false);
        }
      }, 1000);

      // 타임아웃 설정 (5분)
      setTimeout(() => {
        if (!popup.closed) {
          popup.close();
        }
        clearInterval(checkClosed);
        setIsVerificationLoading(false);
      }, 300000);

      // 폼 생성 및 제출
      const form = document.createElement("form");
      form.method = "POST";
      form.action = data.authUrl;
      form.target = "kmc_identity_auth";

      // 파라미터 추가
      Object.entries(data.params).forEach(([key, value]) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = value as string;
        form.appendChild(input);
      });

      // 폼을 body에 추가하고 제출
      document.body.appendChild(form);
      form.submit();

      // 폼 제거
      document.body.removeChild(form);
    } catch (error) {
      console.error("본인인증 요청 오류:", error);
      alert("본인인증 요청 중 오류가 발생했습니다.");
      setIsVerificationLoading(false);
    }
  };

  const findPasswordByVerification = async (vId: string) => {
    try {
      const response = await fetch("/api/auth/find-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          verificationId: vId,
          username: formDataRef.current.username, // ref를 사용하여 최신 값 참조
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setResultMessage(
          data.message || "임시 비밀번호가 등록된 이메일로 전송되었습니다."
        );
      } else {
        setResultMessage(
          data.message || "비밀번호 찾기 중 오류가 발생했습니다."
        );
      }
    } catch (error) {
      console.error("비밀번호 찾기 오류:", error);
      setResultMessage("비밀번호 찾기 중 오류가 발생했습니다.");
    } finally {
      setShowResult(true);
      setIsVerificationLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch("/api/auth/find-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: formData.username,
          name: formData.name,
          email: formData.email,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setResultMessage(
          data.message || "임시 비밀번호가 이메일로 전송되었습니다."
        );
      } else {
        setResultMessage(
          data.message || "비밀번호 찾기 중 오류가 발생했습니다."
        );
      }
    } catch (error) {
      console.error("비밀번호 찾기 오류:", error);
      setResultMessage("비밀번호 찾기 중 오류가 발생했습니다.");
    } finally {
      setShowResult(true);
    }
  };

  const resetForm = () => {
    setSelectedMethod("phone");
    setShowResult(false);
    setResultMessage("");
    setFormData({ username: "", name: "", email: "" });
  };

  return (
    <div className="min-h-[calc(100vh-120px)] flex items-center justify-center p-5 max-[768px]:min-h-[calc(100vh-100px)] max-[768px]:p-4 max-[768px]:pt-[120px] max-[480px]:min-h-[calc(100vh-80px)] max-[480px]:p-3 max-[480px]:pt-[100px]">
      <div className="w-full max-w-[440px]">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-[28px] font-bold text-[#1f2937] m-0 max-[768px]:text-2xl max-[480px]:text-xl">비밀번호 찾기</h1>
        </div>

        <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06)] p-8 my-5 max-[768px]:p-6 max-[480px]:p-5">
          {/* 콘텐츠 영역 */}
          <div className="mb-8">
            {showResult ? (
              // 결과 표시
              <div className="text-center py-8 max-[480px]:py-6">
                <div className="mb-6">
                  <p className="text-base text-[#374151] leading-[1.5] m-0 max-[480px]:text-sm">{resultMessage}</p>
                </div>
                <div className="flex gap-3 justify-center max-[480px]:flex-col max-[480px]:gap-2">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="bg-[#f8fafc] text-[#374151] border-2 border-[#e5e7eb] py-3 px-6 rounded-lg text-sm font-semibold cursor-pointer transition-all duration-200 no-underline hover:border-[#d1d5db] hover:bg-[#f3f4f6] max-[480px]:py-3.5 max-[480px]:px-5"
                  >
                    다시 찾기
                  </button>
                  <Link href="/login" className="bg-[#0070f3] text-white border-2 border-[#0070f3] py-3 px-6 rounded-lg text-sm font-semibold cursor-pointer transition-all duration-200 no-underline hover:bg-[#0051cc] hover:border-[#0051cc] hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(0,112,243,0.3)] max-[480px]:py-3.5 max-[480px]:px-5">
                    로그인하기
                  </Link>
                </div>
              </div>
            ) : selectedMethod === "phone" ? (
              // 휴대폰 인증 단계
              <div className="flex flex-col gap-5">
                <div className="flex gap-3 justify-center max-[768px]:flex-col max-[768px]:gap-2">
                  <button
                    type="button"
                    className="flex-1 py-3 px-4 border-2 border-[#0070f3] bg-[#eff6ff] text-[#0070f3] rounded-lg text-sm font-medium cursor-pointer transition-all duration-200 max-[768px]:py-3.5 max-[480px]:text-[13px] max-[480px]:py-3 max-[480px]:px-3.5"
                    onClick={() => handleMethodSelect("phone")}
                  >
                    휴대폰 본인인증
                  </button>
                  <button
                    type="button"
                    className="flex-1 py-3 px-4 border-2 border-[#e5e7eb] bg-white text-[#374151] rounded-lg text-sm font-medium cursor-pointer transition-all duration-200 hover:border-[#0070f3] hover:text-[#0070f3] max-[768px]:py-3.5 max-[480px]:text-[13px] max-[480px]:py-3 max-[480px]:px-3.5"
                    onClick={() => handleMethodSelect("email")}
                  >
                    이메일 인증
                  </button>
                </div>
                <p className="text-[#64748b] text-sm text-center m-0 leading-[1.5] bg-[#f8fafc] p-4 rounded-lg border border-[#e2e8f0] max-[480px]:text-[13px] max-[480px]:p-3">
                  아이디와 휴대폰 본인인증으로 비밀번호 찾기를 진행해주세요.
                </p>
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-2">
                    <label htmlFor="username" className="text-sm font-semibold text-[#374151]">
                      아이디 <span className="text-[#ef4444]">*</span>
                    </label>
                    <input
                      type="text"
                      id="username"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      className="w-full py-3.5 px-4 border-2 border-[#e5e7eb] rounded-lg text-base text-[#1f2937] transition-all duration-200 bg-[#fafafa] box-border focus:outline-none focus:border-[#0070f3] focus:bg-white focus:shadow-[0_0_0_3px_rgba(0,112,243,0.1)] placeholder:text-[#9ca3af] max-[480px]:py-3 max-[480px]:px-3.5 max-[480px]:text-[15px]"
                      placeholder="아이디를 입력해 주세요"
                      required
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handlePhoneVerification}
                    className="w-full bg-[#0070f3] text-white border-none py-4 px-4 rounded-lg text-base font-semibold cursor-pointer transition-all duration-200 mt-2 hover:bg-[#0051cc] hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(0,112,243,0.3)] disabled:bg-[#9ca3af] disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none max-[480px]:py-3.5 max-[480px]:text-[15px]"
                    disabled={
                      isVerificationLoading || !formData.username.trim()
                    }
                  >
                    {isVerificationLoading
                      ? "인증 진행 중..."
                      : "휴대폰 본인인증"}
                  </button>
                </div>
              </div>
            ) : (
              // 이메일 인증 단계
              <div className="flex flex-col gap-5">
                <div className="flex gap-3 justify-center max-[768px]:flex-col max-[768px]:gap-2">
                  <button
                    type="button"
                    className="flex-1 py-3 px-4 border-2 border-[#e5e7eb] bg-white text-[#374151] rounded-lg text-sm font-medium cursor-pointer transition-all duration-200 hover:border-[#0070f3] hover:text-[#0070f3] max-[768px]:py-3.5 max-[480px]:text-[13px] max-[480px]:py-3 max-[480px]:px-3.5"
                    onClick={() => handleMethodSelect("phone")}
                  >
                    휴대폰 본인인증
                  </button>
                  <button
                    type="button"
                    className="flex-1 py-3 px-4 border-2 border-[#0070f3] bg-[#eff6ff] text-[#0070f3] rounded-lg text-sm font-medium cursor-pointer transition-all duration-200 max-[768px]:py-3.5 max-[480px]:text-[13px] max-[480px]:py-3 max-[480px]:px-3.5"
                    onClick={() => handleMethodSelect("email")}
                  >
                    이메일 인증
                  </button>
                </div>
                <p className="text-[#64748b] text-sm text-center m-0 leading-[1.5] bg-[#f8fafc] p-4 rounded-lg border border-[#e2e8f0] max-[480px]:text-[13px] max-[480px]:p-3">
                  회원정보에 등록된 이메일로 비밀번호 찾기를 진행해주세요.
                </p>
                <form onSubmit={handleEmailSubmit} className="flex flex-col gap-5">
                  <div className="flex flex-col gap-2">
                    <label htmlFor="username" className="text-sm font-semibold text-[#374151]">
                      아이디 <span className="text-[#ef4444]">*</span>
                    </label>
                    <input
                      type="text"
                      id="username"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      className="w-full py-3.5 px-4 border-2 border-[#e5e7eb] rounded-lg text-base text-[#1f2937] transition-all duration-200 bg-[#fafafa] box-border focus:outline-none focus:border-[#0070f3] focus:bg-white focus:shadow-[0_0_0_3px_rgba(0,112,243,0.1)] placeholder:text-[#9ca3af] max-[480px]:py-3 max-[480px]:px-3.5 max-[480px]:text-[15px]"
                      placeholder="아이디를 입력해 주세요"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label htmlFor="name" className="text-sm font-semibold text-[#374151]">
                      이름 <span className="text-[#ef4444]">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full py-3.5 px-4 border-2 border-[#e5e7eb] rounded-lg text-base text-[#1f2937] transition-all duration-200 bg-[#fafafa] box-border focus:outline-none focus:border-[#0070f3] focus:bg-white focus:shadow-[0_0_0_3px_rgba(0,112,243,0.1)] placeholder:text-[#9ca3af] max-[480px]:py-3 max-[480px]:px-3.5 max-[480px]:text-[15px]"
                      placeholder="이름을 입력해 주세요"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label htmlFor="email" className="text-sm font-semibold text-[#374151]">
                      이메일 <span className="text-[#ef4444]">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full py-3.5 px-4 border-2 border-[#e5e7eb] rounded-lg text-base text-[#1f2937] transition-all duration-200 bg-[#fafafa] box-border focus:outline-none focus:border-[#0070f3] focus:bg-white focus:shadow-[0_0_0_3px_rgba(0,112,243,0.1)] placeholder:text-[#9ca3af] max-[480px]:py-3 max-[480px]:px-3.5 max-[480px]:text-[15px]"
                      placeholder="이메일 주소를 입력해 주세요"
                      required
                    />
                  </div>
                  <button type="submit" className="w-full bg-[#0070f3] text-white border-none py-4 px-4 rounded-lg text-base font-semibold cursor-pointer transition-all duration-200 mt-2 hover:bg-[#0051cc] hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(0,112,243,0.3)] disabled:bg-[#9ca3af] disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none max-[480px]:py-3.5 max-[480px]:text-[15px]">
                    인증요청
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* 하단 링크 */}
          {!showResult && (
            <div className="flex justify-between items-center pt-6 border-t border-[#e5e7eb] max-[768px]:flex-col max-[768px]:gap-4 max-[768px]:items-stretch">
              <Link href="/login" className="text-[#0070f3] no-underline font-semibold text-sm hover:underline hover:text-[#0051cc] max-[768px]:text-center max-[768px]:py-2">
                로그인으로 돌아가기
              </Link>
              <Link
                href="/auth/find-username"
                className="text-[#64748b] no-underline text-sm hover:underline hover:text-[#475569] max-[768px]:text-center max-[768px]:py-2"
              >
                아이디 찾기
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
