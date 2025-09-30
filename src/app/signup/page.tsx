"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import GeneralSignupForm from "@/components/signup/GeneralSignupForm";

export default function SignupPage() {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();

  // 이미 로그인된 사용자는 대시보드로 리다이렉트
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === "ADMIN") {
        router.replace("/admin/user-management");
      } else if (user.role === "SALESPERSON") {
        router.replace("/salesperson/referrals");
      } else {
        router.replace("/my-site/advertiser/dashboard");
      }
    }
  }, [isAuthenticated, user, router]);

  // 로그인된 사용자에게는 로딩 화면 표시
  if (isAuthenticated) {
    return (
      <div className="min-h-[calc(100vh-120px)] flex items-center justify-center p-5 z-[1] relative max-[768px]:min-h-[calc(100vh-100px)] max-[768px]:p-4 max-[480px]:min-h-[calc(100vh-80px)] max-[480px]:p-3">
        <div className="w-full max-w-[440px]">
          <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-md p-8 relative z-[2] my-5 max-[768px]:p-6 max-[480px]:p-5">
            <div style={{ textAlign: "center", padding: "2rem" }}>
              <p>이미 로그인되어 있습니다. 대시보드로 이동합니다...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 일반 회원가입 폼 표시
  return <GeneralSignupForm />;
}