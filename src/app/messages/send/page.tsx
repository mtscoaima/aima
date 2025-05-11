import React from 'react';
import MessageSendForm from '../../../components/MessageSendForm';
import ReceiverSelector from '../../../components/ReceiverSelector';
import './styles.css';

export default function MessageSendPage() {
  return (
    <div className="message-page-container">
      <div className="message-page-header">
        <h1>문자메시지 전송</h1>
        <p>고객에게 마케팅 메시지를 보내고 결과를 추적하세요</p>
      </div>
      <div className="message-page-content">
        <MessageSendForm />
        <ReceiverSelector />
      </div>
    </div>
  );
} 