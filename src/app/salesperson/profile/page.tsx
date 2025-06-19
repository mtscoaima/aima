"use client";

import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function SalespersonProfilePage() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handlePasswordChange = () => {
    // 비밀번호 변경 로직
    console.log("비밀번호 변경");
  };

  return (
    <div className="salesperson-page">
      <div className="page-container">
        <div className="page-header">
          <h1>마이페이지</h1>
        </div>

        <div className="profile-content">
          {/* 개인정보 섹션 */}
          <div className="profile-section">
            <h3>개인정보</h3>
            <div className="profile-info-container">
              <div className="profile-avatar">
                <div className="avatar-circle">
                  {(user?.name || user?.email || "").charAt(0).toUpperCase()}
                </div>
              </div>
              <div className="profile-details">
                <div className="profile-item">
                  <span className="profile-label">이름</span>
                  <span className="profile-value">김영업</span>
                </div>
                <div className="profile-item">
                  <span className="profile-label">이메일</span>
                  <span className="profile-value">kim.sales@example.com</span>
                </div>
                <div className="profile-item">
                  <span className="profile-label">영업사원 등급</span>
                  <span className="profile-value">최우수 파트너</span>
                </div>
                <div className="profile-item">
                  <span className="profile-label">가입일</span>
                  <span className="profile-value">2023-01-15</span>
                </div>
                <button className="edit-profile-btn">개인정보 수정</button>
              </div>
            </div>
          </div>

          {/* 계정 설정 섹션 */}
          <div className="account-section">
            <h3>계정 설정</h3>
            <div className="password-form">
              <div className="form-group">
                <label>현재 비밀번호</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="현재 비밀번호"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>새 비밀번호</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="새 비밀번호 입력"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>새 비밀번호 확인</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="새 비밀번호 다시 입력"
                  className="form-input"
                />
              </div>
              <button onClick={handlePasswordChange} className="save-btn">
                비밀번호 변경
              </button>
            </div>
          </div>

          {/* 활동 로그 섹션 */}
          <div className="activity-log-section">
            <h3>활동 로그</h3>
            <div className="log-info">
              <p>최근 로그인 기록 및 주요 활동 로그를 여기서 표시합니다.</p>
            </div>
            <div className="log-entries">
              <div className="log-entry">
                <span className="log-label">로그인</span>
                <span className="log-value">
                  2025년 6월 19일 09:27 AM (IP: 123.45.67.89)
                </span>
              </div>
              <div className="log-entry">
                <span className="log-label">최대 활동 생성</span>
                <span className="log-value">2025년 6월 18일 03:15 PM</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
