"use client";

import React from "react";

const RcsMessageContent = () => {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <div className="text-blue-500 text-6xl mb-4">🔵</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          RCS 문자
        </h3>
        <p className="text-gray-600">
          RCS(Rich Communication Services) 메시지 발송 기능을 준비하고 있습니다.
        </p>
      </div>
    </div>
  );
};

export default RcsMessageContent;