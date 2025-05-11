'use client'

import React, { useState } from 'react';
import './ReceiverSelector.css';

const ReceiverSelector: React.FC = () => {
  const [receivers, setReceivers] = useState<string[]>([]);
  const [newReceiver, setNewReceiver] = useState('');

  const addReceiver = () => {
    if (newReceiver.trim() !== '') {
      setReceivers([...receivers, newReceiver.trim()]);
      setNewReceiver('');
    }
  };

  const removeReceiver = (index: number) => {
    const updatedReceivers = [...receivers];
    updatedReceivers.splice(index, 1);
    setReceivers(updatedReceivers);
  };

  return (
    <div className="receiver-selector">
      <h2>수신자 정보</h2>
      
      <div className="receiver-input-section">
        <input
          type="text"
          value={newReceiver}
          onChange={(e) => setNewReceiver(e.target.value)}
          placeholder="수신자 번호 입력"
          className="receiver-input"
        />
        <button className="add-receiver-btn" onClick={addReceiver}>
          추가
        </button>
      </div>
      
      <div className="import-options">
        <button className="import-btn">
          <span className="icon">📁</span>
          주소록
        </button>
        <button className="import-btn">
          <span className="icon">📊</span>
          엑셀
        </button>
        <button className="import-btn">
          <span className="icon">📝</span>
          메모장
        </button>
      </div>
      
      <div className="receivers-list">
        <div className="receivers-header">
          <span>수신자 목록</span>
          <span className="receivers-count">{receivers.length}명</span>
        </div>
        
        {receivers.length > 0 ? (
          <ul className="receivers">
            {receivers.map((receiver, index) => (
              <li key={index} className="receiver-item">
                <span>{receiver}</span>
                <button 
                  className="remove-receiver-btn"
                  onClick={() => removeReceiver(index)}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="no-receivers">
            수신자가 없습니다. 수신자를 추가하세요.
          </div>
        )}
      </div>
      
      <div className="receivers-actions">
        <button className="clear-all-btn">모두 삭제</button>
        <button className="duplicate-check-btn">중복 확인</button>
      </div>
    </div>
  );
};

export default ReceiverSelector; 