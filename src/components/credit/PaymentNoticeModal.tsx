"use client";

import React from "react";

interface PaymentNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PaymentNoticeModal: React.FC<PaymentNoticeModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const handleCopyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert(`${type}이(가) 클립보드에 복사되었습니다.`);
    } catch (error) {
      console.error("복사 실패:", error);
      alert("복사에 실패했습니다.");
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>충전 안내</h3>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        
        <div className="modal-body">
          <div className="notice-content">
            <div className="notice-title">
              현재 온라인결제 준비중입니다.
            </div>
            
            <div className="notice-text">
              광고머니를 충전하시려면 아래 계좌로 입금 후 연락 부탁드립니다.<br/>
              충전 금액은 최소 10,000원 부터 가능합니다.
            </div>
            
            <div className="account-info">
              <div className="info-row">
                <span className="info-label">계좌:</span>
                <div className="info-value-container">
                  <span className="info-value">농협 301-0372-6312-41</span>
                  <button 
                    className="copy-button"
                    onClick={() => handleCopyToClipboard("301-0372-6312-41", "계좌번호")}
                  >
                    복사
                  </button>
                </div>
              </div>
              
              <div className="info-row">
                <span className="info-label">연락처:</span>
                <div className="info-value-container">
                  <span className="info-value">010-9459-2733</span>
                  <button 
                    className="copy-button"
                    onClick={() => handleCopyToClipboard("010-9459-2733", "연락처")}
                  >
                    복사
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="modal-footer">
          <button className="btn-primary" onClick={onClose}>
            확인
          </button>
        </div>
      </div>
      
      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: white;
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
          max-width: 500px;
          width: 90%;
          max-height: 80vh;
          overflow: hidden;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid #e5e8ec;
        }

        .modal-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: #333333;
        }

        .modal-close {
          background: none;
          border: none;
          font-size: 24px;
          color: #666666;
          cursor: pointer;
          padding: 0;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: all 0.2s ease;
        }

        .modal-close:hover {
          background: #f5f5f5;
          color: #333333;
        }

        .modal-body {
          padding: 24px;
        }

        .notice-content {
          text-align: center;
        }

        .notice-title {
          font-size: 16px;
          font-weight: 600;
          color: #333333;
          margin-bottom: 16px;
        }

        .notice-text {
          font-size: 14px;
          color: #666666;
          line-height: 1.5;
          margin-bottom: 24px;
        }

        .account-info {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 20px;
          text-align: left;
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .info-row:last-child {
          margin-bottom: 0;
        }

        .info-label {
          font-weight: 500;
          color: #666666;
          min-width: 60px;
        }

        .info-value-container {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .info-value {
          font-weight: 600;
          color: #333333;
          font-family: monospace;
        }

        .copy-button {
          background: #0066ff;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 4px 8px;
          font-size: 12px;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .copy-button:hover {
          background: #0052cc;
        }

        .modal-footer {
          display: flex;
          justify-content: center;
          padding: 20px 24px;
          border-top: 1px solid #e5e8ec;
        }

        .btn-primary {
          background-color: #0066ff;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 6px;
          font-weight: 500;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
          min-width: 100px;
        }

        .btn-primary:hover {
          background-color: #0052cc;
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0, 102, 255, 0.3);
        }
      `}</style>
    </div>
  );
};

export default PaymentNoticeModal;