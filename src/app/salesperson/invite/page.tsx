"use client";

import React, { useState, useEffect, useCallback } from "react";
import { SalespersonGuard } from "@/components/RoleGuard";
import { useAuth } from "@/contexts/AuthContext";

export default function InvitePage() {
  const [inviteCode, setInviteCode] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [linkStats, setLinkStats] = useState({
    clickCount: 0,
    signupCount: 0,
  });
  const [isStatsLoading, setIsStatsLoading] = useState(false);
  const { user } = useAuth();

  // 추천 통계 데이터 가져오기
  const fetchReferralStats = useCallback(async () => {
    if (!user?.referralCode) return;

    setIsStatsLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return;

      const response = await fetch("/api/users/referral-stats", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setLinkStats({
          clickCount: data.clickCount,
          signupCount: data.signupCount,
        });
      }
    } catch (err) {
      console.error("추천 통계 조회 오류:", err);
    } finally {
      setIsStatsLoading(false);
    }
  }, [user?.referralCode]);

  // 컴포넌트 마운트 시 기존 추천 코드 확인 및 통계 데이터 로드
  useEffect(() => {
    if (user?.referralCode) {
      setInviteCode(user.referralCode);
      setInviteLink(
        `${window.location.origin}/signup?code=${user.referralCode}`
      );
      fetchReferralStats();
    }
  }, [user, fetchReferralStats]);

  const generateInviteLink = async () => {
    setIsLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        throw new Error("로그인이 필요합니다.");
      }

      const response = await fetch("/api/users/generate-code", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "추천 코드 생성에 실패했습니다.");
      }

      const data = await response.json();
      const code = data.referralCode;
      const link = `${window.location.origin}/signup?code=${code}`;

      setInviteCode(code);
      setInviteLink(link);

      if (data.isNew) {
        setLinkStats({
          clickCount: 0,
          signupCount: 0,
        });
        fetchReferralStats();
        alert("새로운 추천 코드가 생성되었습니다!");
      } else {
        fetchReferralStats();
      }
    } catch (err) {
      console.error("추천 코드 생성 오류:", err);
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("클립보드에 복사되었습니다!");
  };

  return (
    <SalespersonGuard>
      <div className="salesperson-page">
        <div className="page-container">
          <div className="page-header">
            <h1>초대 링크 관리</h1>
            <p>새로운 고객을 추천하기 위한 초대 링크를 관리하세요.</p>
          </div>

          <div className="invite-content">
            <div className="invite-generator">
              <div className="generator-card">
                <h3>추천 코드 생성</h3>
                <p>
                  고객이 이 코드를 통해 가입하면 추천 리워드를 받을 수 있습니다.
                </p>

                {error && (
                  <div
                    className="error-message"
                    style={{ color: "red", marginBottom: "16px" }}
                  >
                    {error}
                  </div>
                )}

                {!inviteCode ? (
                  <button
                    onClick={generateInviteLink}
                    className="generate-btn"
                    disabled={isLoading}
                  >
                    {isLoading ? "생성 중..." : "추천 코드 생성하기"}
                  </button>
                ) : (
                  <div className="generated-link">
                    <div className="link-section">
                      <label>초대 코드</label>
                      <div className="code-display">
                        <span>{inviteCode}</span>
                        <button onClick={() => copyToClipboard(inviteCode)}>
                          복사
                        </button>
                      </div>
                    </div>

                    <div className="link-section">
                      <label>초대 링크</label>
                      <div className="link-display">
                        <span>{inviteLink}</span>
                        <button onClick={() => copyToClipboard(inviteLink)}>
                          복사
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {inviteCode && (
              <div className="invite-history">
                <h3>초대 링크 통계</h3>

                <div className="link-stats-card">
                  <div className="stats-header">
                    <div className="stats-code">{inviteCode}</div>
                    <div className="stats-status active">활성</div>
                  </div>

                  <div className="stats-content">
                    <div className="stat-item">
                      <div className="stat-label">링크 클릭 수</div>
                      <div className="stat-value">
                        {isStatsLoading
                          ? "로딩중..."
                          : `${linkStats.clickCount}회`}
                      </div>
                    </div>

                    <div className="stat-item">
                      <div className="stat-label">가입 수</div>
                      <div className="stat-value">
                        {isStatsLoading
                          ? "로딩중..."
                          : `${linkStats.signupCount}명`}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </SalespersonGuard>
  );
}
