"use client";

import React from "react";

const MessageSendPage = () => {
  return (
    <div className="min-h-[calc(100vh-140px)] flex flex-col p-5 relative">
      <div className="flex-1 flex flex-col max-w-6xl w-full mx-auto">
        <header className="mb-8">
          <h1 className="text-black text-2xl font-semibold leading-tight tracking-tight m-0 mb-2">메시지 발송</h1>
        </header>

        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-gray-400 text-6xl mb-4">📱</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              메시지 발송
            </h3>
            <p className="text-gray-600 mb-6">
              메시지 발송 기능을 준비하고 있습니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageSendPage;