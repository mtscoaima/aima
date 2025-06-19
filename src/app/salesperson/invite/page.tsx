"use client";

import React, { useState } from "react";
import { SalespersonGuard } from "@/components/RoleGuard";

export default function InvitePage() {
  const [inviteCode, setInviteCode] = useState("");
  const [inviteLink, setInviteLink] = useState("");

  const generateInviteLink = () => {
    const code = Math.random().toString(36).substring(2, 15);
    const link = `${window.location.origin}/signup?ref=${code}`;
    setInviteCode(code);
    setInviteLink(link);
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
            <h1>초대 링크 생성</h1>
            <p>새로운 고객을 추천하기 위한 초대 링크를 생성하세요.</p>
          </div>

          <div className="invite-content">
            <div className="invite-generator">
              <div className="generator-card">
                <h3>새 초대 링크 생성</h3>
                <p>
                  고객이 이 링크를 통해 가입하면 추천 리워드를 받을 수 있습니다.
                </p>

                <button onClick={generateInviteLink} className="generate-btn">
                  초대 링크 생성하기
                </button>

                {inviteLink && (
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

            <div className="invite-history">
              <h3>생성된 초대 링크 관리</h3>

              <div className="history-list">
                <div className="history-item">
                  <div className="history-info">
                    <div className="history-code">ABC123DEF</div>
                    <div className="history-stats">
                      <span>가입: 5명</span>
                      <span>리워드: ₩75,000</span>
                    </div>
                    <div className="history-date">2024-01-15 생성</div>
                  </div>
                  <div className="history-actions">
                    <button className="copy-btn">복사</button>
                    <button className="disable-btn">비활성화</button>
                  </div>
                </div>

                <div className="history-item">
                  <div className="history-info">
                    <div className="history-code">XYZ789GHI</div>
                    <div className="history-stats">
                      <span>가입: 12명</span>
                      <span>리워드: ₩180,000</span>
                    </div>
                    <div className="history-date">2024-01-10 생성</div>
                  </div>
                  <div className="history-actions">
                    <button className="copy-btn">복사</button>
                    <button className="disable-btn">비활성화</button>
                  </div>
                </div>

                <div className="history-item disabled">
                  <div className="history-info">
                    <div className="history-code">OLD456JKL</div>
                    <div className="history-stats">
                      <span>가입: 3명</span>
                      <span>리워드: ₩45,000</span>
                    </div>
                    <div className="history-date">
                      2024-01-05 생성 (비활성화됨)
                    </div>
                  </div>
                  <div className="history-actions">
                    <button className="enable-btn">활성화</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SalespersonGuard>
  );
}
